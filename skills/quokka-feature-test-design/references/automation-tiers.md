# Automation Tiers (Phase 3 — tag each kept case)

Assign each kept case exactly one Test Type. Prefer the cheapest tier that genuinely
exercises the behavior (test pyramid: many unit, fewer integration, few e2e).

| Test Type | Use when | Keep manual instead when |
|---|---|---|
| unit | Pure logic, state machine, validation, formatting, computed values | Behavior only emerges across components |
| integration | Two+ units / a real API / DB / notification boundary interacting | The boundary can't be exercised without a full device/app |
| e2e | A full user journey across screens that must work end-to-end | Setup cost dwarfs the risk it guards |
| manual-only | Visual/subjective, hardware-specific (watch, fall sensor), one-off exploratory | A reliable automated check exists |

## Per-stack framework mapping (detected in Phase 0)
| Stack | unit | integration | e2e |
|---|---|---|---|
| Android / Kotlin / Compose | JUnit + MockK | Compose UI test / Robolectric / Hilt test | Espresso or Maestro |
| Flutter / Dart | `flutter_test` | `integration_test` + mocked services | `integration_test` on device / Patrol |
| Backend / API | language unit framework (JUnit/xUnit/Go test) | API/contract test against running service | end-to-end API flow / Postman/Newman |

## Rules
- A case that asserts on a notification, SMS/email, or backend record is at least `integration`.
- Safety-critical timing/escalation ladders should have at least one `integration` test, never manual-only.
- If no automation can reliably cover it, mark `manual-only` and say why in the case Title note.
