# Personalized Health & Nutrition Management System — Technical Specification

**Document ID:** TechSpec  
**Status:** Baseline / Technical source of truth  
**Version:** 1.0  

## 1. Technology Stack

| Concern | Choice | Why |
|---|---|---|
| Frontend | React 19.x (currently 19.3 at documentation baseline) | Component-based UI with mature ecosystem. The exact installed version should be locked in `package-lock.json`. |
| Language | JavaScript | Explicit product constraint and sufficient for the project's current scope. Use JSDoc/types through tooling where useful rather than introducing TypeScript as a hidden requirement. |
| Build tool | Vite | Fast local development and straightforward React SPA build. |
| Routing | React Router | Required by product constraint and supports protected/ nested routes. |
| Styling | CSS Modules + global CSS variables | Prevents style leakage while keeping styling simple and framework-light. Global CSS is limited to tokens/reset/layout primitives. |
| Form handling | React Hook Form | Reduces repetitive form state/validation code for onboarding and nutrition forms. |
| Validation | Zod | Explicit schemas make client/server validation easier to reason about. Backend remains authoritative. |
| HTTP | Native `fetch` with a small API client wrapper | Avoids an unnecessary HTTP dependency and centralizes credentials/error parsing. |
| Frontend state | React local state + Context for authentication/session UI only | No Redux. Server data remains owned by API calls/cache patterns; do not introduce global state without a demonstrated need. |
| Backend | Node.js + Express.js | Required stack; simple REST service boundary. |
| Middleware | Express middleware + small focused utilities | Keeps authentication, validation, logging, CORS, and error handling composable. |
| Database | MongoDB | Required document database and suitable for user-specific, nested nutrition documents. |
| ODM | Mongoose | Required; provides schemas, validation, models, indexes and middleware. |
| Password hashing | Argon2id | Preferred password hashing choice based on current OWASP guidance. |
| Authentication | JWT access token + rotating refresh token in HTTP-only cookies | Avoids localStorage token exposure and supports session revocation/rotation. |
| API testing | Postman or Bruno | Human-readable manual API verification during incremental development. |
| Unit/integration testing | Vitest for frontend/business utilities; Supertest + Node test runner or Vitest for backend | Keep test stack small; use one primary JS test runner where practical. |
| Browser testing | Playwright | Reliable end-to-end testing for critical flows. |
| Linting | ESLint | Consistent JS/React quality gates. |
| Formatting | Prettier | Deterministic formatting. |
| Version control | Git + GitHub | Required project workflow and review history. |
| CI | GitHub Actions | Run lint, tests, and build on push/PR before production. |

React's official documentation identifies 19.3 as the current version at this documentation baseline. citeturn728973search6

## 2. Architecture

```text
┌──────────────────────────────────────────┐
│ React SPA                                │
│ Pages → Components → API Client          │
└───────────────────┬──────────────────────┘
                    │ HTTPS/JSON
                    ▼
┌──────────────────────────────────────────┐
│ Express REST API                         │
│ Routes → Middleware → Controllers        │
│                ↓                         │
│             Services                     │
│                ↓                         │
│        Mongoose Models / Repos            │
└───────────────────┬──────────────────────┘
                    │ TLS
                    ▼
               MongoDB Atlas

External providers (Phase 6+) are reachable only from the server through adapters.
```

### Responsibility boundaries

- **Pages:** compose screen-level UI and coordinate route-specific concerns.
- **Components:** present UI and emit user actions; avoid database/business calculations when they can live in services/utils.
- **API client:** request construction, credentials, JSON parsing, standardized client-side error translation.
- **Routes:** map HTTP endpoints to middleware/controller pipeline.
- **Middleware:** authentication, validation, request IDs, rate limits, CORS, etc.
- **Controllers:** parse validated request data, call service methods, map service result to HTTP response.
- **Services:** business rules such as BMI calculation, calorie totals, plan generation, exercise filtering.
- **Models:** persistence schema and database indexes.
- **Adapters:** external provider interfaces, such as image recognition or nutrition lookup, isolated from domain logic.

## 3. Repository and Folder Structure

```text
/
├── client/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── bmi/
│   │   │   ├── calories/
│   │   │   ├── diet/
│   │   │   ├── exercises/
│   │   │   └── foodRecognition/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── adapters/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── docs/
└── README.md
```

Do not create a `repository/` abstraction for every model at the beginning. Add one only when query complexity or testing isolation justifies it.

## 4. API Conventions

Base path: `/api/v1`.

Response success:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Response error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": []
  }
}
```

Rules:

- JSON by default.
- Dates serialized as ISO-8601 strings.
- User-owned resources are scoped from the authenticated user, not from arbitrary client-supplied owner IDs.
- `POST` creates, `GET` reads, `PATCH` partially updates, `DELETE` deletes.
- Use `400` for malformed/invalid request syntax or validation where appropriate, `401` for unauthenticated, `403` for unauthorized, `404` for missing resource, `409` for conflicts, `413` for oversized uploads, `429` for rate limiting, and `500/502/503` for server/provider failures as appropriate.

## 5. API Inventory and Traceability

### Authentication

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create user and initial auth session. | FR-AUTH-001 |
| POST | `/api/v1/auth/login` | No | Authenticate user. | FR-AUTH-002 |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh session and issue new access token. | FR-AUTH-006 |
| POST | `/api/v1/auth/logout` | Access cookie | Revoke refresh session. | FR-AUTH-003, FR-AUTH-006 |
| PATCH | `/api/v1/auth/password` | Yes | Change current password. | FR-AUTH-005 |

### User/profile

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| GET | `/api/v1/users/me` | Yes | Read current user/profile/preferences. | FR-AUTH-004, FR-DIET-001, FR-EX-001 |
| PATCH | `/api/v1/users/me` | Yes | Update allowed profile/preferences fields. | FR-DIET-001, FR-EX-001 |

### BMI

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| POST | `/api/v1/bmi/records` | Yes | Validate inputs, calculate BMI, store record. | FR-BMI-001..004 |
| GET | `/api/v1/bmi/records` | Yes | Read own history, paginated/date-filtered. | FR-BMI-004 |

### Food/calorie tracking

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| GET | `/api/v1/foods` | Yes | Search internal food catalog. | FR-CAL-001 |
| POST | `/api/v1/calorie-logs` | Yes | Create one meal/food log entry. | FR-CAL-002..003, FR-CAL-008 |
| GET | `/api/v1/calorie-logs?date=YYYY-MM-DD` | Yes | Read one day's entries/totals. | FR-CAL-004, FR-CAL-006, FR-CAL-009 |
| PATCH | `/api/v1/calorie-logs/:id` | Yes | Edit own log entry. | FR-CAL-005 |
| DELETE | `/api/v1/calorie-logs/:id` | Yes | Delete own log entry. | FR-CAL-005 |

### Diet plans

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| POST | `/api/v1/diet-plans/generate` | Yes | Generate current plan from profile/preferences. | FR-DIET-002..003 |
| GET | `/api/v1/diet-plans/current` | Yes | Read current plan. | FR-DIET-003, FR-DIET-006 |
| POST | `/api/v1/diet-plans/:planId/replace-meal` | Yes | Replace compatible meal. | FR-DIET-004 |
| POST | `/api/v1/diet-plans/:planId/meals/:mealId/log` | Yes | Create calorie log from selected plan meal. | FR-DIET-005 |

### Exercises

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| GET | `/api/v1/exercises` | Yes | Filter/search exercise catalog. | FR-EX-002 |
| GET | `/api/v1/workouts/recommended` | Yes | Generate recommended workout from preferences. | FR-EX-002..004 |
| POST | `/api/v1/workouts/:workoutId/complete` | Yes | Record completion. | FR-EX-005 |

### Food recognition — Phase 6+

| Method | Endpoint | Auth | Purpose | Requirement IDs |
|---|---|---|---|---|
| POST | `/api/v1/food-recognition` | Yes | Validate image and run configured provider adapter. | FR-AI-001..004 |
| POST | `/api/v1/food-recognition/:id/confirm` | Yes | Confirm/correct candidate and optionally create log. | FR-AI-005..006 |

No other API should be added merely because a future feature may need one.

## 5A. MVP Calorie-Target Calculation Decision

The application uses an **estimate**, not a medical prescription. The MVP calculation service is deterministic so it can be unit-tested and explained.

Inputs: height, weight, age/date-of-birth-derived age, sex where provided, activity level, and goal.

Baseline approach:

```text
BMR = Mifflin-St Jeor estimate
TDEE = BMR × activity multiplier
Goal adjustment = small configurable percentage/energy adjustment
Estimated daily target = clamp(TDEE + goal adjustment, product safety bounds)
```

Implementation requirements:

- The exact constants/multipliers must live in versioned domain configuration, not UI code.
- The service must expose the calculation inputs and formula version for reproducibility.
- Missing inputs block personalized target generation rather than silently assuming values.
- The UI labels the result as an estimated target and includes a wellness disclaimer.
- The system must not claim that the estimate is medically appropriate for a specific condition.
- Any future methodology change creates a new formula version so historical diet-plan snapshots remain interpretable.

This decision intentionally keeps the formula deterministic and replaceable; it can later be reviewed by a qualified nutrition professional without redesigning the API boundary.

## 6. Request and Response Contracts

### Create calorie log — request

```json
{
  "foodId": "ObjectId",
  "mealType": "breakfast",
  "quantity": 150,
  "unit": "g",
  "date": "2026-09-15"
}
```

### Create calorie log — response data

```json
{
  "id": "ObjectId",
  "date": "2026-09-15",
  "mealType": "breakfast",
  "food": {
    "id": "ObjectId",
    "name": "Poha"
  },
  "quantity": 150,
  "unit": "g",
  "nutrition": {
    "calories": 245,
    "proteinG": 5.1,
    "carbsG": 42.0,
    "fatG": 6.4
  },
  "source": "catalog"
}
```

The nutrition values stored on the log are a **snapshot at the time of logging**, so later food-catalog edits do not silently rewrite historical intake.

## 7. Authentication Architecture

### Decision

Use:

- Argon2id password hashing.
- Short-lived access JWT: target 15 minutes.
- Rotating refresh token: target 7 days with revocation support.
- Tokens delivered in HTTP-only cookies.
- `Secure` enabled in production.
- `SameSite=Lax` by default; if deployment requires cross-site cookies, use `SameSite=None` only with `Secure` and add an explicit CSRF mitigation strategy.
- Refresh sessions stored server-side as hashed token identifiers with expiry and revocation metadata.

OWASP currently recommends memory-hard password hashing such as Argon2id rather than plaintext or fast hashes. citeturn242487search0

### Flow

```text
Login
 → validate body
 → lookup user
 → verify Argon2id hash
 → issue access JWT cookie
 → issue refresh cookie + persisted hashed session

Authenticated request
 → access-cookie middleware verifies JWT
 → req.user is populated

Access expired
 → client calls refresh
 → refresh cookie validated against stored session
 → rotate session
 → issue new access/refresh cookies
```

The client does not read tokens directly. Do not use `localStorage` for auth tokens.

## 8. External APIs / Services

### MVP decision: none required for core workflows

The MVP uses an internal `foods` catalog and internal deterministic recommendation logic. This is intentional: Phase 3 can be developed, tested, demonstrated, and deployed without vendor credentials, external outages, or changing API contracts.

### Candidate Phase 6+ services

| Service category | Candidate role | MVP? | Decision rule |
|---|---|---|---|
| Food nutrition database | Enrich/search broader catalog | No | Add only after defining data licensing, attribution, quality, and cost. |
| Food image recognition | Convert image → food candidates | No | Select after evaluating recognition quality, latency, Indian-food coverage, privacy, and price. |
| Object/image storage | Temporary/permanent image storage | No | Prefer direct-to-object-storage or short-lived server processing; do not persist images unless a product need exists. |
| Email delivery | Password reset/verification | No | Introduce only when email lifecycle requirements are approved. |

The architecture therefore defines an adapter interface rather than hard-coding a provider now.

### Provider failure behavior

- Timeout → return `502/503` with safe message and provider error code.
- Rate limit → retry only where safe; otherwise return a user-recoverable error.
- Invalid provider response → log sanitized diagnostic data and return `502`.
- Provider key missing → application health check should expose configuration failure to operators, not to end users.

## 9. Environment Variables

```text
NODE_ENV
PORT
MONGODB_URI
CLIENT_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL
COOKIE_DOMAIN
CORS_ORIGINS
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX
FOOD_RECOGNITION_PROVIDER
FOOD_RECOGNITION_API_KEY
STORAGE_PROVIDER
STORAGE_BUCKET
STORAGE_API_KEY
```

Only variables used by the current increment should be required at runtime. `.env.example` may document future variables but the application must not require them before their phase starts.

## 10. Error Handling

Central error middleware maps known application errors to the standard contract.

Typical codes:

```text
VALIDATION_ERROR
AUTH_INVALID_CREDENTIALS
AUTH_REQUIRED
AUTH_FORBIDDEN
AUTH_SESSION_EXPIRED
RESOURCE_NOT_FOUND
RESOURCE_CONFLICT
RATE_LIMITED
FILE_INVALID
EXTERNAL_PROVIDER_ERROR
INTERNAL_ERROR
```

Never return stack traces, database error objects, JWT secrets, provider credentials, or raw internal exception messages to clients in production.

## 11. Security Requirements

1. Passwords must use Argon2id with a unique salt generated by the password-hashing library.
2. Do not store access/refresh tokens in browser local storage.
3. Cookies carrying auth tokens must be HTTP-only and secure in production.
4. Implement CSRF protection for any configuration where auth cookies can be sent cross-site.
5. Restrict CORS to configured origins; do not use permissive wildcard CORS with credentials.
6. Validate and sanitize request payloads.
7. Use Mongoose query patterns that avoid accepting arbitrary MongoDB operators from clients.
8. Use rate limiting on authentication and expensive endpoints.
9. Apply maximum JSON body sizes.
10. Phase 6 image uploads require allow-listed MIME types, extension checks, byte-size limits, dimension checks, and safe processing.
11. Never log passwords, tokens, full health profiles, or raw private food images.
12. Use HTTPS in deployed environments.
13. Configure secure headers through vetted middleware where appropriate.
14. Keep dependencies patched and run an automated audit in CI.
15. Scope every user-owned database query by authenticated user ID.

MongoDB Atlas documents TLS for connections and encryption at rest as secure defaults/features; deployment configuration must still enforce least-privilege access and network restrictions. citeturn242487search1turn242487search2

## 12. Data Access Rules

- Do not query by `_id` alone for user-owned records; use `{ _id, userId }` or an equivalent ownership constraint.
- Prefer one aggregation/query for daily calorie totals where practical rather than N+1 item lookups.
- Use pagination for historical records.
- Search fields should have intentional indexes.
- Avoid `.populate()` by default; return only fields required by the endpoint.

MongoDB recommends choosing embedding vs references based on workload and access patterns; frequently co-read small data can be embedded, while high-cardinality or independently accessed data is often better referenced. citeturn728973search0turn728973search8

## 13. Architecture Decision Records

### ADR-001 — Internal food catalog before external nutrition API

**Options considered:** external API from Phase 3; internal seed catalog; hybrid import-first.  
**Chosen:** internal seed catalog.  
**Reason:** independent MVP, deterministic tests, no vendor failure/cost dependency.  
**Trade-offs:** smaller initial catalog and manual data curation.  
**Impact:** Phase 3 remains standalone; external enrichment can be introduced later behind a service/adapter.

### ADR-002 — Cookie-based JWT session

**Options:** localStorage JWT; in-memory token + re-login; HTTP-only cookies with refresh rotation.  
**Chosen:** HTTP-only cookie model with refresh rotation.  
**Reason:** better resistance to token theft from client-side script and supports revocation.  
**Trade-offs:** CSRF must be addressed carefully and cross-origin deployment needs deliberate cookie/CORS configuration.  
**Impact:** `sessions` collection and auth middleware are required.

### ADR-003 — CSS Modules + tokens

**Options:** Tailwind; CSS-in-JS; global CSS only; CSS Modules + CSS variables.  
**Chosen:** CSS Modules + CSS variables.  
**Reason:** keeps dependency footprint low while providing local component styles and a centralized design system.  
**Trade-offs:** more custom CSS than utility-first approaches.

### ADR-004 — Provider adapter for image recognition

**Options:** hard-code one provider; create a generic plugin platform; use a narrow adapter interface.  
**Chosen:** narrow adapter interface.  
**Reason:** avoids premature abstraction while preventing domain coupling to vendor APIs.  
**Trade-offs:** one small abstraction must be maintained before Phase 6.

## 14. Technical Assumptions / Unresolved Decisions

- Exact cloud/runtime deployment platform is not selected in this baseline.
- Exact Phase 6 recognition provider is intentionally unresolved until requirements around price, privacy, latency, and Indian-food accuracy are evaluated.
- Email verification/reset remains optional until an email provider is approved.
- For production, secrets should be managed by the deployment platform/secret manager rather than checked into Git.

## References

- React versions: https://react.dev/versions
- MongoDB data modeling: https://www.mongodb.com/docs/manual/data-modeling/
- MongoDB schema relationships: https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/
- OWASP password storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- MongoDB Atlas security: https://www.mongodb.com/docs/atlas/architecture/current/security/
