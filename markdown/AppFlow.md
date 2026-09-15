# Personalized Health & Nutrition Management System — Application Flow

**Document ID:** AppFlow  
**Status:** Baseline / UX flow source of truth  
**Version:** 1.0  

## 1. Screen Inventory

| ID | Screen | Category | Phase | Requirement IDs |
|---|---|---|---|---|
| SCR-AUTH-001 | Register | Authentication | 1 | FR-AUTH-001 |
| SCR-AUTH-002 | Login | Authentication | 1 | FR-AUTH-002 |
| SCR-AUTH-003 | Session Error / Auth Recovery | Errors | 1 | FR-AUTH-004, FR-AUTH-006 |
| SCR-ONB-001 | Profile Setup | Onboarding | 1 | FR-DIET-001, FR-EX-001 |
| SCR-DASH-001 | Dashboard | Dashboard | 7 | FR-BMI-003, FR-CAL-004, FR-DIET-003, FR-EX-004 |
| SCR-BMI-001 | BMI Input | BMI | 2 | FR-BMI-001 |
| SCR-BMI-002 | BMI Result & History | BMI | 2 | FR-BMI-003, FR-BMI-004 |
| SCR-CAL-001 | Daily Calorie Log | Nutrition | 3 | FR-CAL-004, FR-CAL-006, FR-CAL-009 |
| SCR-CAL-002 | Add Food | Nutrition | 3 | FR-CAL-001, FR-CAL-002, FR-CAL-003 |
| SCR-CAL-003 | Edit Food Log | Nutrition | 3 | FR-CAL-005, FR-CAL-008 |
| SCR-DIET-001 | Diet Plan | Diet | 4 | FR-DIET-002, FR-DIET-003, FR-DIET-006 |
| SCR-DIET-002 | Replace Meal | Diet | 4 | FR-DIET-004, FR-DIET-005 |
| SCR-EX-001 | Exercise Preferences | Exercise | 5 | FR-EX-001, FR-EX-002 |
| SCR-EX-002 | Recommended Workout | Exercise | 5 | FR-EX-003, FR-EX-004 |
| SCR-EX-003 | Workout Completion | Exercise | 5 | FR-EX-005 |
| SCR-AI-001 | Food Scanner | Food Recognition | 6 | FR-AI-001, FR-AI-002 |
| SCR-AI-002 | Recognition Result | Food Recognition | 6 | FR-AI-003, FR-AI-004 |
| SCR-AI-003 | Confirm/Edit Recognition | Food Recognition | 6 | FR-AI-005, FR-AI-006 |
| SCR-PROFILE-001 | Profile | Profile | 1 | FR-DIET-001, FR-EX-001 |
| SCR-SET-001 | Settings | Settings | 1+ | FR-AUTH-005 |
| SCR-ERR-001 | Generic Error | Errors | All | Reliability requirements |
| SCR-ERR-002 | Network/Offline State | Errors | All | Reliability requirements |

## 2. New User Flow

### MVP flow

```text
SCR-AUTH-001 Register
    ↓
Create account + authenticated session
    ↓
SCR-ONB-001 Profile Setup
    ↓
Save goal + basic profile + nutrition/exercise preferences
    ↓
SCR-BMI-001 BMI Input
    ↓
SCR-BMI-002 BMI Result
    ↓
SCR-CAL-001 Daily Calorie Log / Dashboard
```

Email verification is not required for MVP. It may be added later without blocking onboarding.

### Returning user

```text
Open app
  ↓
Existing session → Dashboard
No session → Login → Dashboard
```

## 3. Main Dashboard Flow

```text
Dashboard
├── BMI snapshot → BMI history
├── Calorie progress → Daily log → Add/Edit food
├── Diet recommendation → Diet plan → Log meal
├── Workout recommendation → Workout → Complete
└── Profile/preferences → Profile/Settings
```

## 4. Food Logging Flow

```text
SCR-CAL-001 Daily Log
    ↓
Add Food
    ↓
Search food catalog
    ↓
Select food
    ↓
Choose meal type + quantity + unit
    ↓
Preview nutrition
    ↓
Save
    ↓
Return to Daily Log
    ↓
Recalculate displayed daily totals
```

### Manual-entry alternative

```text
Add Food
 → Search finds no suitable match
 → Manual Entry
 → Enter food name + calories + macros + serving information
 → Confirm
 → Store source = manual
```

Manual values must not be silently presented as verified database values.

## 5. Diet Plan Flow

```text
SCR-DIET-001 Diet Plan
 → read profile/preferences
 → calculate/refresh estimated calorie target if required
 → rules-based plan generator
 → display meal cards
 → replace meal (optional)
 → log chosen meal (optional)
```

A new plan should not be generated on every screen render. Generation is an explicit service operation or a cached/current-plan read.

## 6. Exercise Flow

```text
SCR-EX-001 Preferences
 → goal + fitness + equipment + duration
 → GET recommended workout
 → SCR-EX-002 Workout
 → view exercise details
 → optional completion
 → SCR-EX-003 Completion
```

## 7. Food Recognition Flow — Phase 6+

```text
SCR-DASH-001 or SCR-CAL-001
 → SCR-AI-001 Food Scanner
 → choose/capture image
 → client-side checks
 → POST /food-recognition
 → server file validation
 → provider adapter
 → SCR-AI-002 candidates + uncertainty
 → SCR-AI-003 user confirms/edits
 → map to nutrition item
 → optional/confirmed log creation
 → SCR-CAL-001
```

### Critical safety rule

Recognition is advisory. The system must not auto-log a low-confidence recognition result without an explicit user confirmation step.

## 8. Navigation

### Desktop

Primary navigation:

`Dashboard | Nutrition | Diet | Exercise | BMI`

Secondary navigation:

`Profile | Settings | Logout`

Food Scanner appears as a contextual CTA on Dashboard/Nutrition once Phase 6 is enabled.

### Mobile

Bottom navigation:

`Home | Log | Diet | Exercise | Profile`

A prominent add/log action can open a sheet/modal with:

`Add Food | Scan Food (Phase 6+) | Manual Entry`

## 9. UX Behavior Matrix

| Flow | User goal | Primary CTA | Success | Loading | Empty | Error |
|---|---|---|---|---|---|---|
| Register | Create account | Create account | Session established + onboarding | Button loading, fields retained | N/A | Field-level or safe server error |
| Login | Access account | Login | Dashboard | Button/spinner | N/A | Generic credential message |
| BMI | Understand BMI | Calculate BMI | Result card + history | Calculation save state | No history message | Invalid input message |
| Add food | Record intake | Add to log | New log appears + totals update | Search/add skeleton | No matches + manual entry | Save/retry message |
| Diet plan | Get meal guidance | Generate plan | Meal cards | Skeleton | Profile incomplete state | Retry + contact/support-safe message |
| Exercise | Get practical workout | Show workout | Workout list | Skeleton | No matching workout | Retry/adjust filters |
| Recognition | Identify food | Analyze image | Candidates | Upload/progress state | N/A | Unsupported file/provider unavailable |

## 10. Edge Cases

### Authentication

- Duplicate email → `409 RESOURCE_CONFLICT` style response.
- Incorrect credentials → generic authentication failure; do not reveal whether email exists.
- Expired session → silent refresh where possible, otherwise route to login.
- Refresh session revoked → force login.

### Profile/BMI

- Missing required profile inputs → block dependent recommendation generation and explain what is missing.
- Zero/negative/unrealistic values → reject with field-level validation.
- Changed profile after a plan was created → mark plan stale or require regeneration; do not silently alter historical plans.

### Calorie logging

- Empty daily log → show helpful empty state and add-food CTA.
- Food no longer active → retain historical snapshot but prevent new selection.
- Duplicate food entry → allowed; food repetition is valid behavior.
- Date outside supported range → validate and constrain API request.

### Diet/exercise

- No compatible meal → offer a small fallback from the same preference class or show a clear message.
- No workout match → suggest changing duration/equipment filters rather than fabricate a result.

### Food recognition

- Unsupported extension/MIME → reject before provider call.
- Oversized image → reject before upload.
- Poor-quality/no food → show “Could not confidently identify” state.
- Multiple foods → show candidate list; user selects one or chooses manual entry.
- Provider unavailable → keep manual food logging functional.

## 11. State and Navigation Rules

- Route guards handle access control, not business authorization.
- API authorization is always enforced server-side.
- Unsaved form input should not be lost on transient validation errors.
- Destructive actions use explicit confirmation when accidental deletion is costly.
- User should always know whether values are saved, estimated, or pending.

## 12. Traceability

- `SCR-AUTH-*` → FR-AUTH-*
- `SCR-BMI-*` → FR-BMI-*
- `SCR-CAL-*` → FR-CAL-*
- `SCR-DIET-*` → FR-DIET-*
- `SCR-EX-*` → FR-EX-*
- `SCR-AI-*` → FR-AI-*

The screen inventory must be updated when a requirement is added or removed. Do not create a screen solely to satisfy an API.
