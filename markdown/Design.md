# Personalized Health & Nutrition Management System — UI/UX Design Specification

**Document ID:** Design  
**Status:** Baseline / Design source of truth  
**Version:** 1.0  

## 1. Design Philosophy

The visual language should feel like a **calm personal wellness dashboard**, not a bodybuilding advertisement and not a clinical hospital portal.

Desired qualities:

- Clean
- Modern
- Trustworthy
- Friendly
- Health-focused
- Minimal
- Accessible
- Professional

Avoid excessive gradients, neon colors, aggressive fitness imagery, excessive glassmorphism, and dense dashboard clutter.

## 2. Design Language

### Visual hierarchy

1. Primary action/value.
2. Supporting context.
3. Detail/history.
4. Optional explanation/disclaimer.

Important health metrics should never be distinguished only by color. Use labels, icons, text, and/or patterns as secondary cues.

### Spacing

Use an 8px base rhythm:

`4, 8, 12, 16, 24, 32, 40, 48, 64 px`

Prefer consistent spacing tokens over one-off margins.

### Cards

Use cards for:

- Daily calorie summary.
- BMI summary.
- Meal recommendations.
- Workout recommendations.
- History/trend blocks.

Cards should have a visible hierarchy and should not make every block look equally important.

### Borders/radius

- Standard radius: 12px.
- Small controls: 8px.
- Prominent cards: 16px where appropriate.
- Border: 1px solid semantic border token.
- Shadows: subtle elevation only where it communicates hierarchy.

### Icons

Use a single consistent icon family. Icons support text; they must not replace essential labels.

### Buttons

- Primary: one clear CTA per major card/flow.
- Secondary: outline/text-style for alternatives.
- Destructive: clearly differentiated and confirmed where necessary.
- Disabled: visibly disabled but still readable.

### Inputs

Every input must have a visible label. Placeholder text is instructional aid, not the label.

### Charts

Charts are optional until trend data is valuable. Prefer simple bars/lines for calorie intake and BMI history. Always provide a textual summary or accessible data table equivalent.

### Empty states

Empty states should explain why the area is empty and offer one useful next action.

## 3. Color Palette

| Token | HEX | Use |
|---|---|---|
| `--color-primary` | `#2F6F5E` | Main actions, active navigation, key wellness accents. |
| `--color-primary-hover` | `#245A4B` | Primary hover/pressed state. |
| `--color-secondary` | `#D9A441` | Secondary highlights; use sparingly for emphasis. |
| `--color-background` | `#F6F7F5` | App canvas. |
| `--color-surface` | `#FFFFFF` | Cards and forms. |
| `--color-text` | `#18211D` | Primary text. |
| `--color-muted` | `#68736E` | Supporting text. |
| `--color-border` | `#DCE2DE` | Borders/dividers. |
| `--color-success` | `#2F7D59` | Successful completion and positive state. |
| `--color-warning` | `#B77A18` | Caution/attention. |
| `--color-error` | `#B84A4A` | Errors and destructive actions. |
| `--color-info` | `#3F6F9E` | Informational messages. |

### Color rules

- Do not encode BMI category or calorie status using color alone.
- Maintain sufficient text/background contrast.
- Use secondary accent sparingly; health content should remain visually calm.
- Dark text remains the default for readability rather than using colored body text.

## 4. Typography

### Font

Use **Inter** for the product UI because it is highly legible for dashboards, compact labels, numbers, and forms. Keep a system-font fallback to reduce loading risk.

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Type scale

| Token | Size | Weight | Use |
|---|---:|---:|---|
| H1 | 32px / 40px | 700 | Page title |
| H2 | 24px / 32px | 700 | Section title |
| H3 | 20px / 28px | 650 | Card/section heading |
| Body | 16px / 24px | 400 | Main content |
| Body Small | 14px / 20px | 400 | Supporting text |
| Caption | 12px / 16px | 500 | Metadata |
| Button | 14px / 20px | 600 | Actions |
| Label | 13px / 18px | 600 | Form labels |
| Metric | 32–40px | 700 | Key dashboard number |

On mobile, H1/H2 may reduce by one scale step where needed.

## 5. Responsive Design

### Breakpoints

Use these practical ranges:

- Mobile: `< 640px`
- Tablet: `640px–1023px`
- Desktop: `≥ 1024px`
- Wide desktop: `≥ 1280px` for additional whitespace, not a completely different layout.

### Layout behavior

- Desktop dashboard: 12-column grid with a primary content area and supporting cards.
- Tablet: 6-column grid; cards wrap naturally.
- Mobile: single-column flow; bottom navigation; sheets/modals for quick actions.
- Tables/history: transform into cards or horizontal-scroll containers rather than forcing unreadable columns.

## 6. Component System

### Foundation

`AppShell, Container, Stack, Inline, Divider, Card, Badge, Alert, Modal, Drawer, Skeleton`

### Forms

`FormField, TextInput, NumberInput, Select, Checkbox, RadioGroup, DateInput, FileInput, FormError`

### Navigation

`Sidebar, TopBar, BottomNav, Breadcrumbs`

### Health/nutrition

`MetricCard, CalorieRing, MacroBar, MealCard, FoodSearch, FoodLogItem, BMICard, TrendCard`

### Exercise

`ExerciseCard, WorkoutCard, SetTable, CompletionButton`

### AI recognition

`ImageDropzone, ImagePreview, RecognitionCandidate, ConfidenceBadge, ConfirmationPanel`

## 7. Screen-Level Design Rules

### Registration/Login

Keep authentication screens focused. Avoid marketing content that competes with the task.

### Dashboard

Top area:

- Greeting/context.
- Daily calorie summary.
- Add-food CTA.

Secondary:

- BMI summary.
- Diet recommendation.
- Workout recommendation.

### Nutrition

Show the date prominently. Group entries by meal. Always show daily total against estimated target.

### Diet

Meal cards should show meal name, portion, estimated calories/macros, preference tags, and action buttons. Do not make a generated plan look like a prescription.

### Exercise

Show duration and required equipment near the top. Instructions should be concise but sufficient.

### Food recognition

The primary visual hierarchy is:

`Image → Detected candidates → Confidence/uncertainty → User confirmation → Nutrition preview → Add to log`

Never hide the confirmation step.

## 8. Accessibility

- Semantic HTML first.
- All form fields have accessible labels.
- Keyboard navigation for every interactive element.
- Visible focus states.
- Modal focus trapping and escape behavior.
- Minimum touch target around 44x44 CSS px for primary interactive controls.
- Color contrast tested before release.
- Error messages linked to controls where appropriate.
- Screen-reader text for icon-only controls.
- Charts have text summaries/data tables.
- Motion is limited and respects `prefers-reduced-motion`.

## 9. Health-Tech Trust

### Reliability

Use calm, factual language such as:

- “Estimated daily calorie target”
- “Estimated nutrition”
- “BMI screening result”
- “AI suggestion — confirm before logging”

### Privacy

Show concise privacy cues near sensitive forms and settings. Avoid exposing profile information in URLs or public sharing features.

### AI uncertainty

When the provider supplies confidence, show a human-readable interpretation rather than false precision. Example: “Possible match” / “Low confidence” instead of implying certainty.

### Disclaimers

Keep a lightweight informational disclaimer visible near results, with fuller explanation available from an information link. Do not create alarmist UX.

## 10. Loading, Error, Empty, Success States

Every data-driven component must specify all four:

- **Loading:** skeleton/spinner that preserves layout.
- **Success:** content plus confirmation where action was mutating.
- **Empty:** explanation + useful CTA.
- **Error:** concise message + retry or recovery action.

## 11. Design Tokens Implementation

Store global tokens in `client/src/styles/tokens.css` and local component styles in CSS Modules. Components should reference semantic tokens rather than hard-coded colors.

Example:

```css
:root {
  --color-primary: #2F6F5E;
  --color-surface: #FFFFFF;
  --color-text: #18211D;
  --space-1: 4px;
  --space-2: 8px;
  --radius-md: 12px;
}
```

## 12. Design Traceability

- `SCR-AUTH-*` uses authentication form components.
- `SCR-BMI-*` uses metric/result/history components.
- `SCR-CAL-*` uses food search, log, and macro components.
- `SCR-DIET-*` uses meal cards and replacement controls.
- `SCR-EX-*` uses exercise/workout components.
- `SCR-AI-*` uses image upload, recognition, uncertainty, and confirmation components.

## 12A. Requirement-to-UX Traceability Matrix

| Screen/area | Requirement IDs | Design responsibility |
|---|---|---|
| Registration/Login | `FR-AUTH-001`..`FR-AUTH-006` | Auth forms, validation, session states, recovery messaging. |
| BMI | `FR-BMI-001`..`FR-BMI-004` | Metric input, result hierarchy, history and non-diagnostic messaging. |
| Calorie tracking | `FR-CAL-001`..`FR-CAL-009` | Search, meal groups, nutrition values, daily totals and edit/delete states. |
| Diet plan | `FR-DIET-001`..`FR-DIET-006` | Preference controls, plan cards, replacement and estimate disclaimers. |
| Exercise | `FR-EX-001`..`FR-EX-006` | Filters, workout prescription, completion and safety language. |
| Food recognition | `FR-AI-001`..`FR-AI-006` | Image upload, uncertainty, confirmation/edit and fallback to manual logging. |

## 13. Unresolved Design Decisions

- Final logo/brand name.
- Whether the product will support dark mode after MVP; do not build it before confirming demand.
- Exact charting library, if any. Prefer CSS/SVG/simple primitives before adding a dependency.
