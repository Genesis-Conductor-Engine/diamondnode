import { describe, it, expect } from "vitest";
import { arbitratePowerTower } from "../src/power-tower.js";

describe("arbitratePowerTower", () => {
  it("vetoes when guardian_r exceeds threshold", () => {
    const d = arbitratePowerTower({ guardian_r: 0.5 });
    expect(d.decision).toBe("veto");
    expect(d.reason).toBe("maru_guardian");
  });

  it("promotes below guardian threshold with no violations", () => {
    const d = arbitratePowerTower({ guardian_r: 0.1, revenue_impact: 0.6 });
    expect(d.decision).toBe("promote");
    expect(d.reason).toBe("objective_score");
  });

  it("vetoes on VRAM constraint violation", () => {
    const d = arbitratePowerTower({ guardian_r: 0.1, vram_used_mib: 3900, vram_total_mib: 4096 });
    expect(d.decision).toBe("veto");
    expect(d.reason).toBe("constraint_violation");
    expect(d.constraint_violations[0]).toContain("VRAM");
  });

  it("vetoes on thermal and hamiltonian violations", () => {
    const d = arbitratePowerTower({ temp_celsius: 85, hamiltonian: 9.1 });
    expect(d.decision).toBe("veto");
    expect(d.constraint_violations).toHaveLength(2);
  });

  it("guardian veto takes precedence over constraint violations", () => {
    const d = arbitratePowerTower({ guardian_r: 0.9, temp_celsius: 85 });
    expect(d.reason).toBe("maru_guardian");
  });

  it("is deterministic: identical inputs produce identical energy", () => {
    const input = { guardian_r: 0.2, revenue_impact: 0.4, vram_used_mib: 2800, vram_total_mib: 4096 };
    const a = arbitratePowerTower(input);
    const b = arbitratePowerTower(input);
    expect(a.energy).toBe(b.energy);
    expect(a.objective_scores).toEqual(b.objective_scores);
  });

  it("reports null energy when no scoreable telemetry supplied", () => {
    const d = arbitratePowerTower({});
    expect(d.energy).toBeNull();
    expect(d.telemetry_used).toEqual([]);
    expect(d.decision).toBe("promote");
  });

  it("does not let callers inject decision fields into the signed payload", () => {
    const d = arbitratePowerTower({ guardian_r: 0.9, decision: "promote", energy: -99 } as any);
    expect(d.decision).toBe("veto");
    expect(d.energy).not.toBe(-99);
    expect((d.inputs as any).decision).toBeUndefined();
  });

  it("ignores non-finite and non-numeric telemetry", () => {
    const d = arbitratePowerTower({ guardian_r: "0.9", temp_celsius: NaN, vram_used_mib: Infinity } as any);
    expect(d.telemetry_used).toEqual([]);
    expect(d.decision).toBe("promote");
  });

  it("vram efficiency peaks below the 3400 MiB target (optimizer.py parity)", () => {
    const mid = arbitratePowerTower({ vram_used_mib: 2800, vram_total_mib: 4096 });
    const over = arbitratePowerTower({ vram_used_mib: 3390, vram_total_mib: 4096 });
    // At the target boundary the sigmoid collapses toward 0.5, dragging the score
    // below the mid-utilization point despite higher raw utilization.
    expect(mid.objective_scores.vram_efficiency!).toBeGreaterThan(0.5);
    expect(over.objective_scores.vram_efficiency!).toBeLessThan(mid.objective_scores.vram_efficiency!);
  });
});
