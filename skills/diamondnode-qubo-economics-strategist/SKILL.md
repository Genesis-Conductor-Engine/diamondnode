---
name: diamondnode-qubo-economics-strategist
description: Select a high value-per-dollar (VPD) skill portfolio for a Diamondnode task using a QUBO/knapsack formulation. Use when asked to choose which skills/tools to instantiate for a job under a cost budget, to optimize VPD, or to run Step 3 of the qubo-first-prompt. Discovers installed skills, scores value vs. cost, and emits an evt- record with selected_skills, objective, and vpd_cost_ratio. Honest: value scores are declared heuristics until externally benchmarked — it never invents benchmark numbers.
---

# Diamondnode QUBO Economics Strategist

Picks the subset of available skills that maximizes verified-value-per-dollar for a given
task, subject to a cost budget and mandatory-baseline constraints. The selection is posed as a
QUBO (Quadratic Unconstrained Binary Optimization) and solved exactly for small N, by simulated
annealing for large N, with a greedy VPD baseline always reported for sanity.

## When to use
- "Run Step 3" / "activate the qubo economics strategist".
- "Which skills should I load for <task> under $<budget>?"
- Building a VPD-optimized portfolio that accelerates G1 (revenue tooling) or G4 (control plane).

## Honesty contract (do not violate)
- `value_score` per skill is a **declared heuristic** from `skill_value_manifest.yaml`, NOT a measured
  benchmark. The emitted record marks `value_basis: "heuristic"`.
- Never emit `value_basis: "benchmarked"` unless a named-baseline report exists under
  `goal-conductor/reports/value_per_dollar_benchmark.md`.
- If no manifest entry exists for a skill, it gets the neutral default (value 1.0) and is flagged.

## Inputs
1. **Task spec**: free text + optional goal_vectors (G1..G5) + cost budget USD.
2. **Skill registry**: auto-discovered from (in order) `~/.claude/skills`, `~/.agents/skills`,
   `~/.openclaw/workspace/skills`. Each dir with a `SKILL.md` is a candidate. An explicit
   `--registry <file.json>` (A2A registry: `[{name, value_score, est_cost_usd, goal_vectors, mandatory}]`)
   overrides discovery.
3. **Value manifest**: `skill_value_manifest.yaml` (next to this file) maps skill name →
   `{value, cost_usd, goal_vectors, mandatory}`. Edit it to tune; unknown skills use defaults.

## Model
QUBO over binary x_i (1 = include skill i):

    maximize  Σ v_i x_i  −  λ·(Σ c_i x_i − B)_+²   (budget penalty)
    subject to mandatory skills forced x_i = 1

Implemented in `select_portfolio.py`:
- N ≤ 20 → exact brute force.
- N > 20 → simulated annealing (numpy), seeded, deterministic.
- Greedy-by-VPD baseline always computed; the better of {QUBO, greedy} is returned.

`objective` = Σ v_i over selected. `vpd_cost_ratio` = Σ v_i / max(Σ c_i, 0.01).

## Run
```bash
~/venv312/bin/python ~/.claude/skills/diamondnode-qubo-economics-strategist/select_portfolio.py \
  --task "build minimal Hermes->openclaw->Haiku bridge" \
  --goals G1 G4 --budget 5.00 --emit-evt
```
Add `--registry path.json` to use an A2A registry instead of disk discovery.
Output is an evt- JSON record (also appendable to `goal-conductor/utilization_ledger.jsonl`).

## Output schema (evt-)
```json
{
  "agent": "diamondnode-qubo-economics-strategist",
  "task": "...", "goal_vectors": ["G1","G4"], "budget_usd": 5.0,
  "selected_skills": ["..."], "selected_count": 0,
  "objective": 0.0, "total_cost_usd": 0.0, "vpd_cost_ratio": 0.0,
  "solver": "exact|annealing", "greedy_objective": 0.0,
  "value_basis": "heuristic", "unscored_skills": ["..."],
  "verification_status": "computed"
}
```

## Wiring
Append the emitted record to `goal-conductor/utilization_ledger.jsonl` and reference its
`vpd_cost_ratio` in `goal_conductor_live_artifact.yaml`. Then hand off to openclaw.
