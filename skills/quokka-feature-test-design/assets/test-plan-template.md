# Test Plan: <Feature Name>

- **Epic:** <e.g. MA-2236>  •  **Design:** <link>
- **Stack:** <Android | iOS | KMP (shared + per-platform)>
- **Generated:** <YYYY-MM-DD>

## Summary
<2–3 sentences: what the feature does end to end.>

## Interview checklist
| Item | Status |
|---|---|
| Happy path | Resolved |
| Edge / empty / boundary | Resolved |
| Error & failure | Resolved |
| Integration | Resolved |
| Data & permission | Resolved |
| Concurrency & timing | Resolved |
| Platform differences (Android/iOS) | Resolved |
| Accessibility | Resolved / Waived: <reason> |
| Non-functional | Resolved / Waived: <reason> |

**Why these are the must-test 20%:** <1 line.>

---

## ▶ MUST-TEST 20% — execute these
| TC ID | Risk | Test Area | Coverage | Title | Preconditions | Test Steps | Expected Result | Expected Integration | Done (Dev / QA) |
|---|---|---|---|---|---|---|---|---|---|
| TC#1 | High | <area> | manual + ui | <title> | <preconditions> | 1. … 2. … | Verify after step #N: … | App UI: … / Backend/API: … / Notification: … | Dev ☐ / QA ☐ |

> When publishing to Confluence (see `references/confluence-format.md`): render Test Steps / Expected Result / Expected Integration as real list nodes, and make the Done cell two interactive task checkboxes (Dev, QA) — not plain `☐` glyphs.

---

## Extended coverage (automate / skip)
| TC ID | Risk | Test Area | Coverage | Title | Expected Result | Outcome |
|---|---|---|---|---|---|---|
| TC#9 | Low | <area> | unit (commonTest) | <title> | … | automate |

### Consciously skipped (why)
| Skipped case | Why skipped |
|---|---|
| <case> | <risk too low / redundant with TC#N / out of scope> |
