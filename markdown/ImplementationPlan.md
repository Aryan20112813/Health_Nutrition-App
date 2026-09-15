# Personalized Health & Nutrition Management System — Incremental Implementation Plan

**Document ID:** ImplementationPlan  
**Status:** Baseline / Delivery source of truth  
**Version:** 1.0  
**Approach:** Vertical functional increments  

## 1. Delivery Rules

Every phase leaves the application runnable. No phase is “frontend-only” or “backend-only”; each completed phase should deliver a user-visible capability with the minimum supporting architecture.

The current target is:

```text
Foundation → Auth/Profile → BMI → Calorie Tracking → Diet → Exercise → Integration → Production
                                                                    ↘
                                                             Food Recognition
```

Food recognition remains late because it is external-provider dependent and is not required for a useful MVP.

## 2. MVP Completion Point

**MVP is complete at the end of Phase 5 + the minimum dashboard integration in Phase 7 preparation**, specifically when a user can register, create a profile, calculate BMI, track food/calories, generate a diet plan, and receive exercise recommendations in one stable application.

Phase 6 food recognition is post-MVP.

## 3. Phase-by-Phase Roadmap

### Phase 0 — Project Foundation

**Objective:** Create a runnable MERN baseline with quality gates.

**Requirement coverage:** Architecture/non-functional foundations supporting all FR groups; no user-facing FR is marked complete in this phase.

**Features:** repository structure, base client/server communication, MongoDB connectivity, environment configuration.

**Frontend work:** Vite React app, router shell, global tokens, error boundary, API client skeleton.

**Backend work:** Express app, health endpoint, middleware order, environment loader, standard response/error helpers.

**Database work:** MongoDB connection helper only; no domain collections until needed.

**API work:** `GET /api/v1/health`.

**Dependencies:** none.

**Testing:** health endpoint, client build, server boot, database connection test, lint.

**Acceptance criteria:**

- Client loads.
- Server starts using environment config.
- Client can call health endpoint.
- Server connects to configured MongoDB.
- No secrets committed.

**Definition of Done:** code reviewed/self-reviewed, tests/lint/build pass, docs and tracker updated.

**Deliverables:** runnable skeleton.

**Risks:** environment/config drift.

---

### Phase 1 — Authentication & User Profile

**Objective:** Establish secure identity and personalized profile foundation.

**Requirement coverage:** `FR-AUTH-001`, `FR-AUTH-002`, `FR-AUTH-003`, `FR-AUTH-004`, `FR-AUTH-005`, `FR-AUTH-006`, plus profile inputs supporting `FR-DIET-001` and `FR-EX-001`.

**Features:** registration, login, logout, refresh session, protected route, profile setup/edit.

**Frontend work:** `SCR-AUTH-001..003`, `SCR-ONB-001`, `SCR-PROFILE-001`; protected routing; forms; validation and auth UI states.

**Backend work:** auth routes/controllers/services, Argon2id hashing, JWT creation/verification, refresh rotation, auth middleware, ownership helpers.

**Database work:** `users`, `sessions`.

**API work:** `/auth/*`, `/users/me`.

**Dependencies:** Phase 0.

**Testing:** registration validation, duplicate email, login success/failure, protected route, refresh rotation, logout revocation, profile update.

**Acceptance criteria:**

- A user can register/login/logout.
- Password hash is stored, never plaintext.
- Protected API rejects unauthenticated requests.
- Refresh session rotation works.
- Profile setup persists.

**Definition of Done:** no auth tokens in localStorage; critical tests pass; security checklist reviewed.

**Deliverables:** usable account/profile feature.

**Risks:** cookie/CORS/CSRF deployment differences.

---

### Phase 2 — BMI

**Objective:** Deliver a complete personal BMI workflow.

**Requirement coverage:** `FR-BMI-001`, `FR-BMI-002`, `FR-BMI-003`, `FR-BMI-004`.

**Features:** input, calculation, result, history.

**Frontend work:** `SCR-BMI-001..002`, field validation, result/disclaimer, history state.

**Backend work:** BMI service and routes; input validation; ownership filtering.

**Database work:** `bmiRecords`, index on user/date.

**API work:** `POST /bmi/records`, `GET /bmi/records`.

**Dependencies:** Phase 1 profile/auth.

**Testing:** unit tests for calculation/categories; API validation; cross-user access test; UI result test.

**Acceptance criteria:** expected BMI calculation for known inputs; invalid input rejected; history only shows the current user's records.

**Definition of Done:** feature usable from UI and API with tests.

**Deliverables:** BMI module.

**Risks:** ambiguity over category thresholds; document product-approved thresholds explicitly before coding.

---

### Phase 3 — Calorie Tracking

**Objective:** Deliver the first high-value daily-use workflow without external vendor dependencies.

**Requirement coverage:** `FR-CAL-001`, `FR-CAL-002`, `FR-CAL-003`, `FR-CAL-004`, `FR-CAL-005`, `FR-CAL-006`, `FR-CAL-007`, `FR-CAL-008`, `FR-CAL-009`.

**Features:** food catalog search, add/edit/delete logs, daily totals, macros, history.

**Frontend work:** `SCR-CAL-001..003`, search/debounce where needed, meal grouping, macro/calorie summary, loading/error/empty states.

**Backend work:** food search service, calorie log service, nutrition scaling, daily totals, ownership checks.

**Database work:** seed `foods`; add `calorieLogs`; create date/user indexes.

**API work:** `/foods`, `/calorie-logs`.

**Dependencies:** Phase 1 authentication; Phase 0 infrastructure.

**Testing:** nutrition-scaling unit tests, log CRUD API tests, aggregation totals, duplicate and delete cases, cross-user authorization, Playwright daily logging flow.

**Acceptance criteria:** a user can search, select, quantity-adjust, save, edit, delete, and review a full day's food; totals match stored nutrition snapshots.

**Definition of Done:** stable daily logging with deterministic seeded data.

**Deliverables:** working calorie tracker.

**Risks:** food data quality; mitigate with a documented seed-data source and test fixtures.

---

### Phase 4 — Personalized Diet Plan

**Objective:** Turn profile + nutrition targets into an actionable, editable meal plan.

**Requirement coverage:** `FR-DIET-001`, `FR-DIET-002`, `FR-DIET-003`, `FR-DIET-004`, `FR-DIET-005`, `FR-DIET-006`.

**Features:** preferences, calorie target estimate, rules-based plan generation, meal replacement, optional direct logging.

**Frontend work:** `SCR-DIET-001..002`; meal cards; estimated-value labels; regeneration/loading states.

**Backend work:** target-calculation service; rules-based planner; meal compatibility filters; plan snapshot creation.

**Database work:** extend `users.preferences` as required; add `dietPlans`.

**API work:** `/diet-plans/*`.

**Dependencies:** Phase 1 profile; Phase 3 food catalog/logging.

**Testing:** deterministic plan-generation unit tests; restriction tests; API generation/replacement; direct logging integration.

**Acceptance criteria:** valid users receive compatible plans; plan meals contain enough nutrition data to log; historical plans remain stable.

**Definition of Done:** diet plan works without LLM/external AI.

**Deliverables:** personalized diet module.

**Risks:** calorie-target methodology can be health-sensitive; document formula/assumptions and avoid medical claims.

---

### Phase 5 — Exercise Recommendation

**Objective:** Provide practical exercise recommendations from a curated catalog.

**Requirement coverage:** `FR-EX-001`, `FR-EX-002`, `FR-EX-003`, `FR-EX-004`, `FR-EX-005`, `FR-EX-006`.

**Features:** preference inputs, recommendation rules, workout screen, completion tracking.

**Frontend work:** `SCR-EX-001..003`; filter form; workout cards; completion UI.

**Backend work:** exercise filtering and workout generation services; completion endpoint.

**Database work:** seed `exercises`; create `workouts`.

**API work:** `/exercises`, `/workouts/recommended`, completion endpoint.

**Dependencies:** Phase 1 profile; Phase 0 infrastructure.

**Testing:** filtering logic, API authorization, workout snapshot behavior, completion idempotency where applicable, UI recommendation flow.

**Acceptance criteria:** recommendations respect declared equipment/fitness/duration constraints and are not fabricated when no match exists.

**Definition of Done:** independent exercise module usable from UI.

**Deliverables:** recommendation + completion workflow.

**Risks:** exercise safety language; keep instructions general and non-diagnostic.

---

### Phase 6 — Food Image Recognition (Post-MVP)

**Objective:** Reduce logging friction using an external recognition provider without coupling the core product to it.

**Requirement coverage:** `FR-AI-001`, `FR-AI-002`, `FR-AI-003`, `FR-AI-004`, `FR-AI-005`, `FR-AI-006`.

**Features:** image upload/capture, validation, provider analysis, candidates, confirmation/edit, nutrition mapping/logging.

**Frontend work:** `SCR-AI-001..003`, image UX, upload progress, confidence/uncertainty display, correction flow.

**Backend work:** upload validation, recognition adapter, provider timeout/retry policy, candidate mapping, confirmation service.

**Database work:** `foodRecognitionResults`; optional short-lived image reference only if required.

**API work:** `/food-recognition` endpoints.

**Dependencies:** Phase 3 food catalog/logging; approved provider; approved privacy/retention design.

**Testing:** file validation, provider mock adapter tests, provider-failure tests, confirmation required test, end-to-end mapping to calorie log.

**Acceptance criteria:** unsupported files never reach provider; provider results are advisory; user confirmation is required; provider outage leaves manual logging functional.

**Definition of Done:** feature works behind a provider adapter with an explicit cost/privacy review.

**Deliverables:** optional image-based logging accelerator.

**Risks:** accuracy, vendor cost, privacy, image retention, culturally specific food recognition.

---

### Phase 7 — Integration & Refinement

**Objective:** Connect modules into one coherent daily-use product.

**Features:** dashboard, cross-module navigation, analytics/trends where data supports them, consistency and UX polish.

**Frontend work:** `SCR-DASH-001`; unified loading/error patterns; responsive refinement; accessibility fixes.

**Backend work:** dashboard aggregation/read models only where needed; performance fixes; request IDs/logging.

**Database work:** verify indexes against actual queries; no speculative indexes.

**API work:** dashboard endpoint only if multiple API calls produce measurable UX/performance issues; otherwise compose existing endpoints.

**Dependencies:** Phases 1–5; Phase 6 optional.

**Testing:** regression suite, Lighthouse/UX review, Playwright critical journeys, performance smoke tests.

**Acceptance criteria:** complete daily journey works on desktop/mobile without regression.

**Definition of Done:** release candidate ready.

**Deliverables:** integrated product.

**Risks:** feature coupling and UI complexity; keep dashboard thin and compositional.

---

### Phase 8 — Production Readiness

**Objective:** Make the release operationally safe and maintainable.

**Features:** deployment, CI/CD, monitoring, backups, security review, release checklist.

**Frontend work:** production build config, environment injection, error tracking integration if selected.

**Backend work:** secure headers, rate limits, health checks, structured logs, graceful shutdown, production CORS/cookies.

**Database work:** backups/restore validation, indexes, least-privilege credentials, retention review.

**API work:** versioning verification, timeout handling, documentation cleanup.

**Dependencies:** release candidate from Phase 7.

**Testing:** full automated suite, security tests, dependency audit, restore test, production smoke test.

**Acceptance criteria:** deployable build passes all gates; rollback/runbook exists; backups are verified.

**Definition of Done:** release checklist signed off and Tracker updated with deployment evidence.

**Deliverables:** production deployment.

**Risks:** misconfigured secrets, permissive CORS, insufficient monitoring, backup assumptions.

## 4. Vertical Dependency Map

| Phase | Depends on | Produces |
|---|---|---|
| 0 | — | Runnable platform |
| 1 | 0 | Identity/profile |
| 2 | 1 | BMI workflow |
| 3 | 1 | Daily calorie tracker |
| 4 | 1, 3 | Personalized diet |
| 5 | 1 | Exercise recommendation |
| 6 | 3 + provider approval | Image-assisted logging |
| 7 | 1–5; 6 optional | Integrated dashboard |
| 8 | 7 | Production release |

## 5. Testing Gates Between Increments

A phase cannot be moved to “Complete” until:

```text
Implementation complete
+ validation complete
+ relevant automated tests pass
+ manual happy-path smoke test passes
+ regression check passes
+ docs updated
+ Tracker updated
```

## 6. MVP vs Post-MVP

### MVP

Phases 0–5 + enough integration work to present a stable dashboard/daily journey.

### Post-MVP

Food image recognition, external nutrition enrichment, password-reset email, advanced analytics, and deeper personalization.

## 7. Scope-Control Rules

- One active increment at a time except documented dependencies.
- No future API or collection creation without present-phase value or documented architectural necessity.
- No provider integration before provider, privacy, and cost decisions are approved.
- A “temporary” hard-coded production credential is not acceptable.
- A fake AI endpoint is not an acceptable placeholder for Phase 6; use test mocks only inside tests.

## 8. Architectural Changes That Must Update Source Documents

| Change | Update required |
|---|---|
| Add/remove feature | PRD → AppFlow → Design → TechSpec → Schema → ImplementationPlan → Tracker |
| Add external provider | TechSpec + Rules + ImplementationPlan + Schema/AppFlow if UX/data changes |
| Add collection | Schema + TechSpec API + relevant implementation tasks |
| Change auth | TechSpec + Schema + Rules + AppFlow |
| Change navigation/screen | AppFlow + Design + ImplementationPlan |

## 9. Recommended Implementation Sequence Inside Each Phase

1. Read `Rules.md`, `Tracker.md`, and the phase scope.
2. Inspect existing code and tests.
3. Update/confirm API contract.
4. Implement backend validation/business logic.
5. Implement persistence changes required for this increment.
6. Add API tests.
7. Implement frontend screen/component behavior.
8. Add UI/flow tests.
9. Run lint/tests/build.
10. Perform regression smoke test.
11. Update documentation and `Tracker.md`.
12. Commit a focused change.

## 10. Definition of Done — Phase Level

A phase is complete only when the corresponding FR IDs are implemented, tested, integrated, documented, and verified without breaking prior completed phases.
