"""LLM interpretation pass — reads latest QUBO state, asks Ollama to interpret
the mycelial network and suggest next-iteration parameters.

Output is appended to logs/llm-interpretations.jsonl
"""
from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

STATE_DIR = Path(os.environ.get("DIAMOND_STATE_DIR",
                                Path(__file__).parent.parent / "state"))
LOG_DIR = Path(os.environ.get("DIAMOND_LOG_DIR",
                              Path(__file__).parent.parent / "logs"))
INTERP_LOG = LOG_DIR / "llm-interpretations.jsonl"


def _ollama_query(prompt: str, model: str = "llama3.2:3b") -> str:
    result = subprocess.run(
        ["ollama", "run", model],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=120,
    )
    return result.stdout.strip()


def _summarise_state(state: dict) -> str:
    n = state.get("n_nodes", 0)
    edges = state.get("active_edges", [])
    best_e = state.get("best_energy", 0)
    hist = state.get("energy_history", [])
    trend = "improving" if len(hist) > 1 and hist[-1] < hist[-2] else "stable"
    res = state.get("resource_nodes", [])
    return (
        f"Mycelial network: {n} nodes, {len(edges)} active hyphal connections, "
        f"best QUBO energy {best_e:.4f}, energy trend: {trend}, "
        f"resource nodes: {res}. Iteration {state.get('iteration', 0)}."
    )


def main() -> None:
    state_file = STATE_DIR / "mycelial_state.json"
    if not state_file.exists():
        print("No state file found — run mycelial_qubo.py first")
        return

    state = json.loads(state_file.read_text())
    summary = _summarise_state(state)

    prompt = (
        "You are a mycological systems analyst reviewing a QUBO-optimised "
        "fungal hyphal network simulation running on a GPU cluster node.\n\n"
        f"Current network summary: {summary}\n\n"
        "In 3-4 sentences: (1) assess network health and connectivity, "
        "(2) identify the dominant growth pattern, "
        "(3) recommend one parameter change for the next QUBO iteration "
        "(e.g. adjust lambda_dist, lambda_redund, subspace_size, or shots). "
        "Be concrete and brief."
    )

    response = _ollama_query(prompt)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "iteration": state.get("iteration", 0),
        "summary": summary,
        "interpretation": response,
    }

    with INTERP_LOG.open("a") as f:
        f.write(json.dumps(entry) + "\n")

    print(f"[{entry['timestamp']}] iteration={entry['iteration']}")
    print(response)


if __name__ == "__main__":
    main()
