// Deterministic power-tower arbitration, ported from unified_inference/optimizer.py.
// Replaces the v0.3 mock (hardcoded energy, Math.random elapsed_ms) so that signed
// audit events attest only to values actually computed from caller telemetry.

// Hard constraints (GTX 1650 profile) — keep in sync with OrthogonalOptimizer defaults.
const VRAM_MAX_MIB = 3400; // 85% of 4 GB
const TEMP_MAX_C = 80.0;
const HAMILTONIAN_MAX = 8.5;
const GUARDIAN_VETO_THRESHOLD = 0.4;

export interface PowerTowerInputs {
  guardian_r?: number;
  revenue_impact?: number;
  vram_used_mib?: number;
  vram_total_mib?: number;
  temp_celsius?: number;
  hamiltonian?: number;
}

export interface PowerTowerDecision {
  decision: "promote" | "veto";
  reason: "maru_guardian" | "constraint_violation" | "objective_score";
  // Negated weighted objective F(x) over the dimensions computable from the
  // supplied telemetry (lower = better, matching QUBO energy convention).
  energy: number | null;
  objective_scores: { vram_efficiency: number | null; revenue: number | null };
  constraint_violations: string[];
  // Which telemetry fields the caller actually supplied — anything not listed
  // did not influence the decision.
  telemetry_used: string[];
  mode: "deterministic-objective-v1";
  elapsed_ms: number;
  inputs: PowerTowerInputs;
}

// f_vram(x) = (used/total) * sigmoid(10 * (target - used)/target) — optimizer.py vram_efficiency.
function vramEfficiency(usedMib: number, totalMib: number): number {
  const utilRatio = usedMib / totalMib;
  const distanceToTarget = (VRAM_MAX_MIB - usedMib) / VRAM_MAX_MIB;
  const sigmoid = 1.0 / (1.0 + Math.exp(-10.0 * distanceToTarget));
  return Math.max(0.0, Math.min(1.0, utilRatio * sigmoid));
}

function checkConstraints(b: PowerTowerInputs): string[] {
  const violations: string[] = [];
  if (typeof b.vram_used_mib === "number" && b.vram_used_mib > VRAM_MAX_MIB) {
    violations.push(`VRAM: ${b.vram_used_mib} > ${VRAM_MAX_MIB} MiB`);
  }
  if (typeof b.temp_celsius === "number" && b.temp_celsius > TEMP_MAX_C) {
    violations.push(`Temperature: ${b.temp_celsius} > ${TEMP_MAX_C}°C`);
  }
  if (typeof b.hamiltonian === "number" && b.hamiltonian > HAMILTONIAN_MAX) {
    violations.push(`Hamiltonian: ${b.hamiltonian.toFixed(2)} > ${HAMILTONIAN_MAX}`);
  }
  return violations;
}

export function arbitratePowerTower(raw: unknown): PowerTowerDecision {
  const t0 = Date.now();
  const b: PowerTowerInputs = {};
  const telemetryUsed: string[] = [];
  if (raw && typeof raw === "object") {
    for (const k of ["guardian_r", "revenue_impact", "vram_used_mib", "vram_total_mib", "temp_celsius", "hamiltonian"] as const) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "number" && Number.isFinite(v)) {
        b[k] = v;
        telemetryUsed.push(k);
      }
    }
  }

  const violations = checkConstraints(b);

  const vramScore =
    typeof b.vram_used_mib === "number" && typeof b.vram_total_mib === "number" && b.vram_total_mib > 0
      ? vramEfficiency(b.vram_used_mib, b.vram_total_mib)
      : null;
  const revenueScore =
    typeof b.revenue_impact === "number" ? Math.max(0.0, Math.min(1.0, b.revenue_impact)) : null;

  // Weighted objective over whatever dimensions were supplied; null when none were.
  const parts = [vramScore, revenueScore].filter((s): s is number => s !== null);
  const energy = parts.length > 0 ? -(parts.reduce((a, s) => a + s, 0) / parts.length) : null;

  let decision: PowerTowerDecision["decision"];
  let reason: PowerTowerDecision["reason"];
  if (typeof b.guardian_r === "number" && b.guardian_r > GUARDIAN_VETO_THRESHOLD) {
    decision = "veto";
    reason = "maru_guardian";
  } else if (violations.length > 0) {
    decision = "veto";
    reason = "constraint_violation";
  } else {
    decision = "promote";
    reason = "objective_score";
  }

  return {
    decision,
    reason,
    energy: energy !== null ? Number(energy.toFixed(4)) : null,
    objective_scores: {
      vram_efficiency: vramScore !== null ? Number(vramScore.toFixed(4)) : null,
      revenue: revenueScore,
    },
    constraint_violations: violations,
    telemetry_used: telemetryUsed,
    mode: "deterministic-objective-v1",
    elapsed_ms: Date.now() - t0,
    inputs: b,
  };
}
