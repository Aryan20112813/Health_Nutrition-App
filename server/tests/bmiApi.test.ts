import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { AddressInfo } from 'net';
import { connectDatabase, disconnectDatabase } from '../src/config/db';
import { authRouter } from '../src/routes/auth';
import { bmiRouter } from '../src/routes/bmi';
import { User } from '../src/models/User';
import { Session } from '../src/models/Session';
import { BmiRecord } from '../src/models/BmiRecord';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/bmi', bmiRouter);
app.use(errorHandler);

describe('BMI API Integration & Security Suite (Phase 2)', () => {
  let server: http.Server;
  let baseUrl: string;

  let user1Cookie: string;
  let user2Cookie: string;
  let user1Id: string;
  let user2Id: string;

  const user1Email = `bmitest_u1_${Date.now()}@nutripulse.health`;
  const user2Email = `bmitest_u2_${Date.now()}@nutripulse.health`;

  beforeAll(async () => {
    await connectDatabase();

    // Start ephemeral HTTP server for native Node fetch
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
    await BmiRecord.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await Session.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
    await disconnectDatabase();
  });

  it('FR-BMI-004: Rejects unauthenticated requests to POST /api/v1/bmi/records with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heightCm: 175, weightKg: 70 }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('FR-BMI-004: Rejects unauthenticated requests to GET /api/v1/bmi/records with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/bmi/records`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('FR-BMI-001: Validates and rejects out-of-range height/weight values with 400', async () => {
    // Height too low
    const resLowHeight = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ heightCm: 30, weightKg: 70 }),
    });
    expect(resLowHeight.status).toBe(400);
    const body1 = await resLowHeight.json();
    expect(body1.success).toBe(false);

    // Weight too high
    const resHighWeight = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ heightCm: 175, weightKg: 500 }),
    });
    expect(resHighWeight.status).toBe(400);
    const body2 = await resHighWeight.json();
    expect(body2.success).toBe(false);
  });

  it('FR-BMI-001..003: Creates BMI record, calculates BMI & category, and updates user profile', async () => {
    // 175 cm, 70 kg -> BMI = 22.9 ('normal')
    const res = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ heightCm: 175, weightKg: 70 }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.record.bmi).toBe(22.9);
    expect(body.data.record.category).toBe('normal');
    expect(body.data.record.categoryLabel).toBe('Normal weight');
    expect(body.data.record.idealWeightRange).toBeDefined();
    expect(body.data.record.idealWeightRange.minKg).toBeGreaterThan(0);

    // Verify user document was updated
    const updatedUser = await User.findById(user1Id);
    expect(updatedUser?.profile.heightCm).toBe(175);
    expect(updatedUser?.profile.weightKg).toBe(70);
  });

  it('FR-BMI-004: Scopes BMI history strictly to the authenticated user (cross-user isolation)', async () => {
    // User 2 logs a record
    const resU2 = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
      body: JSON.stringify({ heightCm: 180, weightKg: 95 }), // 95 / 3.24 = 29.3 ('overweight')
    });

    expect(resU2.status).toBe(201);
    const bodyU2 = await resU2.json();
    expect(bodyU2.data.record.bmi).toBe(29.3);
    expect(bodyU2.data.record.category).toBe('overweight');

    // Fetch User 1 history -> Should NOT contain User 2's records
    const resU1History = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      headers: { Cookie: user1Cookie },
    });

    expect(resU1History.status).toBe(200);
    const bodyU1 = await resU1History.json();
    expect(bodyU1.data.records.length).toBe(1);
    expect(bodyU1.data.records[0].weightKg).toBe(70);

    // Fetch User 2 history -> Should contain User 2's record
    const resU2History = await fetch(`${baseUrl}/api/v1/bmi/records`, {
      headers: { Cookie: user2Cookie },
    });

    expect(resU2History.status).toBe(200);
    const bodyU2Hist = await resU2History.json();
    expect(bodyU2Hist.data.records.length).toBe(1);
    expect(bodyU2Hist.data.records[0].weightKg).toBe(95);
    expect(bodyU2Hist.data.records[0].category).toBe('overweight');
  });

  it('FR-BMI-004: Correctly paginates BMI records', async () => {
    // Add two more records for User 1
    await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ heightCm: 175, weightKg: 71 }),
    });

    await fetch(`${baseUrl}/api/v1/bmi/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
      body: JSON.stringify({ heightCm: 175, weightKg: 69 }),
    });

    // Request limit=2, page=1
    const page1Res = await fetch(`${baseUrl}/api/v1/bmi/records?limit=2&page=1`, {
      headers: { Cookie: user1Cookie },
    });
    expect(page1Res.status).toBe(200);
    const page1 = await page1Res.json();
    expect(page1.data.records.length).toBe(2);
    expect(page1.data.pagination.total).toBe(3);
    expect(page1.data.pagination.totalPages).toBe(2);

    // Request limit=2, page=2
    const page2Res = await fetch(`${baseUrl}/api/v1/bmi/records?limit=2&page=2`, {
      headers: { Cookie: user1Cookie },
    });
    expect(page2Res.status).toBe(200);
    const page2 = await page2Res.json();
    expect(page2.data.records.length).toBe(1);
  });
});
