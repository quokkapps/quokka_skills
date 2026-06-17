# Risk Scoring & the 80/20 Cut (Phase 3)

## Score each candidate case
Rate three factors 1–3, then multiply: `score = likelihood × impact × cost_of_failure` (range 1–27).

| Factor | 1 (low) | 2 (med) | 3 (high) |
|---|---|---|---|
| Likelihood (will this path actually be hit?) | rare/edge | occasional | common/default path |
| Impact (blast radius if it breaks) | cosmetic | degraded UX | data loss / wrong result |
| Cost of failure (real-world consequence) | annoyance | rework/support load | safety/financial/compliance harm |

> INS weighting: for safety paths (welfare/escalation/alarm, fall detection), set impact and
> cost_of_failure to 3 unless there is a concrete reason not to.

## Map score → Priority + Risk
| Score | Priority | Risk label |
|---|---|---|
| 18–27 | P1 | High |
| 8–17 | P2 | Med |
| 1–7 | P3 | Low |

## Draw the "must-test 20%" line
1. Sort candidates by score, descending.
2. The must-test set = all P1, plus P2 cases that guard an integration boundary or a
   stated acceptance criterion. Aim for roughly the top 20–30% by count, but **risk wins
   over the quota** — never drop a P1 to hit 20%, never pad to reach it.
3. Write a 1-paragraph justification: why these are the load-bearing cases.

## Consciously skipped appendix
Every candidate below the line is recorded, not deleted:

| Skipped case | Why skipped (risk too low / redundant with TC# / out of scope) |
|---|---|

A skip that is "redundant with TC#N" must name the covering case.
