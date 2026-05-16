"""Orthogonal Optimization Benchmarking Suite

Comprehensive benchmarks to test all four optimization dimensions:
1. VRAM Efficiency
2. Compute Throughput
3. Model Accuracy
4. Waveform Equilibrium

Generates Pareto curves and optimal operating point analysis.
"""

import json
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from unified_inference.optimizer import (
    OrthogonalOptimizer,
    WorkloadType,
    SystemState,
    ModelMetrics,
    OptimizationDimension,
    OperatingPoint,
    generate_optimization_report
)


# ==============================================================================
# Mock Data Generation (for testing without live GPU)
# ==============================================================================

def generate_mock_system_state(vram_used_mib: int) -> SystemState:
    """Generate realistic mock system state."""
    vram_total = 3972  # GTX 1650
    vram_util = 100.0 * vram_used_mib / vram_total

    # Temperature scales with VRAM usage (simplified model)
    temp_celsius = 29.0 + (vram_util / 100.0) * 45.0  # 29°C idle, 74°C at 100%

    # Hamiltonian from Ising model
    hamiltonian = (vram_used_mib / vram_total) * 10.0 + 0.3 * (temp_celsius / 89.6)

    return SystemState(
        vram_used_mib=vram_used_mib,
        vram_total_mib=vram_total,
        vram_util_pct=vram_util,
        temp_celsius=temp_celsius,
        hamiltonian=hamiltonian,
        active_models=[]
    )


def generate_mock_cuda_q_metrics(config: Dict) -> ModelMetrics:
    """Generate realistic CUDA-Q metrics."""
    # Throughput decreases with more qubits and shots
    base_throughput = 250.0
    qubit_penalty = config.get("max_qubits", 16) / 16.0
    shot_penalty = config.get("shots_per_iteration", 1024) / 1024.0
    throughput = base_throughput / (qubit_penalty * shot_penalty)

    # Accuracy improves with more shots
    base_gradient = 0.01
    accuracy = base_gradient / shot_penalty

    # Waveform equilibrium
    purity = 0.90 + 0.08 * shot_penalty
    effective_dim = 10.0 / shot_penalty
    energy_grad = accuracy

    return ModelMetrics(
        model_name="cuda-q",
        vram_used_mib=config.get("vram_allocation_mib", 150),
        throughput_ops_per_sec=throughput,
        accuracy_score=accuracy,
        latency_p50_ms=1000.0 / throughput,
        latency_p95_ms=1500.0 / throughput,
        purity=purity,
        effective_dimension=effective_dim,
        energy_gradient=energy_grad
    )


def generate_mock_yolo_metrics(config: Dict) -> ModelMetrics:
    """Generate realistic YOLO11s metrics."""
    # Throughput increases with batch size but limited by GPU
    base_fps = 25.0
    batch_size = config.get("batch_size", 2)
    throughput = base_fps * min(1.5, 1.0 + batch_size * 0.15)

    # Accuracy slightly decreases with larger batches (competition for compute)
    base_map = 0.75
    accuracy = base_map * (1.0 - batch_size * 0.02)

    return ModelMetrics(
        model_name="yolo11s",
        vram_used_mib=config.get("vram_allocation_mib", 1200),
        throughput_ops_per_sec=throughput,
        accuracy_score=accuracy,
        latency_p50_ms=1000.0 / throughput,
        latency_p95_ms=1200.0 / throughput,
        purity=None,
        effective_dimension=None,
        energy_gradient=None
    )


def generate_mock_qwen_metrics(config: Dict) -> ModelMetrics:
    """Generate realistic Qwen 1.5 metrics."""
    # Throughput affected by sequence length and quantization
    base_throughput = 20.0
    seq_length = config.get("max_seq_length", 2048)
    quantization = config.get("quantization", "int4")

    quant_speedup = {"int4": 1.5, "int8": 1.2, "fp16": 1.0}.get(quantization, 1.0)
    length_penalty = seq_length / 2048.0
    throughput = base_throughput * quant_speedup / length_penalty

    # Perplexity (lower is better) degrades with aggressive quantization
    base_perplexity = 4.0
    quant_penalty = {"int4": 1.3, "int8": 1.1, "fp16": 1.0}.get(quantization, 1.0)
    accuracy = base_perplexity * quant_penalty

    # VRAM scales with quantization
    base_vram = 3000
    quant_reduction = {"int4": 0.4, "int8": 0.6, "fp16": 1.0}.get(quantization, 1.0)
    vram = int(base_vram * quant_reduction)

    return ModelMetrics(
        model_name="qwen-1.5",
        vram_used_mib=vram,
        throughput_ops_per_sec=throughput,
        accuracy_score=accuracy,
        latency_p50_ms=1000.0 / throughput,
        latency_p95_ms=1500.0 / throughput,
        purity=None,
        effective_dimension=None,
        energy_gradient=None
    )


# ==============================================================================
# Benchmark Configurations
# ==============================================================================

def generate_test_configurations() -> List[Dict]:
    """Generate diverse configurations for Pareto frontier analysis."""
    configs = []

    # Scientific configurations (CUDA-Q variations)
    for shots in [256, 512, 1024, 2048]:
        for qubits in [12, 16, 20]:
            configs.append({
                "name": f"scientific_q{qubits}_s{shots}",
                "workload": "scientific",
                "cuda_q": {
                    "max_qubits": qubits,
                    "shots_per_iteration": shots,
                    "vram_allocation_mib": 120 + qubits * 5
                }
            })

    # Vision configurations (YOLO variations)
    for batch_size in [1, 2, 4, 8]:
        for input_size in [416, 640]:
            configs.append({
                "name": f"vision_b{batch_size}_i{input_size}",
                "workload": "vision",
                "yolo11s": {
                    "batch_size": batch_size,
                    "input_size": input_size,
                    "vram_allocation_mib": 800 + batch_size * 120 + (input_size - 416) * 2
                }
            })

    # Conversational configurations (Qwen variations)
    for quant in ["int4", "int8", "fp16"]:
        for seq_len in [1024, 2048, 4096]:
            configs.append({
                "name": f"conversational_{quant}_seq{seq_len}",
                "workload": "conversational",
                "qwen_1_5": {
                    "quantization": quant,
                    "max_seq_length": seq_len,
                    "vram_allocation_mib": int((seq_len / 2048) *
                        {"int4": 1200, "int8": 1800, "fp16": 3000}[quant])
                }
            })

    # Balanced configurations (multi-model)
    for cuda_shots, yolo_batch in [(512, 1), (1024, 2)]:
        configs.append({
            "name": f"balanced_s{cuda_shots}_b{yolo_batch}",
            "workload": "balanced",
            "cuda_q": {"shots_per_iteration": cuda_shots, "max_qubits": 16,
                      "vram_allocation_mib": 150},
            "yolo11s": {"batch_size": yolo_batch, "input_size": 640,
                       "vram_allocation_mib": 1200}
        })

    return configs


def evaluate_configuration(config: Dict, optimizer: OrthogonalOptimizer
                          ) -> OperatingPoint:
    """Evaluate a single configuration."""
    model_metrics = {}
    total_vram = 0

    # Generate metrics for each enabled model
    if "cuda_q" in config:
        metrics = generate_mock_cuda_q_metrics(config["cuda_q"])
        model_metrics["cuda-q"] = metrics
        total_vram += metrics.vram_used_mib

    if "yolo11s" in config:
        metrics = generate_mock_yolo_metrics(config["yolo11s"])
        model_metrics["yolo11s"] = metrics
        total_vram += metrics.vram_used_mib

    if "qwen_1_5" in config:
        metrics = generate_mock_qwen_metrics(config["qwen_1_5"])
        model_metrics["qwen-1.5"] = metrics
        total_vram += metrics.vram_used_mib

    # Generate system state
    system_state = generate_mock_system_state(total_vram)

    # Evaluate operating point
    return optimizer.evaluate_operating_point(
        system_state=system_state,
        model_metrics=model_metrics,
        config_name=config["name"]
    )


# ==============================================================================
# Benchmark Suites
# ==============================================================================

def benchmark_workload_profile(workload: WorkloadType) -> Tuple[OrthogonalOptimizer, List[OperatingPoint]]:
    """Benchmark a specific workload profile."""
    print(f"\n{'='*80}")
    print(f"BENCHMARKING: {workload.value.upper()} WORKLOAD")
    print(f"{'='*80}")

    optimizer = OrthogonalOptimizer(workload_type=workload)
    configs = generate_test_configurations()

    # Filter configs relevant to this workload
    relevant_configs = [c for c in configs if c.get("workload") == workload.value]

    print(f"Testing {len(relevant_configs)} configurations...")

    operating_points = []
    for i, config in enumerate(relevant_configs, 1):
        op = evaluate_configuration(config, optimizer)
        operating_points.append(op)

        # Check constraints
        is_feasible, violations = optimizer.check_constraints(
            op.system_state, op.model_metrics
        )

        status = "✓ FEASIBLE" if is_feasible else "✗ INFEASIBLE"
        print(f"  [{i}/{len(relevant_configs)}] {config['name']:40s} "
              f"Score: {op.total_score:.4f} {status}")

        if violations:
            for v in violations:
                print(f"      - {v}")

    # Find Pareto frontier
    pareto = optimizer.find_pareto_frontier()
    print(f"\n✓ Found {len(pareto)} Pareto-optimal configurations")

    return optimizer, operating_points


def benchmark_all_workloads() -> Dict[WorkloadType, OrthogonalOptimizer]:
    """Run comprehensive benchmarks across all workload types."""
    results = {}

    for workload in [WorkloadType.SCIENTIFIC, WorkloadType.VISION,
                     WorkloadType.CONVERSATIONAL, WorkloadType.BALANCED]:
        optimizer, _ = benchmark_workload_profile(workload)
        results[workload] = optimizer

    return results


def benchmark_pareto_frontier_analysis(optimizer: OrthogonalOptimizer):
    """Detailed analysis of Pareto frontier."""
    print(f"\n{'='*80}")
    print("PARETO FRONTIER ANALYSIS")
    print(f"{'='*80}")

    pareto = optimizer.find_pareto_frontier()

    if not pareto:
        print("No Pareto-optimal points found")
        return

    print(f"\nTotal Pareto-Optimal Configurations: {len(pareto)}\n")

    # Analyze each dimension
    for dim in OptimizationDimension:
        scores = [op.objective_scores[dim] for op in pareto]
        print(f"{dim.value.upper().replace('_', ' ')}:")
        print(f"  Min:  {min(scores):.4f}")
        print(f"  Max:  {max(scores):.4f}")
        print(f"  Mean: {np.mean(scores):.4f}")
        print(f"  Std:  {np.std(scores):.4f}")

    print("\n" + "-" * 80)
    print("TOP 5 CONFIGURATIONS (by total score):")
    print("-" * 80)

    for i, op in enumerate(pareto[:5], 1):
        print(f"\n[{i}] {op.config_name}")
        print(f"    Total Score:      {op.total_score:.4f}")
        print(f"    VRAM:            {op.system_state.vram_used_mib} MiB "
              f"({op.system_state.vram_util_pct:.1f}%)")
        print(f"    Temperature:     {op.system_state.temp_celsius:.1f}°C")
        print(f"    Hamiltonian:     {op.system_state.hamiltonian:.3f}")
        print(f"    Objective Scores:")
        for dim, score in op.objective_scores.items():
            print(f"      {dim.value:25s} {score:.4f}")


def benchmark_trade_off_analysis(optimizer: OrthogonalOptimizer):
    """Analyze trade-offs between optimization dimensions."""
    print(f"\n{'='*80}")
    print("TRADE-OFF ANALYSIS")
    print(f"{'='*80}")

    pareto = optimizer.find_pareto_frontier()

    if len(pareto) < 2:
        print("Insufficient points for trade-off analysis")
        return

    # Find extreme points for each dimension
    extremes = {}
    for dim in OptimizationDimension:
        best = max(pareto, key=lambda op: op.objective_scores[dim])
        worst = min(pareto, key=lambda op: op.objective_scores[dim])
        extremes[dim] = (best, worst)

    print("\nEXTREME CONFIGURATIONS:")
    for dim, (best, worst) in extremes.items():
        print(f"\n{dim.value.upper().replace('_', ' ')}:")
        print(f"  Best:  {best.config_name:40s} (score: {best.objective_scores[dim]:.4f})")
        print(f"  Worst: {worst.config_name:40s} (score: {worst.objective_scores[dim]:.4f})")

    # Correlation analysis
    print("\n" + "-" * 80)
    print("DIMENSION CORRELATIONS:")
    print("-" * 80)

    dims = list(OptimizationDimension)
    for i, dim1 in enumerate(dims):
        for dim2 in dims[i+1:]:
            scores1 = [op.objective_scores[dim1] for op in pareto]
            scores2 = [op.objective_scores[dim2] for op in pareto]

            if len(scores1) > 1:
                corr = np.corrcoef(scores1, scores2)[0, 1]
                relationship = "positive" if corr > 0.3 else "negative" if corr < -0.3 else "weak"
                print(f"{dim1.value:25s} vs {dim2.value:25s}: {corr:+.3f} ({relationship})")


def benchmark_constraint_sensitivity(workload: WorkloadType):
    """Test sensitivity to constraint changes."""
    print(f"\n{'='*80}")
    print(f"CONSTRAINT SENSITIVITY: {workload.value.upper()}")
    print(f"{'='*80}")

    base_optimizer = OrthogonalOptimizer(workload_type=workload)

    # Test VRAM constraint variations
    vram_limits = [2800, 3000, 3200, 3400, 3600]

    print("\nVRAM Constraint Impact:")
    for vram_max in vram_limits:
        optimizer = OrthogonalOptimizer(
            workload_type=workload,
            constraints={**base_optimizer.constraints, "vram_max_mib": vram_max}
        )

        configs = generate_test_configurations()
        relevant = [c for c in configs if c.get("workload") == workload.value]

        feasible_count = 0
        for config in relevant[:10]:  # Sample 10 configs
            op = evaluate_configuration(config, optimizer)
            is_feasible, _ = optimizer.check_constraints(op.system_state, op.model_metrics)
            if is_feasible:
                feasible_count += 1

        print(f"  VRAM ≤ {vram_max} MiB: {feasible_count}/10 configurations feasible")


# ==============================================================================
# Main Benchmark Runner
# ==============================================================================

def run_comprehensive_benchmarks(output_dir: Path):
    """Run all benchmarks and save results."""
    output_dir.mkdir(parents=True, exist_ok=True)

    print("\n" + "="*80)
    print("ORTHOGONAL OPTIMIZATION BENCHMARK SUITE")
    print("="*80)
    print(f"Output directory: {output_dir}")
    print("="*80)

    start_time = time.time()

    # Benchmark 1: All workload profiles
    print("\n[1/5] Benchmarking workload profiles...")
    workload_results = benchmark_all_workloads()

    # Benchmark 2: Pareto frontier analysis for each workload
    print("\n[2/5] Analyzing Pareto frontiers...")
    for workload, optimizer in workload_results.items():
        benchmark_pareto_frontier_analysis(optimizer)

        # Save results
        output_file = output_dir / f"pareto_{workload.value}.json"
        optimizer.export_state(output_file)
        print(f"\n✓ Saved results to {output_file}")

    # Benchmark 3: Trade-off analysis
    print("\n[3/5] Analyzing trade-offs...")
    for workload, optimizer in workload_results.items():
        benchmark_trade_off_analysis(optimizer)

    # Benchmark 4: Constraint sensitivity
    print("\n[4/5] Testing constraint sensitivity...")
    for workload in [WorkloadType.SCIENTIFIC, WorkloadType.VISION]:
        benchmark_constraint_sensitivity(workload)

    # Benchmark 5: Generate reports
    print("\n[5/5] Generating reports...")
    for workload, optimizer in workload_results.items():
        report = generate_optimization_report(optimizer)
        report_file = output_dir / f"report_{workload.value}.txt"
        report_file.write_text(report)
        print(f"✓ Generated report: {report_file}")

    elapsed = time.time() - start_time

    print("\n" + "="*80)
    print(f"BENCHMARK COMPLETE ({elapsed:.1f}s)")
    print("="*80)

    # Summary
    print("\nSUMMARY:")
    for workload, optimizer in workload_results.items():
        pareto_count = len(optimizer.find_pareto_frontier())
        total_count = len(optimizer.history)
        print(f"  {workload.value:15s}: {pareto_count:3d}/{total_count:3d} Pareto-optimal")


def run_quick_benchmark():
    """Quick sanity check benchmark."""
    print("\nQUICK BENCHMARK (Balanced Workload)")
    print("="*80)

    optimizer = OrthogonalOptimizer(workload_type=WorkloadType.BALANCED)

    # Test a few configurations
    configs = [
        {
            "name": "light_load",
            "workload": "balanced",
            "cuda_q": {"shots_per_iteration": 512, "max_qubits": 12,
                      "vram_allocation_mib": 120}
        },
        {
            "name": "medium_load",
            "workload": "balanced",
            "yolo11s": {"batch_size": 2, "input_size": 640,
                       "vram_allocation_mib": 1200}
        },
        {
            "name": "heavy_load",
            "workload": "balanced",
            "qwen_1_5": {"quantization": "int4", "max_seq_length": 2048,
                        "vram_allocation_mib": 2400}
        }
    ]

    for config in configs:
        op = evaluate_configuration(config, optimizer)
        is_feasible, violations = optimizer.check_constraints(
            op.system_state, op.model_metrics
        )

        status = "✓ FEASIBLE" if is_feasible else "✗ INFEASIBLE"
        print(f"\n{config['name']:15s} {status}")
        print(f"  Score:       {op.total_score:.4f}")
        print(f"  VRAM:        {op.system_state.vram_used_mib} MiB")
        print(f"  Temperature: {op.system_state.temp_celsius:.1f}°C")
        print(f"  Hamiltonian: {op.system_state.hamiltonian:.3f}")

    print("\n" + "="*80)
    print("✓ Quick benchmark complete")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Orthogonal optimization benchmarks")
    parser.add_argument("--mode", choices=["quick", "full"], default="quick",
                       help="Benchmark mode (quick or full)")
    parser.add_argument("--output", type=Path, default=Path("./benchmark_results"),
                       help="Output directory for results")

    args = parser.parse_args()

    if args.mode == "quick":
        run_quick_benchmark()
    else:
        run_comprehensive_benchmarks(args.output)
