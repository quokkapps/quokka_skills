# How to cover a case — Android / iOS / KMP

Pick the cheapest tier that genuinely exercises the case (test pyramid: many unit, fewer UI, few e2e). A case that asserts on a backend call, notification, or stored record is at least an integration/UI test, never pure unit.

| Tier | What it covers | Android (Kotlin) | iOS (Swift) | Shared (KMP) |
|---|---|---|---|---|
| unit | logic, state machine, validation, mapping | JUnit + MockK | XCTest | `commonTest` (kotlin.test) — runs on every target |
| ui | screen behaviour, state → UI, a real boundary | Compose UI test / Espresso (Robolectric/Hilt) | XCUITest / ViewInspector | per-target UI test |
| e2e | full user journey across screens | Maestro / Espresso | XCUITest / Maestro | drive per platform |
| manual | visual/subjective, device hardware, one-off | dev runs on device | dev runs on device | verify per platform |

## KMP rules
- **Shared business logic lives in `commonMain` → test once in `commonTest`.** Don't duplicate the same logic test per platform.
- **`expect/actual` and platform UI → test on each target** (Android instrumented + iOS XCUITest) — the behaviour can differ per platform.
- Put the test where the code lives: a bug in `commonMain` is a `commonTest` case; a bug in the Compose/SwiftUI layer is a platform UI case.

## Coverage rules
- Every **Must-Test** case is tagged `manual` (dev executes it) and, where one reliably covers it, an automated tier.
- Safety-critical timing/escalation must have at least one automated test (unit or ui), never manual-only.
- If nothing automated can reliably cover a Must-Test case, leave it `manual` and note why.
