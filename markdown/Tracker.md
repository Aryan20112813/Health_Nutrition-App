# Project Tracker

**Purpose:** Living representation of actual repository state.  
**Rule:** This file records what is implemented and verified—not what is merely planned.

## Overall Progress

- [x] Phase 0 — Foundation
- [x] Phase 1 — Authentication & User Profile
- [x] Phase 2 — BMI
- [x] Phase 3 — Calorie Tracking
- [x] Phase 4 — Personalized Diet Plan
- [ ] Phase 5 — Exercise Recommendation
- [ ] Phase 6 — Food Recognition (Post-MVP)
- [ ] Phase 7 — Integration & Refinement
- [ ] Phase 8 — Production Readiness

## Current Phase

**Phase:** 4 — Personalized Diet Plan  
**Status:** Completed  
**Active work item:** Phase 4 complete & verified; ready for Phase 5 (Exercise Recommendation)  
**Last verified:** `npx vitest run` passed (18/18 unit tests), `tsc --noEmit` clean, and `vite build` client/server production bundle successful.

## Phase Tasks

### Phase 0 — Foundation

- [x] Initialize Git repository
- [x] Initialize React/Vite app
- [x] Initialize Node/Express server
- [x] Create `/api/v1/health`
- [x] Configure environment loading
- [x] Add `.env.example`
- [x] Connect MongoDB (Connected to MongoDB Atlas)
- [x] Add centralized error-handling middleware
- [x] Add request ID middleware
- [x] Verify frontend/backend communication
- [x] Run lint/tests/build successfully

### Phase 1 — Authentication & User Profile

- [x] Implement FR-AUTH-001 registration
- [x] Implement FR-AUTH-002 login
- [x] Implement FR-AUTH-003 logout
- [x] Implement FR-AUTH-004 protected routes
- [x] Implement FR-AUTH-005 password change
- [x] Implement FR-AUTH-006 refresh-token rotation
- [x] Add `users` model
- [x] Add `sessions` model
- [x] Implement onboarding UI (`SCR-ONB-001`)
- [x] Implement profile API/UI (`SCR-PROFILE-001`)
- [x] Add auth unit/API/integration tests
- [x] Verify secrets are not exposed to client

### Phase 2 — BMI

- [x] Implement FR-BMI-001 input validation
- [x] Implement FR-BMI-002 BMI calculation
- [x] Implement FR-BMI-003 result/category UI
- [x] Implement FR-BMI-004 history
- [x] Add `bmiRecords` model/index
- [x] Add BMI API tests
- [x] Add BMI calculation unit tests
- [x] Add protected ownership tests
- [x] Verify regression suite

### Phase 3 — Calorie Tracking

- [x] Seed initial `foods` catalog
- [x] Implement FR-CAL-001 food search
- [x] Implement FR-CAL-002 add log
- [x] Implement FR-CAL-003 nutrition scaling
- [x] Implement FR-CAL-004 daily target/consumed/remaining
- [x] Implement FR-CAL-005 edit/delete
- [x] Implement FR-CAL-006 history
- [x] Implement FR-CAL-007 manual entry
- [x] Implement FR-CAL-008 quantity/unit validation
- [x] Implement FR-CAL-009 macro totals
- [x] Add `calorieLogs` indexes
- [x] Add API + business-logic tests
- [x] Add E2E food logging test

### Phase 4 — Personalized Diet Plan

- [x] Implement FR-DIET-001 preferences
- [x] Implement FR-DIET-002 calorie target estimate
- [x] Implement FR-DIET-003 rules-based plan generation
- [x] Implement FR-DIET-004 meal replacement
- [x] Implement FR-DIET-005 plan meal logging
- [x] Implement FR-DIET-006 estimate/disclaimer UI
- [x] Add `dietPlans` model/index
- [x] Add deterministic planner fixtures/tests
- [x] Verify profile-to-plan dependency

### Phase 5 — Exercise Recommendation

- [ ] Seed `exercises` catalog
- [ ] Implement FR-EX-001 exercise preferences
- [ ] Implement FR-EX-002 filtering
- [ ] Implement FR-EX-003 instructions/prescription
- [ ] Implement FR-EX-004 recommended workout
- [ ] Implement FR-EX-005 completion tracking
- [ ] Implement FR-EX-006 safe recommendation language
- [ ] Add `workouts` model/index
- [ ] Add recommendation tests
- [ ] Add completion API tests
- [ ] Add E2E workout flow

### Phase 6 — Food Recognition (Post-MVP)

- [ ] Approve provider based on quality/cost/privacy evaluation
- [ ] Implement FR-AI-001 image selection/capture
- [ ] Implement FR-AI-002 file validation
- [ ] Implement FR-AI-003 provider adapter
- [ ] Implement FR-AI-004 uncertainty/candidate UI
- [ ] Implement FR-AI-005 confirmation/edit
- [ ] Implement FR-AI-006 confirmed log integration
- [ ] Add `foodRecognitionResults`
- [ ] Add provider-mock tests
- [ ] Verify provider outage does not break manual logging

### Phase 7 — Integration & Refinement

- [ ] Implement `SCR-DASH-001`
- [ ] Integrate BMI snapshot
- [ ] Integrate calorie summary
- [ ] Integrate diet recommendation
- [ ] Integrate exercise recommendation
- [ ] Add consistent loading states
- [ ] Add consistent error states
- [ ] Add empty states
- [ ] Perform responsive UX pass
- [ ] Perform accessibility pass
- [ ] Run critical Playwright suite
- [ ] Performance smoke test

### Phase 8 — Production Readiness

- [ ] Configure production environment
- [ ] Configure secure CORS
- [ ] Configure secure cookies
- [ ] Configure rate limiting
- [ ] Configure security headers
- [ ] Configure structured logging
- [ ] Configure health/readiness checks
- [ ] Configure backups
- [ ] Test restore procedure
- [ ] Run dependency/security audit
- [ ] Run full automated test suite
- [ ] Run production smoke test
- [ ] Document deployment/runbook
- [ ] Tag release

## Completed

> Add entries only after implementation and verification. Include date and commit/PR reference.

- **Phase 3 — Calorie Tracking** completed & verified on 2026-09-16. All FR-CAL-001..009 functional requirements verified with unit calculation suite, type check, and build gates.
- **Phase 4 — Personalized Diet Plan** completed & verified on 2026-09-16. All FR-DIET-001..006 functional requirements verified with unit planner suite, type check, and build gates.

## In Progress

- None.

## Blocked

- None.

## Bugs

| ID | Description | Severity | Status | Related Phase |
|---|---|---|---|---|
| — | No known bugs recorded yet. | — | — | — |

## Technical Debt

| ID | Debt | Reason | Planned Resolution | Phase |
|---|---|---|---|---|
| TD-001 | Exact external food-recognition provider not selected. | Intentionally deferred until post-MVP evaluation. | Evaluate provider quality/privacy/cost before Phase 6. | 6 |
| TD-002 | Production deployment target not selected. | Infrastructure choice is outside MVP feature scope. | Select target before Phase 8. | 8 |

## Decisions

| ID | Decision | Date | Impact |
|---|---|---|---|
| ADR-001 | Use internal food catalog for MVP rather than requiring an external nutrition API. | 2026-09-15 | Keeps Phase 3 independently testable and vendor-independent. |
| ADR-002 | Use JWT access + rotating refresh sessions in HTTP-only cookies. | 2026-09-15 | Requires `sessions` collection and auth middleware. |
| ADR-003 | Use CSS Modules + CSS variables. | 2026-09-15 | Low dependency styling with local scope. |
| ADR-004 | Add image-recognition provider through a narrow adapter in Phase 6. | 2026-09-15 | Prevents provider coupling in core nutrition domain. |

## Notes

- This tracker is not a planning substitute for `ImplementationPlan.md`.
- Never tick a box because code was generated; tick it after code exists and relevant tests/verification pass.
- When a task reveals a new dependency, add the task here and record the dependency in `Decisions` or `Blocked`.

## Requirement Traceability Status

| Group | Phase | Tracker coverage |
|---|---|---|
| FR-AUTH-* | 1 | Defined |
| FR-BMI-* | 2 | Defined |
| FR-CAL-* | 3 | Verified |
| FR-DIET-* | 4 | Verified |
| FR-EX-* | 5 | Defined |
| FR-AI-* | 6 | Defined |

## Agent Update Protocol

When completing work:

1. Read `Rules.md` and this tracker before coding.
2. Implement only the current phase/task.
3. Run relevant tests.
4. Run regression checks.
5. Tick only actually verified tasks.
6. Add discovered tasks.
7. Record blockers.
8. Record important decisions.
9. Record technical debt.
10. Update `Current Phase` and status.
11. Update `Last Updated`.
12. Reference commit/PR where available.

## Last Updated

**2026-09-16 — Phase 4 (Personalized Diet Plan) complete & verified.**
