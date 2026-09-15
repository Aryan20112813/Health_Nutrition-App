# Personalized Health & Nutrition Management System — Product Requirements Document

**Document ID:** PRD  
**Status:** Baseline / Source of Truth  
**Version:** 1.0  
**Development model:** Incremental vertical delivery  
**Primary stack:** MERN  

## 1. Product Overview

The Personalized Health & Nutrition Management System is a web application that helps an individual understand basic body metrics, set a reasonable calorie target, record food intake, receive personalized diet guidance, follow exercise recommendations, and—later—use food-image recognition to speed up food logging.

The product exists to reduce the friction of converting everyday health information into repeatable actions. Instead of requiring separate tools for BMI, calorie tracking, meal planning, and exercise discovery, the system connects these functions through a single user profile and daily dashboard.

The system is an **informational wellness product**, not a diagnostic or treatment system. BMI, calorie targets, food nutrition values, diet recommendations, and AI recognition results must be presented as estimates where appropriate and must not be framed as medical diagnoses or guaranteed outcomes.

## 2. Problem Statement

Users commonly face four practical problems:

1. **Fragmented information:** body measurements, food intake, calorie targets, meal ideas, and exercise information are often maintained in separate apps or notes.
2. **High logging effort:** repeatedly searching foods and entering nutrition information creates friction, reducing the likelihood of consistent tracking.
3. **Generic recommendations:** many tools show generic meal/workout lists without using the user's goal, dietary preferences, fitness level, equipment access, and target calories together.
4. **Unclear confidence:** users may interpret estimates as exact values, especially when food portions are uncertain or image recognition is imperfect.

This product solves the coordination problem by maintaining one user profile and using it to drive calorie targets, recommendations, and the dashboard while preserving an explicit distinction between user-entered facts and system-generated estimates.

## 3. Target Users

### Primary users

Health-conscious individuals who want a simple personal wellness tracker and are comfortable entering basic profile and food information.

**Characteristics:** beginner-to-intermediate health tracking experience, mobile-heavy usage, limited tolerance for complex nutrition workflows.  
**Needs:** low-friction logging, understandable feedback, personalization, history, privacy.  
**Pain points:** repetitive data entry, generic plans, scattered information, confusing nutrition terminology.

### Secondary users

Fitness-oriented users who want structured daily calorie/macronutrient tracking and workout recommendations without requiring a full professional coaching platform.

**Needs:** faster logging, history/trends, goal-aligned recommendations, completion tracking.  
**Pain points:** insufficient personalization and too much manual work.

### Out of scope users

Clinical patients, minors, users requiring disease-specific therapeutic diets, or users expecting diagnosis/treatment. These use cases require specialist workflows and clinical oversight.

## 4. Product Goals

1. A new user can register and complete the minimum profile setup in one guided flow.
2. A user can calculate BMI in under one minute after entering valid height and weight.
3. A user can log a food item and see updated daily calories/macros without refreshing the page.
4. A user can receive a personalized, editable daily diet plan using stored profile preferences and an estimated calorie target.
5. A user can receive exercise recommendations filtered by goal, fitness level, equipment, and duration.
6. The MVP remains fully usable without an image-recognition provider.
7. Failed requests, validation errors, and empty states are understandable to users and diagnosable by developers.

## 5. Core Features

### 5.1 Authentication

- Registration with email and password.
- Login and logout.
- Secure password hashing.
- Short-lived authenticated session with refresh mechanism.
- Protected routes and authenticated API operations.
- Password change for authenticated users.
- Password reset is **post-MVP** unless an email delivery provider is introduced.

**Related requirements:** FR-AUTH-001 to FR-AUTH-006.

### 5.2 BMI

- Enter height and weight.
- Calculate BMI using metric units.
- Display BMI value and general category.
- Explain that BMI is a screening metric, not a diagnosis.
- Store dated BMI records for the user.

**Related requirements:** FR-BMI-001 to FR-BMI-004.

### 5.3 Calorie Tracking

- Daily calorie target derived from profile data and selected goal.
- Search controlled food catalog.
- Manual food entry where catalog match is unavailable.
- Meal categories: breakfast, lunch, dinner, snack.
- Portion amount and unit.
- Calories and macronutrients.
- Daily totals and remaining target.
- Historical daily logs.

**Related requirements:** FR-CAL-001 to FR-CAL-009.

### 5.4 Personalized Diet Plan

- Capture dietary preference, restrictions, goal, target calories, and meal structure.
- Generate recommendations from a rules-based planning service for MVP.
- Show meals, portions, estimated calories, and macros.
- Allow meal replacement or regeneration.
- Allow selected meal to be logged into the calorie tracker.
- Mark diet guidance as informational estimates.

**Related requirements:** FR-DIET-001 to FR-DIET-006.

### 5.5 Exercise Recommendation

- Capture fitness level, goal, available equipment, and preferred workout duration.
- Recommend workouts from an internal exercise catalog.
- Display exercise instructions, sets/reps or duration, rest, and safety notes.
- Mark exercises/workouts completed.
- Keep the recommendation logic deterministic and explainable in MVP.

**Related requirements:** FR-EX-001 to FR-EX-006.

### 5.6 Food Image Recognition

- Upload or capture food image.
- Validate file type and size before processing.
- Send image to a provider abstraction in Phase 6.
- Return one or more candidate foods with confidence/uncertainty information when available.
- Require user confirmation or correction before calorie logging.
- Map confirmed food to nutrition data.
- Add confirmed item to the calorie log.

**Related requirements:** FR-AI-001 to FR-AI-006.

## 6. Functional Requirements

### Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-001 | User can register with a unique email and password meeting password policy. | Must |
| FR-AUTH-002 | User can log in using valid credentials and receive an authenticated session. | Must |
| FR-AUTH-003 | User can log out and invalidate the active refresh session. | Must |
| FR-AUTH-004 | Protected pages/API routes reject unauthenticated access. | Must |
| FR-AUTH-005 | User can change password after re-authentication. | Should |
| FR-AUTH-006 | System supports secure refresh-token rotation and invalidation. | Must |

### BMI

| ID | Requirement | Priority |
|---|---|---|
| FR-BMI-001 | User can submit valid height and weight values in metric units. | Must |
| FR-BMI-002 | System calculates BMI using weight(kg) / height(m)^2. | Must |
| FR-BMI-003 | System displays BMI value rounded to one decimal place and a general category. | Must |
| FR-BMI-004 | System stores dated BMI records linked to the authenticated user. | Should |

### Calories

| ID | Requirement | Priority |
|---|---|---|
| FR-CAL-001 | User can search the internal food catalog by name. | Must |
| FR-CAL-002 | User can add a food item to a meal with quantity and unit. | Must |
| FR-CAL-003 | System calculates calories and macros for the logged quantity. | Must |
| FR-CAL-004 | System shows daily calorie target, consumed calories, and remaining calories. | Must |
| FR-CAL-005 | User can edit or delete a calorie-log entry. | Must |
| FR-CAL-006 | User can view historical daily calorie logs. | Must |
| FR-CAL-007 | User can record a manual food entry when no catalog item is suitable. | Should |
| FR-CAL-008 | System prevents invalid quantity/unit combinations and negative values. | Must |
| FR-CAL-009 | Dashboard can show protein, carbohydrates, and fat totals for the day. | Should |

### Diet

| ID | Requirement | Priority |
|---|---|---|
| FR-DIET-001 | User can define dietary preference and relevant restrictions. | Must |
| FR-DIET-002 | System can derive an estimated calorie target from profile inputs and goal. | Must |
| FR-DIET-003 | System generates a daily plan using an explainable rules-based service. | Must |
| FR-DIET-004 | User can replace a suggested meal with another compatible option. | Should |
| FR-DIET-005 | User can log a selected plan meal directly to calorie tracking. | Should |
| FR-DIET-006 | System clearly labels nutrition values and calorie targets as estimates where inputs are estimated or uncertain. | Must |

### Exercise

| ID | Requirement | Priority |
|---|---|---|
| FR-EX-001 | User can define goal, fitness level, equipment access, and duration preference. | Must |
| FR-EX-002 | System can filter exercises/workouts using those attributes. | Must |
| FR-EX-003 | System displays exercise instructions and prescribed volume. | Must |
| FR-EX-004 | User can view a recommended workout session. | Must |
| FR-EX-005 | User can mark a workout as completed. | Should |
| FR-EX-006 | System avoids claims that an exercise recommendation is medically appropriate for a specific condition. | Must |

### Food Recognition

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-001 | User can select or capture a supported food image. | Could/Post-MVP |
| FR-AI-002 | System validates image MIME type, extension, size, and basic dimensions before processing. | Could/Post-MVP |
| FR-AI-003 | System sends a validated image to a configured recognition provider through a server-side adapter. | Could/Post-MVP |
| FR-AI-004 | System displays recognition candidates and uncertainty/confidence information when provided. | Could/Post-MVP |
| FR-AI-005 | User must confirm or edit the recognized food before it is logged. | Could/Post-MVP |
| FR-AI-006 | Confirmed recognition result can create a calorie-log entry using a mapped nutrition item. | Could/Post-MVP |

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Typical authenticated API requests should aim for p95 under 500 ms excluding external-provider latency; search endpoints should return quickly for ordinary catalog sizes. |
| Security | Passwords are strongly hashed; secrets never reach the client; authenticated and state-changing operations are protected. |
| Privacy | Collect the minimum profile and nutrition information required for requested functions. |
| Reliability | API failures return predictable error payloads and do not corrupt calorie logs. |
| Accessibility | Core flows target WCAG 2.2 AA principles: labels, keyboard access, focus visibility, contrast, semantic structure. |
| Maintainability | Feature modules follow controller/service/repository-model separation where useful; business logic is testable outside UI components. |
| Scalability | Design read/query patterns and indexes around user/date lookups and catalog search. |
| Availability | MVP targets normal web-app availability; production availability targets must be established after deployment environment selection. |
| Observability | Production backend should provide structured logs, correlation/request IDs, health endpoint, and provider error visibility. |

## 8. User Stories

- As a new user, I want to register and set up my profile so that the system can personalize recommendations.
- As a user, I want to calculate BMI so that I can understand a basic body-mass indicator.
- As a user, I want to log what I ate so that I can monitor daily calorie and macro intake.
- As a user, I want to see my remaining calories so that I can make informed meal choices.
- As a user, I want a diet plan based on my goal and preferences so that I do not have to plan every meal from scratch.
- As a user, I want exercise recommendations matched to my ability and equipment so that the plan is practical.
- As a user, I want to scan a food image so that logging can eventually become faster.
- As a user, I want to correct an AI food result so that an incorrect prediction does not automatically enter my log.

## 9. Acceptance Criteria

### Authentication

- Registration rejects duplicate email addresses with a safe, predictable error.
- Passwords are never stored or returned in plaintext.
- Successful login allows access to protected resources.
- Logout invalidates the refresh session and subsequent refresh attempts fail.

### BMI

- Valid metric input produces the expected BMI calculation.
- Invalid, zero, negative, or unreasonable inputs are rejected before persistence.
- Result page shows value, category, and non-diagnostic disclaimer.

### Calorie tracking

- A valid food entry is stored with the authenticated user's ID, date, meal type, quantity, unit, and nutrition snapshot.
- Daily totals equal the sum of valid entries for that date.
- Editing or deleting an entry updates totals without affecting another user's data.
- Manual entry can be distinguished from catalog-derived values.

### Diet

- Plan generation uses current profile/preference inputs.
- Generated meals have enough nutrition metadata to be logged.
- Replacing a meal respects restriction/preferences configured for the user.

### Exercise

- Recommendation results respect selected equipment and duration filters.
- Completion state is persisted for the user's own workout history.

### Food recognition

- Unsupported files are rejected before provider processing.
- Provider failure returns a recoverable user-facing error.
- Recognition cannot create a calorie-log entry without user confirmation.

## 10. MVP Scope

### Must Have — MVP

- Registration/login/logout and protected routes.
- Basic user profile/onboarding.
- BMI calculation and optional history.
- Internal food catalog and manual food search/logging.
- Daily calorie/macronutrient totals.
- Goal/preferences and rules-based diet plan generation.
- Exercise catalog and goal/equipment/duration-based recommendations.
- Dashboard combining BMI snapshot, calorie progress, diet plan, and workout recommendation.
- Core validation, centralized errors, tests for critical business logic and APIs.

### Should Have — Early post-MVP

- Password change.
- Better food catalog import/search.
- Meal replacement.
- Workout completion history.
- Trend charts.

### Could Have

- Food image recognition.
- Provider-backed nutrition lookup.
- Cloud image storage.
- Email password reset.

### Future

- Continuous wearable integration.
- Advanced ML personalization.
- Clinical integrations.
- Disease-specific therapeutic nutrition.
- Multi-user coach/dietitian portals.

## 11. Success Criteria

The first production-quality release should measure product behavior rather than vanity metrics:

| Metric | Initial success criterion |
|---|---|
| Registration completion | Majority of users who start registration can reach completed onboarding without an unhandled error. |
| BMI calculation | >99% of valid calculation requests return a correct result in automated tests. |
| Food logging success | Valid manual/catalog food logs succeed without duplicate or cross-user records. |
| Diet-plan generation | Valid profile inputs produce a usable plan with no empty required meal slots. |
| Exercise recommendations | Valid filters produce at least one suitable recommendation when the catalog contains a match; otherwise a clear empty state. |
| Food recognition | For Phase 6, track provider success rate and user-confirmation acceptance rate separately; do not define a fake accuracy target before evaluating a provider/dataset. |
| API error rate | Monitor 5xx rate and investigate regressions; target should be defined after deployment baseline is established. |
| Frontend performance | Measure Core Web Vitals in production and keep regressions visible in release review. |

## 12. MVP Boundary

Food-image recognition is deliberately excluded from the MVP implementation path. The architecture will define a provider boundary so Phase 6 can be added without redesigning calorie logging. No fake production recognition endpoint may be created to simulate the future feature.

## 13. Assumptions

- Initial deployment is for individual users, not clinicians.
- Metric units are the default.
- Nutrition values are estimates and depend on food definition and portion size.
- The initial internal food catalog will be curated/seeded by the development team.
- No external provider is required for the core MVP.
- The application is not a substitute for medical advice.

## 14. Traceability Snapshot

| Requirement group | Primary UX | API group | Data model | Implementation phase |
|---|---|---|---|---|
| FR-AUTH-* | SCR-AUTH-001..004, SCR-PROFILE-001 | `/auth`, `/users/me` | `users`, `sessions` | Phase 1 |
| FR-BMI-* | SCR-BMI-001..002 | `/bmi` | `bmiRecords` | Phase 2 |
| FR-CAL-* | SCR-CAL-001..003 | `/foods`, `/calorie-logs` | `foods`, `calorieLogs` | Phase 3 |
| FR-DIET-* | SCR-DIET-001..002 | `/diet-plans` | `dietPlans`, embedded meals | Phase 4 |
| FR-EX-* | SCR-EX-001..002 | `/exercises`, `/workouts` | `exercises`, `workouts` | Phase 5 |
| FR-AI-* | SCR-AI-001..003 | `/food-recognition` | `foodRecognitionResults` | Phase 6 |

## 15. Source-of-Truth Changes

- **ADR-001:** MVP nutrition tracking uses an internal food catalog rather than requiring an external nutrition API. This reduces vendor dependency and keeps Phase 3 independently testable. See `TechSpec.md` and `ImplementationPlan.md`.
- **ADR-002:** Authentication uses short-lived access JWT + rotating refresh token in HTTP-only cookies. See `TechSpec.md`, `Schema.md`, and `Rules.md`.
- **ADR-003:** Food image recognition is a post-MVP vertical increment behind a provider adapter. See `TechSpec.md`, `AppFlow.md`, `Schema.md`, and `ImplementationPlan.md`.

## References

- React current version documentation: https://react.dev/versions
- MongoDB schema design guidance: https://www.mongodb.com/docs/manual/data-modeling/
- OWASP password storage guidance: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- MongoDB Atlas security guidance: https://www.mongodb.com/docs/atlas/architecture/current/security/
