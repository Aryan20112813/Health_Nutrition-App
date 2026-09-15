# Personalized Health & Nutrition Management System — MongoDB Schema Specification

**Document ID:** Schema  
**Status:** Baseline / Persistence source of truth  
**Version:** 1.0  

## 1. Modeling Principles

MongoDB should be modeled around real application access patterns rather than copying relational-table design. Embed small, tightly coupled data that is usually read together; reference data when it is high-cardinality, independently accessed, or would grow without bound. MongoDB documents that embed related data can reduce extra reads, while references are appropriate when child data has independent lifecycle or high cardinality. citeturn728973search0turn728973search8

The MVP deliberately uses a small set of collections. Do not create a collection just because a noun exists in the PRD.

## 2. Selected Collections

| Collection | Required now? | Purpose |
|---|---|---|
| `users` | Yes | Authentication identity and minimal account data. |
| `sessions` | Yes | Server-side refresh-session lifecycle. |
| `bmiRecords` | Yes | User BMI history. |
| `foods` | Yes | Curated nutrition catalog. |
| `calorieLogs` | Yes | User food/meal intake history. |
| `dietPlans` | Yes | Generated plan snapshots with embedded meals. |
| `exercises` | Yes | Exercise catalog. |
| `workouts` | Yes | User-specific recommended/completed workout records. |
| `foodRecognitionResults` | Phase 6 only | Recognition audit/confirmation state. |

No standalone `profiles`, `meals`, or `userPreferences` collection is required initially. Profile/preferences are embedded in `users`; meals are embedded in `dietPlans`; meal-log lines are embedded in individual `calorieLogs` documents only when representing one user action.

## 3. `users`

### Purpose

Identity plus the minimal profile/preferences required by current features.

### Shape

```javascript
{
  _id: ObjectId,
  email: String,              // required, normalized, unique
  passwordHash: String,       // required, never returned
  status: "active" | "disabled",
  profile: {
    displayName: String,
    dateOfBirth: Date,        // optional; avoid collecting age if DOB is unnecessary
    sex: "female" | "male" | "other" | "prefer_not_to_say",
    heightCm: Number,
    weightKg: Number,
    goal: "maintain" | "lose_weight" | "gain_weight" | "improve_fitness",
    activityLevel: "sedentary" | "light" | "moderate" | "high",
    fitnessLevel: "beginner" | "intermediate" | "advanced"
  },
  preferences: {
    dietaryPreference: "omnivore" | "vegetarian" | "vegan" | "other",
    restrictions: [String],
    excludedFoods: [String],
    equipment: [String],
    workoutDurationMin: Number,
    mealsPerDay: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Validation

- Email normalized to lowercase/trimmed.
- Password never stored directly; only the hash.
- Height/weight positive and within product-defined safe validation ranges.
- Enumerations enforced through Mongoose enum.
- Array lengths bounded to prevent abuse.

### Indexes

- `{ email: 1 }` unique.

### Privacy

Treat profile and preferences as sensitive wellness data. Exclude `passwordHash` from normal projections/responses.

## 4. `sessions`

### Purpose

Refresh-token rotation/revocation without storing raw refresh tokens.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,            // ref users
  tokenHash: String,           // required, unique
  expiresAt: Date,
  revokedAt: Date | null,
  replacedBySessionId: ObjectId | null,
  userAgentHash: String | null,
  createdIpHash: String | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ tokenHash: 1 }` unique.
- `{ userId: 1, expiresAt: 1 }`.
- TTL on `expiresAt` if operational policy supports automatic cleanup; revoked sessions can remain until TTL cleanup.

Do not store raw IPs or user agents unless an operational/security requirement explicitly justifies it.

## 5. `bmiRecords`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,             // ref users
  heightCm: Number,
  weightKg: Number,
  bmi: Number,
  category: "underweight" | "normal" | "overweight" | "obesity",
  recordedAt: Date,
  createdAt: Date
}
```

### Indexes

- `{ userId: 1, recordedAt: -1 }`.

Store input measurements alongside the calculated result so historical records remain reproducible.

## 6. `foods`

### Purpose

Curated nutrition catalog and future mapping target for external/AI food identification.

```javascript
{
  _id: ObjectId,
  name: String,
  normalizedName: String,
  category: String,
  serving: {
    amount: Number,
    unit: "g" | "ml" | "piece" | "serving"
  },
  nutritionPerServing: {
    calories: Number,
    proteinG: Number,
    carbsG: Number,
    fatG: Number,
    fiberG: Number | null
  },
  alternativeUnits: [
    {
      unit: "g" | "ml" | "piece",
      gramsEquivalent: Number
    }
  ],
  tags: [String],
  dietaryTags: [String],
  source: "curated" | "external_import",
  sourceReference: String | null,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ normalizedName: 1 }`.
- Optional text/index strategy after measuring catalog search performance.

### Privacy

Food catalog data is not private. Do not store user-specific data here.

## 7. `calorieLogs`

A single document represents one logged food item/serving action. This keeps writes simple and allows safe editing/deletion.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: String,                  // YYYY-MM-DD in user's configured timezone
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  foodId: ObjectId | null,       // ref foods when catalog-based
  foodNameSnapshot: String,
  quantity: Number,
  unit: "g" | "ml" | "piece" | "serving",
  nutrition: {
    calories: Number,
    proteinG: Number,
    carbsG: Number,
    fatG: Number,
    fiberG: Number | null
  },
  source: "catalog" | "manual" | "food_recognition",
  sourceRecognitionId: ObjectId | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Why snapshot nutrition?

Historical calorie intake should not change when a catalog item's nutrition values are corrected later. The log stores the values used at the time of logging.

### Indexes

- `{ userId: 1, date: -1 }`.
- `{ userId: 1, date: -1, mealType: 1 }`.

## 8. `dietPlans`

Embed plan meals because the plan and its meal items are generated together and normally displayed together. This follows MongoDB guidance to embed data that is accessed together and has bounded size. citeturn728973search3turn728973search8

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  status: "current" | "archived",
  goal: String,
  estimatedCalorieTarget: Number,
  nutritionTarget: {
    proteinG: Number | null,
    carbsG: Number | null,
    fatG: Number | null
  },
  preferencesSnapshot: {
    dietaryPreference: String,
    restrictions: [String],
    mealsPerDay: Number
  },
  meals: [
    {
      _id: ObjectId,
      mealType: String,
      title: String,
      description: String,
      foods: [
        {
          foodId: ObjectId | null,
          foodNameSnapshot: String,
          quantity: Number,
          unit: String,
          calories: Number,
          proteinG: Number,
          carbsG: Number,
          fatG: Number
        }
      ],
      totals: {
        calories: Number,
        proteinG: Number,
        carbsG: Number,
        fatG: Number
      }
    }
  ],
  generatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ userId: 1, status: 1, generatedAt: -1 }`.

Avoid unbounded growth of meals within one plan. Archive/replace old plans rather than endlessly appending versions into one document.

## 9. `exercises`

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  muscleGroups: [String],
  goalTags: [String],
  fitnessLevels: [String],
  equipment: [String],
  movementPattern: String,
  instructions: [String],
  safetyNotes: [String],
  defaultPrescription: {
    sets: Number | null,
    reps: String | null,
    durationSec: Number | null,
    restSec: Number | null
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

Add targeted indexes only after query pattern is stable, such as `{ isActive: 1, goalTags: 1, fitnessLevels: 1 }`.

## 10. `workouts`

A user-specific workout snapshot. References exercises but stores the prescription used at the time.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  goal: String,
  durationMin: Number,
  equipmentSnapshot: [String],
  exercises: [
    {
      exerciseId: ObjectId,
      nameSnapshot: String,
      sets: Number | null,
      reps: String | null,
      durationSec: Number | null,
      restSec: Number | null,
      order: Number
    }
  ],
  status: "recommended" | "started" | "completed" | "skipped",
  completedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ userId: 1, createdAt: -1 }`.
- `{ userId: 1, status: 1, createdAt: -1 }`.

## 11. `foodRecognitionResults` — Phase 6

Store only what is required for confirmation/audit. Prefer not to persist original image bytes.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  imageReference: String | null,
  provider: String,
  providerRequestId: String | null,
  candidates: [
    {
      label: String,
      normalizedLabel: String | null,
      confidence: Number | null,
      foodId: ObjectId | null
    }
  ],
  selectedFoodId: ObjectId | null,
  status: "pending" | "confirmed" | "rejected" | "failed",
  errorCode: String | null,
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date | null
}
```

### Retention

Recognition artifacts should have a short retention window unless a product requirement requires history. A TTL index on `expiresAt` can support cleanup.

## 12. Relationships

```text
users
 ├── 1:N → sessions
 ├── 1:N → bmiRecords
 ├── 1:N → calorieLogs
 ├── 1:N → dietPlans
 ├── 1:N → workouts
 └── 1:N → foodRecognitionResults

foods
 ├── referenced by calorieLogs
 ├── referenced by dietPlans.meals.foods
 └── referenced by foodRecognitionResults.candidates/selectedFoodId

exercises
 └── referenced by workouts.exercises
```

All user-owned one-to-many relationships are references at the collection level because histories can grow large. Small plan-specific meal data is embedded in a plan snapshot.

## 13. Embed vs Reference Decisions

| Data | Decision | Reason |
|---|---|---|
| `users.profile` | Embed | Usually read with user profile and bounded size. |
| `users.preferences` | Embed | Same lifecycle and bounded size. |
| Sessions | Reference | High churn and independent lifecycle. |
| BMI history | Reference collection | Potentially unbounded over time. |
| Calorie logs | Reference collection | High-cardinality, date-based queries. |
| Diet-plan meals | Embed | Read/updated with plan and bounded by meals/day. |
| Exercise catalog | Separate collection | Shared reusable reference data. |
| Workout exercise prescriptions | Embed snapshot + exercise reference | Preserves historical recommendation while reusing catalog identity. |
| Recognition candidates | Embed inside result | Small, short-lived provider response used with the result. |

MongoDB explicitly advises considering duplication, access patterns, cardinality, and growth when choosing references vs embedding. citeturn728973search1turn728973search8

## 14. Example Documents

### User

```json
{
  "email": "user@example.com",
  "status": "active",
  "profile": {
    "displayName": "Alex",
    "heightCm": 178,
    "weightKg": 68,
    "goal": "maintain",
    "activityLevel": "moderate",
    "fitnessLevel": "intermediate"
  },
  "preferences": {
    "dietaryPreference": "omnivore",
    "restrictions": [],
    "excludedFoods": [],
    "equipment": ["dumbbells", "bodyweight"],
    "workoutDurationMin": 45,
    "mealsPerDay": 3
  }
}
```

### Calorie log

```json
{
  "userId": "ObjectId(\"...\")",
  "date": "2026-09-15",
  "mealType": "lunch",
  "foodId": "ObjectId(\"...\")",
  "foodNameSnapshot": "Dal",
  "quantity": 200,
  "unit": "g",
  "nutrition": {
    "calories": 230,
    "proteinG": 14,
    "carbsG": 34,
    "fatG": 4
  },
  "source": "catalog"
}
```

### Diet plan excerpt

```json
{
  "status": "current",
  "goal": "maintain",
  "estimatedCalorieTarget": 2200,
  "meals": [
    {
      "mealType": "breakfast",
      "title": "Poha + Eggs",
      "foods": [
        { "foodNameSnapshot": "Poha", "quantity": 250, "unit": "g", "calories": 400 },
        { "foodNameSnapshot": "Egg", "quantity": 2, "unit": "piece", "calories": 140 }
      ]
    }
  ]
}
```

## 15. Data Privacy

### Store

- Account identity required for authentication.
- Minimum profile data needed for personalization.
- Wellness/nutrition logs required by user-selected features.

### Avoid storing

- Plaintext passwords.
- Raw authentication tokens.
- Raw image binaries in MongoDB unless a later requirement specifically needs them.
- Unnecessary medical history.
- Location data unless a feature explicitly requires it.

### Protection

- Role/ownership checks at every user-owned endpoint.
- Least-privilege database credentials.
- TLS in deployment.
- Encryption-at-rest provided/configured by hosting platform where applicable.
- Field-level encryption should be considered only for specific highly sensitive fields after threat modeling; do not add it to the MVP without a requirement.

MongoDB Atlas describes TLS encryption for connections and encryption at rest as core security capabilities. citeturn242487search1turn242487search3

## 16. Schema Evolution Rules

- Add fields backward-compatibly first.
- Default new optional fields safely.
- Do not make a new field required without handling existing documents.
- Migration scripts must be versioned when data transformation is required.
- Historical snapshots should remain immutable except for explicit correction workflows.

## 17. Traceability Matrix

| Requirement IDs | Collections / fields |
|---|---|
| `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003`, `FR-AUTH-004`, `FR-AUTH-005`, `FR-AUTH-006` | `users`, `sessions` |
| `FR-BMI-001`, `FR-BMI-002`, `FR-BMI-003`, `FR-BMI-004` | `bmiRecords` |
| `FR-CAL-001`..`FR-CAL-009` | `foods`, `calorieLogs` |
| `FR-DIET-001`..`FR-DIET-006` | `users.preferences`, `dietPlans` |
| `FR-EX-001`..`FR-EX-006` | `users.preferences`, `exercises`, `workouts` |
| `FR-AI-001`..`FR-AI-006` | `foodRecognitionResults`, `foods`, `calorieLogs` |

## 17. Traceability

- FR-AUTH-* → `users`, `sessions`
- FR-BMI-* → `bmiRecords`
- FR-CAL-* → `foods`, `calorieLogs`
- FR-DIET-* → `users.preferences`, `dietPlans`
- FR-EX-* → `users.preferences`, `exercises`, `workouts`
- FR-AI-* → `foods`, `foodRecognitionResults`, `calorieLogs`
