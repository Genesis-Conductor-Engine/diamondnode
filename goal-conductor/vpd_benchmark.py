#!/usr/bin/env python3
"""VPD (value-per-dollar) benchmark harness — goal-conductor.

Measures REAL verification signals for the current working tree and produces
goal-conductor/reports/value_per_dollar_benchmark.md plus a JSON record.

Honesty contract:
- Every value input is measured by actually running the command (exit codes,
  parsed test counts, benchmark suite results). Nothing is estimated silently.
- Costs come from utilization_ledger.jsonl actual_cost_usd entries and/or the
  --session-cost-usd operator input. Missing costs are reported as missing.
- The emitted value_basis is "measured-internal-v0.1": internal signals against
  named internal baselines. It is NOT an external benchmark; the report says so.

Run (venv312 not required — stdlib only):
  python3 goal-conductor/vpd_benchmark.py [--session-cost-usd X] [--skip-gpu]
"""
from __future__ import annotations
import argparse, json, re, subprocess, time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
GC = REPO / "goal-conductor"
REPORTS = GC / "reports"
VENV_PY = Path.home() / "venv312" / "bin" / "python"

# Declared rubric weights (sum 1.0) over the first-prompt artifact value inputs
# that this harness can actually measure. Revenue/security/reusability inputs are
# explicitly out of scope for v0.1 and listed as unmeasured in the report.
WEIGHTS = {
    "tests_passed": 0.35,
    "typecheck": 0.20,
    "deployability": 0.25,
    "gpu_bench": 0.20,
}
# Scale factor mapping a perfect measured score (1.0) onto the first-prompt
# verified_artifact_value_score axis, so VPD flags (<1 poor, 1-5 acceptable,
# 5-20 strong, >20 excellent) keep their published meaning.
VALUE_SCALE = 10.0


def run(cmd: list[str], cwd: Path = REPO, timeout: int = 300) -> tuple[int, str]:
    t0 = time.time()
    try:
        p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr)
    except subprocess.TimeoutExpired:
        return 124, f"timeout after {time.time()-t0:.0f}s"
    except FileNotFoundError as e:
        return 127, str(e)


def measure_tests() -> dict:
    rc, out = run(["npm", "test"])
    m = re.search(r"Tests\s+(?:(\d+) failed \| )?(\d+) passed \((\d+)\)", out)
    passed = int(m.group(2)) if m else 0
    total = int(m.group(3)) if m else 0
    failed = int(m.group(1)) if (m and m.group(1)) else 0
    score = (passed / total) if total else 0.0
    return {"signal": "tests_passed", "command": "npm test", "exit": rc,
            "passed": passed, "failed": failed, "total": total, "score": round(score, 4)}


def measure_typecheck() -> dict:
    rc, _ = run(["npm", "run", "typecheck"])
    return {"signal": "typecheck", "command": "npm run typecheck", "exit": rc,
            "score": 1.0 if rc == 0 else 0.0}


def measure_deploy_dry() -> dict:
    rc, _ = run(["npm", "run", "deploy:dry"], timeout=180)
    return {"signal": "deployability", "command": "npm run deploy:dry", "exit": rc,
            "score": 1.0 if rc == 0 else 0.0}


def measure_gpu_bench(skip: bool) -> dict:
    if skip:
        return {"signal": "gpu_bench", "command": "(skipped)", "exit": None, "score": None}
    py = str(VENV_PY) if VENV_PY.exists() else "python3"
    rc, out = run([py, "scripts/benchmark.py", "--suite", "gpu", "--json"], timeout=300)
    passed = total = 0
    try:
        for line in out.splitlines():
            line = line.strip()
            if line.startswith("{") or line.startswith("["):
                data = json.loads(line)
                results = data if isinstance(data, list) else data.get("results", [data])
                for r in results:
                    if isinstance(r, dict) and "passed" in r:
                        total += 1
                        passed += 1 if r["passed"] else 0
                break
    except (json.JSONDecodeError, KeyError):
        pass
    if total == 0:  # fall back to exit code only
        return {"signal": "gpu_bench", "command": "benchmark.py --suite gpu", "exit": rc,
                "score": 1.0 if rc == 0 else 0.0, "note": "scored by exit code; JSON parse found no results"}
    return {"signal": "gpu_bench", "command": "benchmark.py --suite gpu", "exit": rc,
            "passed": passed, "total": total, "score": round(passed / total, 4)}


def ledger_costs() -> dict:
    led = GC / "utilization_ledger.jsonl"
    actual, n_actual, n_null = 0.0, 0, 0
    if led.exists():
        for line in led.read_text().splitlines():
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            c = rec.get("actual_cost_usd")
            if isinstance(c, (int, float)):
                actual += c; n_actual += 1
            else:
                n_null += 1
    return {"ledger_actual_cost_usd": round(actual, 4), "records_with_cost": n_actual,
            "records_without_cost": n_null}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--session-cost-usd", type=float, default=None,
                    help="Operator-supplied actual session cost (USD)")
    ap.add_argument("--skip-gpu", action="store_true")
    ap.add_argument("--emit-evt", action="store_true")
    a = ap.parse_args()

    signals = [measure_tests(), measure_typecheck(), measure_deploy_dry(), measure_gpu_bench(a.skip_gpu)]
    scored = {s["signal"]: s for s in signals if s["score"] is not None}

    # Renormalize weights over the signals actually measured this run.
    wsum = sum(WEIGHTS[k] for k in scored)
    measured_score = sum(WEIGHTS[k] / wsum * scored[k]["score"] for k in scored) if wsum else 0.0
    value_score = round(measured_score * VALUE_SCALE, 4)

    costs = ledger_costs()
    cost_usd = a.session_cost_usd if a.session_cost_usd is not None else costs["ledger_actual_cost_usd"]
    vpd = round(value_score / max(cost_usd, 0.01), 4) if cost_usd is not None else None
    flag = (None if vpd is None else
            "poor" if vpd < 1 else "acceptable" if vpd < 5 else "strong" if vpd < 20 else "excellent")

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    record = {
        "ts_utc": ts, "agent": "vpd_benchmark", "value_basis": "measured-internal-v0.1",
        "signals": signals, "weights": WEIGHTS, "value_scale": VALUE_SCALE,
        "verified_artifact_value_score": value_score,
        "cost_source": "operator" if a.session_cost_usd is not None else "ledger",
        "cost_usd": cost_usd, **costs,
        "value_per_dollar": vpd, "flag": flag,
        "unmeasured_inputs": ["revenue_vector_contribution", "security_improvement",
                              "reusability", "operator_time_saved", "future_cost_reduction"],
    }

    REPORTS.mkdir(exist_ok=True)
    (REPORTS / "value_per_dollar_benchmark.json").write_text(json.dumps(record, indent=2))

    lines = [
        "# Value-per-Dollar Benchmark — measured-internal-v0.1",
        "",
        f"Generated: {ts}  |  Harness: `goal-conductor/vpd_benchmark.py`",
        "",
        "## Scope and honesty statement",
        "",
        "This is an **internal** benchmark over signals measured by actually running the",
        "verification commands below. It is NOT an external benchmark; external claims",
        "(\"unrivalled\" etc.) remain forbidden until named external baselines are added.",
        "",
        "## Named baselines",
        "",
        "- **B0 (floor)**: unverified working tree — typecheck/tests/deploy not run → value 0.",
        "- **B1 (target)**: all measured signals pass → value score "
        f"{VALUE_SCALE} on the first-prompt axis.",
        "- Cost baseline: actual costs recorded in `utilization_ledger.jsonl` "
        "(or operator-supplied `--session-cost-usd`).",
        "",
        "## Measured signals",
        "",
        "| Signal | Command | Result | Score | Weight |",
        "|---|---|---|---|---|",
    ]
    for s in signals:
        result = ("skipped" if s["score"] is None else
                  f"{s.get('passed','-')}/{s.get('total','-')} pass" if "total" in s else
                  ("ok" if s["exit"] == 0 else f"exit {s['exit']}"))
        w = WEIGHTS.get(s["signal"], 0)
        lines.append(f"| {s['signal']} | `{s['command']}` | {result} | "
                     f"{s['score'] if s['score'] is not None else '—'} | {w} |")
    lines += [
        "",
        f"**verified_artifact_value_score = {value_score}** (weighted, ×{VALUE_SCALE} scale)",
        "",
        "## Cost and VPD",
        "",
        f"- Cost source: {record['cost_source']} → **${cost_usd}**",
        f"- Ledger records with measured cost: {costs['records_with_cost']}; "
        f"without: {costs['records_without_cost']}",
        f"- **value_per_dollar = {vpd}** → flag: **{flag}**",
        "",
        "## Not yet measured (excluded from score, not faked)",
        "",
    ] + [f"- {u}" for u in record["unmeasured_inputs"]] + [
        "",
        "## Roadmap to external baselines",
        "",
        "- Pull named comparator costs (Anthropic list pricing per model tier; local",
        "  Ollama runtime) and artifact-quality comparators via HuggingFace MCP",
        "  (model cards, leaderboard entries) — each must be named + dated in this file.",
        "- Until then, `value_basis` stays `measured-internal-v0.1`.",
    ]
    (REPORTS / "value_per_dollar_benchmark.md").write_text("\n".join(lines) + "\n")

    print(json.dumps({k: record[k] for k in
                      ["verified_artifact_value_score", "cost_usd", "value_per_dollar", "flag", "value_basis"]},
                     indent=2))
    if a.emit_evt:
        with (GC / "utilization_ledger.jsonl").open("a") as f:
            f.write(json.dumps({"ts_utc": ts, "task_id": "VPD-BENCH", "record_type": "vpd_benchmark",
                                "agent": "vpd_benchmark", "value_basis": record["value_basis"],
                                "verified_artifact_value_score": value_score,
                                "actual_cost_usd": cost_usd, "value_per_dollar": vpd, "flag": flag}) + "\n")


if __name__ == "__main__":
    main()
