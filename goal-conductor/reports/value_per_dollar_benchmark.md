# Value-per-Dollar Benchmark — measured-internal-v0.1

Generated: 2026-06-10T11:03:15Z  |  Harness: `goal-conductor/vpd_benchmark.py`

## Scope and honesty statement

This is an **internal** benchmark over signals measured by actually running the
verification commands below. It is NOT an external benchmark; external claims
("unrivalled" etc.) remain forbidden until named external baselines are added.

## Named baselines

- **B0 (floor)**: unverified working tree — typecheck/tests/deploy not run → value 0.
- **B1 (target)**: all measured signals pass → value score 10.0 on the first-prompt axis.
- Cost baseline: actual costs recorded in `utilization_ledger.jsonl` (or operator-supplied `--session-cost-usd`).

## Measured signals

| Signal | Command | Result | Score | Weight |
|---|---|---|---|---|
| tests_passed | `npm test` | 21/21 pass | 1.0 | 0.35 |
| typecheck | `npm run typecheck` | ok | 1.0 | 0.2 |
| deployability | `npm run deploy:dry` | ok | 1.0 | 0.25 |
| gpu_bench | `benchmark.py --suite gpu` | ok | 1.0 | 0.2 |

**verified_artifact_value_score = 10.0** (weighted, ×10.0 scale)

## Cost and VPD

- Cost source: operator → **$4.5**
- Ledger records with measured cost: 0; without: 2
- **value_per_dollar = 2.2222** → flag: **acceptable**

## Not yet measured (excluded from score, not faked)

- revenue_vector_contribution
- security_improvement
- reusability
- operator_time_saved
- future_cost_reduction

## Roadmap to external baselines

- Pull named comparator costs (Anthropic list pricing per model tier; local
  Ollama runtime) and artifact-quality comparators via HuggingFace MCP
  (model cards, leaderboard entries) — each must be named + dated in this file.
- Until then, `value_basis` stays `measured-internal-v0.1`.
