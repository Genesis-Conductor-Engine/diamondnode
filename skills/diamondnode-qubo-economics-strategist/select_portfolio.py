#!/usr/bin/env python3
"""Diamondnode QUBO Economics Strategist — VPD-optimal skill portfolio selector.

Poses skill selection as a QUBO (budget-penalized knapsack) and solves it exactly
(small N) or via simulated annealing (large N), reporting a greedy-by-VPD baseline too.

Value scores are DECLARED HEURISTICS (from skill_value_manifest.yaml), never invented
benchmarks. Emitted records carry value_basis="heuristic".
"""
from __future__ import annotations
import argparse, glob, json, os, sys
from pathlib import Path

try:
    import numpy as np
except Exception:  # pragma: no cover
    np = None

HERE = Path(__file__).resolve().parent
DISCOVERY_DIRS = [
    Path.home() / ".claude" / "skills",
    Path.home() / ".agents" / "skills",
    Path.home() / ".openclaw" / "workspace" / "skills",
]
DEFAULT_VALUE = 1.0
DEFAULT_COST = 0.10  # neutral per-skill cost estimate, USD


def load_manifest() -> dict:
    p = HERE / "skill_value_manifest.yaml"
    if not p.exists():
        return {}
    # tiny YAML subset parser (no pyyaml dependency): "name: {value: x, cost_usd: y, ...}"
    out, cur = {}, None
    for raw in p.read_text().splitlines():
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        if not line.startswith(" ") and line.endswith(":"):
            cur = line[:-1].strip(); out[cur] = {}
        elif cur and ":" in line:
            k, v = [s.strip() for s in line.strip().split(":", 1)]
            if v.lower() in ("true", "false"):
                out[cur][k] = (v.lower() == "true")
            elif v.startswith("["):
                out[cur][k] = [s.strip() for s in v.strip("[]").split(",") if s.strip()]
            else:
                try: out[cur][k] = float(v)
                except ValueError: out[cur][k] = v
    return out


def discover(registry: str | None):
    if registry:
        items = json.loads(Path(registry).read_text())
        return [(d["name"], float(d.get("value_score", DEFAULT_VALUE)),
                 float(d.get("est_cost_usd", DEFAULT_COST)),
                 d.get("goal_vectors", []), bool(d.get("mandatory", False)), True)
                for d in items]
    man = load_manifest()
    seen, out = set(), []
    for d in DISCOVERY_DIRS:
        for sk in sorted(glob.glob(str(d / "*" / "SKILL.md"))):
            name = Path(sk).parent.name
            if name in seen:
                continue
            seen.add(name)
            m = man.get(name, {})
            out.append((name,
                        float(m.get("value", DEFAULT_VALUE)),
                        float(m.get("cost_usd", DEFAULT_COST)),
                        m.get("goal_vectors", []),
                        bool(m.get("mandatory", False)),
                        name in man))
    return out


def goal_boost(gv, goals):
    if not goals:
        return 1.0
    return 1.0 + 0.5 * len(set(gv) & set(goals))  # reward goal alignment


def greedy(items, budget, goals):
    ranked = sorted(items, key=lambda it: -(it[1] * goal_boost(it[3], goals)) / max(it[2], 0.01))
    chosen, spent = [], 0.0
    for name, v, c, gv, mand, _ in ranked:
        if mand or spent + c <= budget:
            chosen.append(name); spent += c
    return chosen, spent


def exact(items, budget, goals):
    n = len(items)
    best_obj, best_mask = -1e18, 0
    for mask in range(1 << n):
        obj = cost = 0.0; ok = True
        for i, (name, v, c, gv, mand, _) in enumerate(items):
            on = (mask >> i) & 1
            if mand and not on:
                ok = False; break
            if on:
                obj += v * goal_boost(gv, goals); cost += c
        if not ok:
            continue
        if cost <= budget and obj > best_obj:
            best_obj, best_mask = obj, mask
    chosen = [items[i][0] for i in range(n) if (best_mask >> i) & 1]
    spent = sum(items[i][2] for i in range(n) if (best_mask >> i) & 1)
    return chosen, spent


def anneal(items, budget, goals, steps=20000, seed=7):
    rng = np.random.default_rng(seed)
    n = len(items)
    v = np.array([it[1] * goal_boost(it[3], goals) for it in items])
    c = np.array([it[2] for it in items])
    mand = np.array([it[4] for it in items])
    x = mand.copy().astype(bool)
    def energy(x):
        over = max(c[x].sum() - budget, 0.0)
        return -(v[x].sum()) + 1000.0 * over * over
    e = energy(x); best_x, best_e = x.copy(), e
    for k in range(steps):
        T = max(0.01, 1.0 - k / steps)
        i = rng.integers(n)
        if mand[i]:
            continue
        y = x.copy(); y[i] = ~y[i]
        ey = energy(y)
        if ey < e or rng.random() < np.exp((e - ey) / T):
            x, e = y, ey
            if e < best_e:
                best_x, best_e = x.copy(), e
    chosen = [items[i][0] for i in range(n) if best_x[i]]
    return chosen, float(c[best_x].sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", required=True)
    ap.add_argument("--goals", nargs="*", default=[])
    ap.add_argument("--budget", type=float, default=5.0)
    ap.add_argument("--registry", default=None)
    ap.add_argument("--emit-evt", action="store_true")
    a = ap.parse_args()

    items = discover(a.registry)
    if not items:
        print(json.dumps({"error": "no skills discovered"})); sys.exit(1)

    g_sel, g_spent = greedy(items, a.budget, a.goals)
    if len(items) <= 20:
        q_sel, q_spent, solver = (*exact(items, a.budget, a.goals), "exact")
    elif np is not None:
        q_sel, q_spent, solver = (*anneal(items, a.budget, a.goals), "annealing")
    else:
        q_sel, q_spent, solver = g_sel, g_spent, "greedy_fallback_no_numpy"

    def obj_of(names):
        idx = {it[0]: it for it in items}
        return sum(idx[n][1] * goal_boost(idx[n][3], a.goals) for n in names)

    q_obj, g_obj = obj_of(q_sel), obj_of(g_sel)
    if g_obj > q_obj:  # greedy beat the solver under budget — take it
        sel, spent, obj, solver = g_sel, g_spent, g_obj, solver + "+greedy_won"
    else:
        sel, spent, obj = q_sel, q_spent, q_obj

    unscored = [it[0] for it in items if not it[5]]
    rec = {
        "agent": "diamondnode-qubo-economics-strategist",
        "task": a.task, "goal_vectors": a.goals, "budget_usd": a.budget,
        "selected_skills": sel, "selected_count": len(sel),
        "objective": round(obj, 4), "total_cost_usd": round(spent, 4),
        "vpd_cost_ratio": round(obj / max(spent, 0.01), 4),
        "solver": solver, "greedy_objective": round(g_obj, 4),
        "candidates": len(items), "value_basis": "heuristic",
        "unscored_skills": unscored, "verification_status": "computed",
    }
    print(json.dumps(rec, indent=2))
    if a.emit_evt:
        led = Path.home() / "diamond-node" / "goal-conductor" / "utilization_ledger.jsonl"
        if led.parent.exists():
            with led.open("a") as f:
                f.write(json.dumps(rec) + "\n")


if __name__ == "__main__":
    main()
