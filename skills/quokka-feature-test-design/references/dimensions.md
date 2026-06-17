# Coverage Dimensions (Phase 1 probe bank)

Walk these 9 in order. For each, ask ONE question with a recommended answer, then
validate against code. Close a dimension when answered or explicitly waived.

| # | Dimension | What "resolved" means | Sample probes (offer a recommended answer) |
|---|---|---|---|
| 1 | Happy path | The single core success flow is named and unambiguous | "Is the core success flow: user does X → sees Y? (recommended: …)" |
| 2 | Edge / boundary | Empty, max, first-run, last-item, timezone/locale edges identified | "What happens on empty data / first run / the last item / a DST boundary?" |
| 3 | Error & failure states | Every failure (network loss, 4xx/5xx, partial write, timeout, retry) has defined behavior | "On network loss mid-action, do we queue, fail, or retry? On server 500?" |
| 4 | Integration points | Each API/notification/DB write that fires, and its trigger condition, is listed | "Which endpoints/notifications/DB writes does this trigger, and when exactly?" |
| 5 | Data & permission states | Roles, ownership, feature flags, account/subscription state that change behavior | "Does behavior differ by role / flag / account state? Which?" |
| 6 | Concurrency & timing | Schedules, debounce, double-tap, races, escalation ladders are specified | "Double-tap on submit? Two devices at once? Reminder→escalation timing?" |
| 7 | Platform / device variants | OS versions, screen sizes, companion devices, offline are covered | "Min OS? Small screens? Watch/companion? Offline behavior?" |
| 8 | Accessibility | Status not by color alone, screen-reader labels, focus order | "Is each status conveyed by icon+text, not color only? Screen-reader labels set?" |
| 9 | Non-functional | Performance budget, security, offline/resume, battery | "Any perf budget (e.g. <Xms)? Sensitive data? Resume after kill?" |

## Interview technique (challenge vague answers)
- **Terminology precision:** map the dev's words to the real domain terms found in code. Flag mismatches ("you said 'User' — code calls this 'Client'; which?").
- **Code-reality check:** when the dev asserts behavior you can verify, check it. If code disagrees, surface old-vs-stated.
- **Edge-case stress test:** invent a concrete adversarial scenario per dimension and ask how the feature responds.

## Scorecard
Show every turn: `Resolved N/9 — open: <list>`. Track waivers separately with reasons.

## INS safety guard
Dimensions 3 (Error & failure), 4 (Integration), 6 (Concurrency & timing) cannot be
silently waived in an INS repo. A waiver here must record an explicit reason — an
untested escalation/alarm path is a real-world safety risk.
