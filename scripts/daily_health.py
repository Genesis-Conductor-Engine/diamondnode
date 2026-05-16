"""Daily GPU health check and ttectra-gpu constraint report.

Writes report to ~/diamond-node/reports/health-<timestamp>.json
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

VENV = Path(os.environ.get("DIAMOND_VENV",
                            Path(__file__).parent.parent.parent / "venv312"))
REPORTS = Path(__file__).parent.parent / "reports"
REPORTS.mkdir(parents=True, exist_ok=True)


def _run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=60, **kw)


def gpu_telemetry() -> dict:
    r = _run(["nvidia-smi",
              "--query-gpu=name,temperature.gpu,power.draw,memory.used,memory.total,clocks.gr",
              "--format=csv,noheader,nounits"])
    if r.returncode != 0:
        return {"error": r.stderr.strip()}
    parts = [p.strip() for p in r.stdout.strip().split(",")]
    keys = ["name", "T_j_C", "power_W", "mem_used_MiB", "mem_total_MiB", "clock_MHz"]
    return {k: v for k, v in zip(keys, parts)}


def ttectra_report() -> dict:
    python = str(VENV / "bin" / "python")
    r = _run([python, "-m", "ttectra_gpu.cli", "--json", "simulate",
              "gtx1650", "--peak", "1", "--seconds", "0.5"])
    if r.returncode not in (0, 2):
        return {"error": r.stderr.strip()[:200]}
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout.strip()[:500]}


def ollama_status() -> dict:
    r = _run(["ollama", "list"])
    models = [line.split()[0] for line in r.stdout.strip().splitlines()[1:]
              if line.strip()] if r.returncode == 0 else []
    return {"models": models, "running": r.returncode == 0}


def main() -> None:
    ts = datetime.now(timezone.utc).isoformat()
    report = {
        "timestamp": ts,
        "gpu": gpu_telemetry(),
        "controller": ttectra_report(),
        "ollama": ollama_status(),
    }

    fname = REPORTS / f"health-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    fname.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
