import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { AddressInfo } from 'net';
import { connectDatabase, disconnectDatabase } from '../src/config/db';
import { authRouter } from '../src/routes/auth';
import { foodsRouter } from '../src/routes/foods';
import { calorieLogsRouter } from '../src/routes/calorieLogs';
import { User } from '../src/models/User';
import { Session } from '../src/models/Session';
import { Food } from '../src/models/Food';
import { CalorieLog } from '../src/models/CalorieLog';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/foods', foodsRouter);
app.use('/api/v1/calorie-logs', calorieLogsRouter);
app.use(errorHandler);

describe('Calorie Tracking & Food Catalog API Suite (Phase 3)', () => {
  let server: http.Server;
  let baseUrl: string;

  let user1Cookie: string;
  let user2Cookie: string;
  let user1Id: string;
  let user2Id: string;

  const user1Email = `caltest_u1_${Date.now()}@nutripulse.health`;
  const user2Email = `caltest_u2_${Date.now()}@nutripulse.health`;

  beforeAll(async () => {
    await connectDatabase();

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // Register User 1
    const res1 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user1Email, password: 'SecurePassword123' }),
    });
    expect(res1.status).toBe(201);
    const setCookie1 = res1.headers.get('set-cookie') || '';
    user1Cookie = setCookie1.split(';')[0];
    const data1 = await res1.json();
    user1Id = data1.data.user.id;

    // Register User 2
    const res2 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user2Email, password: 'SecurePassword456' }),
    });
    expect(res2.status).toBe(201);
    const setCookie2 = res2.headers.get('set-cookie') || '';
    user2Cookie = setCookie2.split(';')[0];
    const data2 = await res2.json();
    user2Id = data2.data.user.id;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await CalorieLog.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await Session.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
    await disconnectDatabase();
  });

  it('FR-CAL-001: Enforces authentication and allows searching the food catalog', async () => {
    // Unauthenticated -> 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/foods`);
    expect(unauthRes.status).toBe(401);

    // Authenticated search for 'roti'
    const searchRes = await fetch(`${baseUrl}/api/v1/foods?query=roti`, {
      headers: { Cookie: user1Cookie },
    });
    expect(searchRes.status).toBe(200);
    const body = await searchRes.json();
    expect(body.success).toBe(true);
    expect(body.data.foods.length).toBeGreaterThan(0);
    const foundRoti = body.data.foods.find((f: any) => f.name.toLowerCase().includes('roti'));
    expect(foundRoti).toBeDefined();
    expect(foundRoti.serving).toBeDefined();
    expect(foundRoti.nutritionPerServing.calories).toBeGreaterThan(0);
  });

  it('FR-CAL-008: Rejects invalid or negative quantities with 400', async () => {
    const resNeg = await fetch(`${baseUrl}/api/v1/calorie-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        date: '2026-09-15',
        mealType: 'lunch',
        quantity: -2,
        unit: 'piece',
        manualFood: { name: 'Test', calories: 100, proteinG: 5, carbsG: 10, fatG: 2 },
      }),
    });
    expect(resNeg.status).toBe(400);

    const resZero = await fetch(`${baseUrl}/api/v1/calorie-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        date: '2026-09-15',
        mealType: 'lunch',
        quantity: 0,
        unit: 'piece',
        manualFood: { name: 'Test', calories: 100, proteinG: 5, carbsG: 10, fatG: 2 },
      }),
    });
    expect(resZero.status).toBe(400);
  });

  let catalogLogId: string;
  let sampleFoodItem: any;

  it('FR-CAL-002 & FR-CAL-003: Logs catalog food item and scales nutrition automatically', async () => {
    // Search for 'Yellow Dal'
    const searchRes = await fetch(`${baseUrl}/api/v1/foods?query=Dal`, {
      headers: { Cookie: user1Cookie },
    });
    const searchBody = await searchRes.json();
    sampleFoodItem = searchBody.data.foods[0];
    expect(sampleFoodItem).toBeDefined();

    // Log 300g (double the 150g serving)
    const logRes = await fetch(`${baseUrl}/api/v1/calorie-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        date: '2026-09-15',
        mealType: 'lunch',
        foodId: sampleFoodItem.id,
        quantity: sampleFoodItem.serving.amount * 2,
        unit: sampleFoodItem.serving.unit,
      }),
    });

    expect(logRes.status).toBe(201);
    const logBody = await logRes.json();
    expect(logBody.success).toBe(true);
    const record = logBody.data.log;
    catalogLogId = record.id;
    expect(record.foodNameSnapshot).toBe(sampleFoodItem.name);
    expect(record.source).toBe('catalog');
    // Nutrition should be doubled
    expect(record.nutrition.calories).toBe(Math.round(sampleFoodItem.nutritionPerServing.calories * 2));
    expect(record.nutrition.proteinG).toBe(
      Math.round(sampleFoodItem.nutritionPerServing.proteinG * 2 * 10) / 10
    );
  });

  it('FR-CAL-007: Records a manual food entry when item is not in catalog', async () => {
    const manualRes = await fetch(`${baseUrl}/api/v1/calorie-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        date: '2026-09-15',
        mealType: 'breakfast',
        quantity: 1,
        unit: 'serving',
        manualFood: {
          name: 'Homemade Almond Halwa',
          calories: 320,
          proteinG: 8.5,
          carbsG: 38.0,
          fatG: 16.0,
          fiberG: 3.0,
        },
      }),
    });

    expect(manualRes.status).toBe(201);
    const body = await manualRes.json();
    expect(body.success).toBe(true);
    expect(body.data.log.source).toBe('manual');
    expect(body.data.log.foodNameSnapshot).toBe('Homemade Almond Halwa');
    expect(body.data.log.nutrition.calories).toBe(320);
    expect(body.data.log.nutrition.proteinG).toBe(8.5);
  });

  it('FR-CAL-004, FR-CAL-006, FR-CAL-009: Retrieves daily calorie logs with summary, target, and macro totals', async () => {
    const getRes = await fetch(`${baseUrl}/api/v1/calorie-logs?date=2026-09-15`, {
      headers: { Cookie: user1Cookie },
    });

    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.success).toBe(true);
    expect(body.data.date).toBe('2026-09-15');
    expect(body.data.logs.length).toBe(2); // Dal + Halwa

    const summary = body.data.summary;
    expect(summary.targetCalories).toBeGreaterThan(0);
    expect(summary.consumedCalories).toBeGreaterThan(0);
    expect(summary.remainingCalories).toBe(
      Math.max(0, summary.targetCalories - summary.consumedCalories)
    );

    // Macro totals should be summed
    expect(summary.macroTotals.proteinG).toBeGreaterThan(0);
    expect(summary.macroTotals.carbsG).toBeGreaterThan(0);
    expect(summary.macroTotals.fatG).toBeGreaterThan(0);

    // Meal breakdown
    expect(summary.mealBreakdown.lunch.calories).toBeGreaterThan(0);
    expect(summary.mealBreakdown.breakfast.calories).toBe(320);
  });

  it('FR-CAL-005: Edits an existing calorie-log entry and recalculates nutrition', async () => {
    // Halve the quantity of the catalog item
    const patchRes = await fetch(`${baseUrl}/api/v1/calorie-logs/${catalogLogId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        quantity: sampleFoodItem.serving.amount, // 1x serving now instead of 2x
        unit: sampleFoodItem.serving.unit,
      }),
    });

    expect(patchRes.status).toBe(200);
    const body = await patchRes.json();
    expect(body.success).toBe(true);
    expect(body.data.log.quantity).toBe(sampleFoodItem.serving.amount);
    expect(body.data.log.nutrition.calories).toBe(sampleFoodItem.nutritionPerServing.calories);
  });

  it('FR-CAL-005: Deletes a calorie-log entry', async () => {
    const delRes = await fetch(`${baseUrl}/api/v1/calorie-logs/${catalogLogId}`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie },
    });

    expect(delRes.status).toBe(200);
    const body = await delRes.json();
    expect(body.success).toBe(true);

    // Verify it's gone from daily list
    const getRes = await fetch(`${baseUrl}/api/v1/calorie-logs?date=2026-09-15`, {
      headers: { Cookie: user1Cookie },
    });
    const getBody = await getRes.json();
    expect(getBody.data.logs.length).toBe(1); // Only halwa remains
  });

  it('Cross-User Data Isolation: User 2 cannot access, edit, or delete User 1 logs', async () => {
    // User 1 logs a private snack
    const resU1 = await fetch(`${baseUrl}/api/v1/calorie-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({
        date: '2026-09-16',
        mealType: 'snack',
        quantity: 1,
        unit: 'serving',
        manualFood: { name: 'User1 Secret Snack', calories: 200, proteinG: 4, carbsG: 20, fatG: 8 },
      }),
    });
    const u1LogData = await resU1.json();
    const u1LogId = u1LogData.data.log.id;

    // User 2 queries 2026-09-16 -> Should NOT see User 1's snack
    const u2GetRes = await fetch(`${baseUrl}/api/v1/calorie-logs?date=2026-09-16`, {
      headers: { Cookie: user2Cookie },
    });
    const u2Body = await u2GetRes.json();
    expect(u2Body.data.logs.length).toBe(0);
    expect(u2Body.data.summary.consumedCalories).toBe(0);

    // User 2 attempts to PATCH User 1's snack -> 403 Forbidden
    const u2PatchRes = await fetch(`${baseUrl}/api/v1/calorie-logs/${u1LogId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ quantity: 5 }),
    });
    expect(u2PatchRes.status).toBe(403);

    // User 2 attempts to DELETE User 1's snack -> 403 Forbidden
    const u2DelRes = await fetch(`${baseUrl}/api/v1/calorie-logs/${u1LogId}`, {
      method: 'DELETE',
      headers: { Cookie: user2Cookie },
    });
    expect(u2DelRes.status).toBe(403);
  });
});
