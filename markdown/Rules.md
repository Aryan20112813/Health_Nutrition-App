# Personalized Health & Nutrition Management System — Engineering Constitution

**Document ID:** Rules  
**Status:** Mandatory  
**Version:** 1.0  

These rules apply to every human or AI coding agent working on the repository.

## 1. General Coding Rules

1. Write readable code over clever code.
2. Use meaningful names for variables, functions, components, endpoints, and modules.
3. Avoid unnecessary abstractions.
4. Avoid duplicate business logic.
5. Apply DRY where duplication harms consistency; do not create generic abstractions for one-time code.
6. Prefer composition over deep inheritance.
7. Keep functions focused.
8. Keep files manageable; split modules when responsibilities diverge.
9. Preserve existing behavior unless the current requirement explicitly changes it.
10. Prefer predictable control flow and explicit errors.

## 2. Incremental Development Rules

- Work in one active functional increment at a time.
- Implement only requirements assigned to the current increment unless a dependency is genuinely required.
- Keep the application runnable after every increment.
- Do not start several unrelated features in parallel.
- Before moving to the next increment, finish tests, regression checks, and documentation updates for the current increment.
- Do not create placeholder production APIs or database collections for future phases without a documented architectural reason.

## 3. React Rules

1. Use reusable components.
2. Avoid giant page components.
3. Separate UI concerns from business rules where practical.
4. Keep business calculations in testable utilities/services rather than burying them in JSX.
5. Handle loading, success, empty, and error states.
6. Validate forms on the client for usability but never rely on that validation for security.
7. Avoid unnecessary global state.
8. Use Context only when state is truly cross-cutting, such as authentication UI state.
9. Avoid prop drilling by first reconsidering component boundaries; introduce a global state library only when a measured need exists.
10. Use stable keys and semantic HTML.
11. Do not place secrets or server credentials in client code.
12. Do not use `localStorage` for authentication tokens.

## 4. Node/Express Rules

1. Keep controllers thin.
2. Put business logic in services.
3. Validate requests before database operations.
4. Use middleware for cross-cutting concerns.
5. Centralize error handling.
6. Use proper HTTP status codes.
7. Do not return raw internal errors to users.
8. Do not trust client-supplied ownership IDs.
9. Every user-owned resource must be scoped by the authenticated user.
10. External providers must be called from server-side adapters/services, never directly from the browser when credentials are secret.

## 5. MongoDB/Mongoose Rules

1. Use Mongoose schemas with explicit validation.
2. Call MongoDB collections “collections/documents”, not “tables/rows”.
3. Index intentionally based on actual query patterns.
4. Avoid unbounded arrays in documents.
5. Avoid excessive `.populate()` calls.
6. Avoid N+1 database queries.
7. Choose embed vs reference deliberately.
8. Preserve historical nutrition/workout snapshots where required by product behavior.
9. Never expose sensitive fields by default.
10. Use migrations or versioned scripts for non-trivial data transformations.

MongoDB guidance emphasizes workload-driven modeling and deliberate embedding vs referencing. citeturn728973search0turn728973search12

## 6. API Rules

Every API must:

- Follow REST conventions.
- Use `/api/v1` versioning.
- Have predictable resource naming.
- Validate input.
- Authenticate when required.
- Authorize when required.
- Return consistent success/error shapes.
- Use appropriate HTTP status codes.
- Handle downstream/provider failures safely.
- Be included in the traceability matrix when it supports a requirement.

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

## 7. Security Rules

### NEVER

- Commit secrets.
- Store plaintext passwords.
- Expose JWT secrets.
- Trust frontend validation alone.
- Store raw auth tokens in localStorage.
- Allow unrestricted file uploads.
- Return sensitive user data unnecessarily.
- Log passwords, tokens, or raw private images.
- Allow a client to choose another user's `userId` and access that data.
- Hardcode API keys or credentials.

### ALWAYS consider

- Authentication.
- Authorization.
- Input validation.
- Rate limiting.
- CORS.
- Secure HTTP-only cookies.
- CSRF when cookie deployment requires it.
- Mongo/NoSQL injection patterns.
- XSS-safe rendering.
- File validation.
- Dependency vulnerabilities.
- Secure headers.
- Secret rotation.

OWASP recommends dedicated password hashing algorithms such as Argon2id, scrypt, or bcrypt rather than plaintext or fast hashes. citeturn242487search0

## 8. Health Data Rules

Because the application handles health/nutrition-related information:

1. Collect the minimum information required.
2. Protect user information and scope every query by ownership.
3. Clearly distinguish estimates from verified values.
4. Do not make unsupported medical claims.
5. Do not present BMI as a diagnosis.
6. Do not present calorie targets as guaranteed medical guidance.
7. Do not present AI recognition as perfectly accurate.
8. Require user confirmation before AI-derived nutrition is logged.
9. Avoid disease-specific diet claims unless a future scope explicitly introduces qualified clinical oversight and new requirements.
10. Avoid using health-related data for unrelated analytics without explicit product/privacy requirements.

## 9. AI Agent Operating Rules

The coding agent MUST:

1. Read relevant documentation before coding.
2. Read `Rules.md` before changes.
3. Read `Tracker.md` before work.
4. Understand the current implementation phase.
5. Never implement future-phase functionality unless explicitly instructed.
6. Inspect existing code before creating new files.
7. Reuse existing components/services when appropriate.
8. Never silently change requirements.
9. Never modify architecture without documenting the reason.
10. Never delete working functionality without an explicit reason.
11. Run tests after significant changes.
12. Fix regressions before continuing.
13. Update `Tracker.md` after verified work.
14. Record significant architectural decisions.
15. Keep changes focused and incremental.
16. Avoid unnecessary dependency installation.
17. Never assume an API exists—verify configuration/documentation.
18. Never fabricate provider responses in production code.
19. Use mocks only for tests or explicitly approved local development substitutes.
20. Ask for clarification only when a requirement is genuinely ambiguous and safe implementation cannot proceed; otherwise use the documented assumptions.
21. Do not mark tasks complete because code “looks finished”; completion requires verification.

## 10. Git Rules

Commit format:

```text
feat: add user registration
feat: implement BMI calculation
fix: validate calorie log input
refactor: extract nutrition service
test: add BMI calculation tests
docs: update implementation tracker
```

Rules:

- One logical change per commit.
- Do not mix unrelated refactors with feature work.
- Use pull requests for reviewed repository work when available.
- Never commit `.env` files containing secrets.
- Make documentation changes in the same logical change when the architecture/requirements are affected.

## 11. Testing Rules

Each increment must test the behavior it introduces.

### Required test categories

- Business logic/unit tests.
- API endpoint tests.
- Validation tests.
- Authentication/authorization tests.
- Important UI behavior.
- Error handling.
- Edge cases.
- Critical end-to-end journeys.

A feature is **not complete** merely because the application compiles.

## 12. Test Pyramid

Prefer:

```text
Many focused unit tests
        ↓
API/integration tests
        ↓
A smaller number of critical E2E tests
```

Do not rely only on E2E tests for business rules.

## 13. Validation Rules

- Validate shape/types/range at request boundaries.
- Validate business constraints in services.
- Validate persistence through Mongoose schemas.
- Frontend validation improves UX but is never the security boundary.
- Normalize emails and comparable identifiers consistently.

## 14. File Upload Rules — Phase 6+

Before processing:

1. Enforce allowed MIME types.
2. Validate extension independently from MIME.
3. Enforce byte-size limit.
4. Apply reasonable image dimension limits.
5. Do not trust filename.
6. Do not expose storage credentials to the browser.
7. Prefer temporary processing and short retention.
8. Do not persist raw image data unless approved by requirements/privacy review.

## 15. API External-Provider Rules

- Provider credentials live only on the server/secret manager.
- Wrap external services in adapters.
- Timeouts are mandatory.
- Retries must be bounded and idempotency-aware.
- Provider responses are validated before entering domain logic.
- Provider failures must not corrupt local state.
- The product must retain a manual fallback when practical.
- Do not lock core domain models directly to vendor response formats.

## 16. Performance Rules

- Measure before optimizing.
- Avoid N+1 queries.
- Paginate histories.
- Debounce catalog search where needed.
- Use database indexes based on real query patterns.
- Avoid shipping unnecessary client dependencies/assets.
- Do not create a dashboard mega-endpoint unless real UX/performance evidence supports it.

## 17. Documentation Rules

All eight documents are interconnected source material:

```text
PRD
 ↓
TechSpec
 ↓
AppFlow
 ↓
Design
 ↓
Schema
 ↓
ImplementationPlan
 ↓
Tracker
 ↓
Rules
```

When an architecture/requirement changes:

1. Update the highest-level source of truth first.
2. Propagate the change through dependent documents.
3. Record the architectural decision.
4. Update task traceability.
5. Update Tracker.

Do not leave contradictory stale documentation.

## 18. Traceability Rules

Requirement IDs are mandatory for significant functional behavior:

```text
FR-AUTH-*
FR-BMI-*
FR-CAL-*
FR-DIET-*
FR-EX-*
FR-AI-*
```

For a new requirement, create/update:

```text
PRD requirement
 → screen/flow
 → API
 → schema
 → implementation phase
 → tracker task
 → tests
```

## 19. Architecture Decision Record Rules

For important decisions use:

```text
Decision
Options Considered
Chosen Option
Reason
Trade-offs
Impact
```

Do not select a library/technology solely because it is popular.

## 19A. Requirement Coverage Rule

Every implemented requirement must remain traceable across the documentation chain:

```text
FR-AUTH-* → SCR-AUTH-* / profile screens → /auth and /users/me → users/sessions → Phase 1 → Tracker → tests
FR-BMI-*  → SCR-BMI-* → /bmi → bmiRecords → Phase 2 → Tracker → tests
FR-CAL-*  → SCR-CAL-* → /foods and /calorie-logs → foods/calorieLogs → Phase 3 → Tracker → tests
FR-DIET-* → SCR-DIET-* → /diet-plans → dietPlans/users.preferences → Phase 4 → Tracker → tests
FR-EX-*   → SCR-EX-* → /exercises and /workouts → exercises/workouts → Phase 5 → Tracker → tests
FR-AI-*   → SCR-AI-* → /food-recognition → foodRecognitionResults/foods/calorieLogs → Phase 6 → Tracker → tests
```

If an implementation changes one link in this chain, update the dependent documents before considering the work complete.

## 20. Environment/Secrets Rules

- Use environment variables for configuration/secrets.
- Provide `.env.example` with placeholders.
- Validate required environment variables at startup for the current increment.
- Do not require future-phase variables before that phase exists.
- Production secrets belong in the deployment platform or secret manager.

## 21. Definition of Done

A task can only be marked complete when:

- Code is implemented.
- Code follows project architecture.
- Validation exists.
- Error handling exists.
- Relevant tests pass.
- Existing functionality still works.
- UI loading/success/empty/error states are handled where applicable.
- Security considerations are addressed.
- Documentation is updated if behavior/architecture changed.
- `Tracker.md` is updated.

## 22. Increment Completion Gate

At the end of every increment:

```text
Application runs
+
Feature works
+
Existing features still work
+
Relevant tests pass
+
Docs synchronized
+
Tracker updated
```

Never proceed while known blocking regressions remain undocumented and unresolved.

## 23. Non-Negotiable Product Boundaries

- No medical diagnosis.
- No fabricated AI confidence.
- No automatic AI food logging without confirmation.
- No hidden secrets.
- No cross-user data access.
- No “temporary” plaintext passwords/tokens.
- No future-phase scope without explicit direction.
