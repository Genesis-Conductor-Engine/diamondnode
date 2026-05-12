"""jules-cli benchmark runner — DiamondNode GTX 1650

Runs a structured benchmark suite and emits a machine-readable report.
Designed to be invoked as:
    python benchmark.py [--suite all|qubo|llm|gpu|cudaq] [--json]

jules-cli compatibility: each test returns a dict with keys
    name, passed, duration_s, value, unit, threshold, notes
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

VENV_PY = Path("/home/diamondnode/venv312/bin/python")
SCRIPTS = Path("/home/diamondnode/diamond-node/scripts")
STATE_DIR = Path("/home/diamondnode/diamond-node/state")


def _run(cmd: list[str], timeout: int = 120) -> tuple[int, str, str]:
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return r.returncode, r.stdout, r.stderr


def bench_gpu_telemetry() -> dict:
    name = "gpu_telemetry"
    t0 = time.perf_counter()
    rc, out, err = _run(["nvidia-smi",
                         "--query-gpu=temperature.gpu,power.draw,memory.used",
                         "--format=csv,noheader,nounits"])
    dur = time.perf_counter() - t0
    if rc != 0:
        return {"name": name, "passed": False, "duration_s": dur, "notes": err.strip()[:120]}
    parts = [p.strip() for p in out.strip().split(",")]
    tj = float(parts[0])
    return {
        "name": name, "passed": tj < 89.6, "duration_s": round(dur, 3),
        "value": tj, "unit": "°C", "threshold": 89.6,
        "notes": f"T_j={tj}°C  P={parts[1]}W  mem={parts[2]}MiB",
    }


def bench_cudaq_probe() -> dict:
    name = "cudaq_probe"
    t0 = time.perf_counter()
    rc, out, err = _run([str(VENV_PY), str(SCRIPTS / "_cudaq_probe.py")])
    dur = time.perf_counter() - t0
    if rc != 0:
        return {"name": name, "passed": False, "duration_s": round(dur, 3),
                "notes": err.strip()[:200]}
    try:
        d = json.loads(out.strip())
        total = d["total"]
        passed = total == 256
        return {"name": name, "passed": passed, "duration_s": round(dur, 3),
                "value": total, "unit": "shots", "threshold": 256,
                "notes": f"counts={d['counts']}"}
    except Exception as e:
        return {"name": name, "passed": False, "duration_s": round(dur, 3),
                "notes": str(e)[:120]}

def bench_qubo_iteration() -> dict:
    name = "qubo_iteration"
    t0 = time.perf_counter()
    rc, out, err = _run(
        [str(VENV_PY), str(SCRIPTS / "mycelial_qubo.py"),
         "--shots", "128", "--outer-rounds", "1"],
        timeout=180,
    )
    dur = time.perf_counter() - t0
    if rc != 0:
        return {"name": name, "passed": False, "duration_s": round(dur, 3),
                "notes": err.strip()[:200]}
    try:
        # Find the last JSON line
        for line in reversed(out.strip().splitlines()):
            line = line.strip()
            if line.startswith("{"):
                d = json.loads(line)
                energy = d.get("energy", float("inf"))
                return {
                    "name": name, "passed": True, "duration_s": round(dur, 3),
                    "value": round(energy, 4), "unit": "QUBO energy",
                    "threshold": None,
                    "notes": f"active_edges={d.get('active_edges')} "
                             f"subspaces={len(d.get('subspaces', []))}",
                }
    except Exception:
        pass
    return {"name": name, "passed": rc == 0, "duration_s": round(dur, 3),
            "notes": out.strip()[:200]}


def bench_llm_latency() -> dict:
    name = "llm_latency"
    t0 = time.perf_counter()
    rc, out, err = _run(
        ["ollama", "run", "llama3.2:3b",
         "Reply with exactly: OK"],
        timeout=60,
    )
    dur = time.perf_counter() - t0
    passed = rc == 0 and len(out.strip()) < 80
    return {
        "name": name, "passed": passed, "duration_s": round(dur, 3),
        "value": round(dur, 3), "unit": "s", "threshold": 30.0,
        "notes": out.strip()[:60],
    }


def bench_state_persistence() -> dict:
    name = "state_persistence"
    t0 = time.perf_counter()
    sf = STATE_DIR / "mycelial_state.json"
    exists = sf.exists()
    dur = time.perf_counter() - t0
    if not exists:
        return {"name": name, "passed": False, "duration_s": round(dur, 3),
                "notes": "state file missing — run mycelial_qubo.py first"}
    try:
        d = json.loads(sf.read_text())
        iteration = d.get("iteration", 0)
        edges = len(d.get("active_edges", []))
        return {
            "name": name, "passed": True, "duration_s": round(dur, 3),
            "value": iteration, "unit": "iterations",
            "notes": f"iteration={iteration} active_edges={edges}",
        }
    except Exception as e:
        return {"name": name, "passed": False, "duration_s": round(dur, 3),
                "notes": str(e)[:120]}


SUITES = {
    "gpu": [bench_gpu_telemetry],
    "cudaq": [bench_cudaq_probe],
    "qubo": [bench_qubo_iteration, bench_state_persistence],
    "llm": [bench_llm_latency],
}
SUITES["all"] = [f for fns in SUITES.values() for f in fns]


def main() -> None:
    p = argparse.ArgumentParser(description="DiamondNode benchmark suite (jules-cli)")
    p.add_argument("--suite", default="all", choices=list(SUITES))
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    results = []
    for fn in SUITES[args.suite]:
        sys.stderr.write(f"  running {fn.__name__}... ")
        sys.stderr.flush()
        try:
            r = fn()
        except Exception as e:
            r = {"name": fn.__name__, "passed": False,
                 "duration_s": 0, "notes": str(e)[:120]}
        results.append(r)
        sys.stderr.write("PASS\n" if r["passed"] else "FAIL\n")

    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "suite": args.suite,
        "passed": passed,
        "total": total,
        "success_rate": round(passed / total, 3) if total else 0,
        "results": results,
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"DiamondNode Benchmark — {report['timestamp']}")
        print(f"Suite: {args.suite}  |  {passed}/{total} passed")
        print(f"{'='*50}")
        for r in results:
            status = "PASS" if r["passed"] else "FAIL"
            val = f"  {r.get('value','')} {r.get('unit','')}" if "value" in r else ""
            print(f"  [{status}] {r['name']:<28} {r['duration_s']:.2f}s{val}")
            if not r["passed"] and r.get("notes"):
                print(f"         {r['notes']}")
        print()

    # Save report
    rdir = Path("/home/diamondnode/diamond-node/reports")
    rdir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (rdir / f"benchmark-{ts}.json").write_text(json.dumps(report, indent=2))

    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
