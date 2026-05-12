"""Example: Integrating Orthogonal Optimizer with Diamond Gateway

This example shows how to integrate the orthogonal optimizer with the
existing Diamond Gateway orchestration system.
"""

import sys
from pathlib import Path

# Add diamond-node to path
sys.path.insert(0, str(Path(__file__).parent))

from unified_inference.optimizer import (
    OrthogonalOptimizer,
    WorkloadType,
    SystemState,
    ModelMetrics,
    OptimizationDimension
)


def get_gpu_metrics_from_gateway() -> dict:
    """Mock function - replace with actual gateway metrics call."""
    return {
        "vram_used_mib": 1200,
        "vram_total_mib": 3972,
        "vram_util_pct": 30.2,
        "temp_celsius": 45.0,
        "hamiltonian": 3.5
    }


def example_1_basic_evaluation():
    """Example 1: Evaluate current operating point."""
    print("\n" + "="*80)
    print("EXAMPLE 1: Basic Operating Point Evaluation")
    print("="*80)

    # Create optimizer for scientific workload
    optimizer = OrthogonalOptimizer(workload_type=WorkloadType.SCIENTIFIC)

    # Get current system state
    gpu_metrics = get_gpu_metrics_from_gateway()
    system_state = SystemState(
        vram_used_mib=gpu_metrics["vram_used_mib"],
        vram_total_mib=gpu_metrics["vram_total_mib"],
        vram_util_pct=gpu_metrics["vram_util_pct"],
        temp_celsius=gpu_metrics["temp_celsius"],
        hamiltonian=gpu_metrics["hamiltonian"],
        active_models=["cuda-q"]
    )

    # Define current model metrics
    model_metrics = {
        "cuda-q": ModelMetrics(
            model_name="cuda-q",
            vram_used_mib=180,
            throughput_ops_per_sec=220.0,
            accuracy_score=0.0008,  # Energy gradient
            latency_p50_ms=450,
            latency_p95_ms=680,
            purity=0.96,
            effective_dimension=4.2,
            energy_gradient=0.0008
        )
    }

    # Evaluate operating point
    op = optimizer.evaluate_operating_point(
        system_state=system_state,
        model_metrics=model_metrics,
        config_name="current_cuda_q"
    )

    # Check constraints
    is_feasible, violations = optimizer.check_constraints(system_state, model_metrics)

    # Print results
    print(f"\nConfiguration: {op.config_name}")
    print(f"Total Score: {op.total_score:.4f}")
    print(f"Feasible: {'✓ YES' if is_feasible else '✗ NO'}")

    if violations:
        print("\nConstraint Violations:")
        for v in violations:
            print(f"  - {v}")

    print("\nObjective Scores:")
    for dim, score in op.objective_scores.items():
        print(f"  {dim.value:25s} {score:.4f}")

    print(f"\nSystem State:")
    print(f"  VRAM: {system_state.vram_used_mib} MiB ({system_state.vram_util_pct:.1f}%)")
    print(f"  Temperature: {system_state.temp_celsius:.1f}°C")
    print(f"  Hamiltonian: {system_state.hamiltonian:.3f}")

    return optimizer, op


def example_2_configuration_recommendation():
    """Example 2: Recommend best configuration from candidates."""
    print("\n" + "="*80)
    print("EXAMPLE 2: Configuration Recommendation")
    print("="*80)

    optimizer = OrthogonalOptimizer(workload_type=WorkloadType.BALANCED)

    # Current state
    gpu_metrics = get_gpu_metrics_from_gateway()
    system_state = SystemState(**gpu_metrics, active_models=[])

    # Define candidate configurations
    available_configs = [
        {
            "name": "cuda_q_high_accuracy",
            "predicted_metrics": {
                "cuda-q": {
                    "model_name": "cuda-q",
                    "vram_used_mib": 200,
                    "throughput_ops_per_sec": 180.0,
                    "accuracy_score": 0.0005,
                    "latency_p50_ms": 550,
                    "latency_p95_ms": 820,
                    "purity": 0.97,
                    "effective_dimension": 3.8,
                    "energy_gradient": 0.0005
                }
            }
        },
        {
            "name": "yolo_high_throughput",
            "predicted_metrics": {
                "yolo11s": {
                    "model_name": "yolo11s",
                    "vram_used_mib": 1400,
                    "throughput_ops_per_sec": 32.0,
                    "accuracy_score": 0.68,
                    "latency_p50_ms": 28,
                    "latency_p95_ms": 42,
                    "purity": None,
                    "effective_dimension": None,
                    "energy_gradient": None
                }
            }
        },
        {
            "name": "qwen_memory_efficient",
            "predicted_metrics": {
                "qwen-1.5": {
                    "model_name": "qwen-1.5",
                    "vram_used_mib": 1200,
                    "throughput_ops_per_sec": 22.0,
                    "accuracy_score": 5.2,  # Perplexity
                    "latency_p50_ms": 220,
                    "latency_p95_ms": 350,
                    "purity": None,
                    "effective_dimension": None,
                    "energy_gradient": None
                }
            }
        }
    ]

    # Get recommendation
    best_config, best_op = optimizer.recommend_configuration(
        current_state=system_state,
        available_configs=available_configs
    )

    print(f"\nRecommended Configuration: {best_config['name']}")
    print(f"Expected Score: {best_op.total_score:.4f}")
    print(f"\nObjective Breakdown:")
    for dim, score in best_op.objective_scores.items():
        print(f"  {dim.value:25s} {score:.4f}")

    # Show all candidates
    print("\n" + "-"*80)
    print("All Candidates:")
    print("-"*80)
    for config in available_configs:
        model_name = list(config["predicted_metrics"].keys())[0]
        metrics = ModelMetrics(**config["predicted_metrics"][model_name])
        op = optimizer.evaluate_operating_point(
            system_state=system_state,
            model_metrics={model_name: metrics},
            config_name=config["name"]
        )
        is_feasible, _ = optimizer.check_constraints(system_state, {model_name: metrics})
        status = "✓" if is_feasible else "✗"
        print(f"{status} {config['name']:30s} Score: {op.total_score:.4f}")

    return optimizer, best_config


def example_3_pareto_frontier():
    """Example 3: Find Pareto-optimal configurations."""
    print("\n" + "="*80)
    print("EXAMPLE 3: Pareto Frontier Analysis")
    print("="*80)

    optimizer = OrthogonalOptimizer(workload_type=WorkloadType.VISION)
    system_state = SystemState(**get_gpu_metrics_from_gateway(), active_models=[])

    # Test multiple YOLO configurations
    test_configs = [
        {"batch": 1, "input": 416, "vram": 920, "fps": 24.0, "map": 0.73},
        {"batch": 2, "input": 416, "vram": 1080, "fps": 26.5, "map": 0.72},
        {"batch": 4, "input": 416, "vram": 1280, "fps": 29.0, "map": 0.69},
        {"batch": 1, "input": 640, "vram": 1000, "fps": 22.0, "map": 0.76},
        {"batch": 2, "input": 640, "vram": 1200, "fps": 25.0, "map": 0.75},
        {"batch": 4, "input": 640, "vram": 1450, "fps": 28.5, "map": 0.72},
    ]

    print(f"\nEvaluating {len(test_configs)} YOLO configurations...")

    for i, config in enumerate(test_configs, 1):
        metrics = ModelMetrics(
            model_name="yolo11s",
            vram_used_mib=config["vram"],
            throughput_ops_per_sec=config["fps"],
            accuracy_score=config["map"],
            latency_p50_ms=1000.0 / config["fps"],
            latency_p95_ms=1200.0 / config["fps"],
            purity=None,
            effective_dimension=None,
            energy_gradient=None
        )

        op = optimizer.evaluate_operating_point(
            system_state=SystemState(
                vram_used_mib=config["vram"],
                vram_total_mib=3972,
                vram_util_pct=100.0 * config["vram"] / 3972,
                temp_celsius=29.0 + (config["vram"] / 3972) * 40.0,
                hamiltonian=(config["vram"] / 3972) * 10.0,
                active_models=["yolo11s"]
            ),
            model_metrics={"yolo11s": metrics},
            config_name=f"yolo_b{config['batch']}_i{config['input']}"
        )

        print(f"  [{i}] Batch={config['batch']}, Input={config['input']}: "
              f"Score={op.total_score:.4f}")

    # Find Pareto frontier
    pareto = optimizer.find_pareto_frontier()

    print(f"\n✓ Found {len(pareto)} Pareto-optimal configurations:")
    print("\n" + "-"*80)
    for i, op in enumerate(pareto, 1):
        print(f"[{i}] {op.config_name}")
        print(f"    Score: {op.total_score:.4f}")
        print(f"    VRAM Efficiency:     {op.objective_scores[OptimizationDimension.VRAM_EFFICIENCY]:.4f}")
        print(f"    Throughput:          {op.objective_scores[OptimizationDimension.COMPUTE_THROUGHPUT]:.4f}")
        print(f"    Accuracy:            {op.objective_scores[OptimizationDimension.MODEL_ACCURACY]:.4f}")
        print()

    return optimizer, pareto


def example_4_adaptive_weights():
    """Example 4: Adaptive weight tuning based on feedback."""
    print("\n" + "="*80)
    print("EXAMPLE 4: Adaptive Weight Tuning")
    print("="*80)

    optimizer = OrthogonalOptimizer(workload_type=WorkloadType.SCIENTIFIC)

    print(f"\nInitial Weights ({optimizer.workload_type.value}):")
    print(f"  VRAM Efficiency:      {optimizer.weights.vram_efficiency:.3f}")
    print(f"  Compute Throughput:   {optimizer.weights.compute_throughput:.3f}")
    print(f"  Model Accuracy:       {optimizer.weights.model_accuracy:.3f}")
    print(f"  Waveform Equilibrium: {optimizer.weights.waveform_equilibrium:.3f}")

    # Simulate feedback: need more throughput, less focus on accuracy
    feedback = {
        OptimizationDimension.COMPUTE_THROUGHPUT: 0.15,  # Increase
        OptimizationDimension.MODEL_ACCURACY: -0.10,     # Decrease
    }

    print("\nApplying feedback:")
    print(f"  Throughput: +0.15 (need more speed)")
    print(f"  Accuracy:   -0.10 (acceptable trade-off)")

    optimizer.adapt_weights(feedback, learning_rate=0.15)

    print(f"\nUpdated Weights:")
    print(f"  VRAM Efficiency:      {optimizer.weights.vram_efficiency:.3f}")
    print(f"  Compute Throughput:   {optimizer.weights.compute_throughput:.3f}")
    print(f"  Model Accuracy:       {optimizer.weights.model_accuracy:.3f}")
    print(f"  Waveform Equilibrium: {optimizer.weights.waveform_equilibrium:.3f}")

    return optimizer


def example_5_export_import():
    """Example 5: Export and import optimizer state."""
    print("\n" + "="*80)
    print("EXAMPLE 5: Export and Import State")
    print("="*80)

    # Create and populate optimizer
    optimizer = OrthogonalOptimizer(workload_type=WorkloadType.BALANCED)

    # Evaluate a few configs
    for i in range(3):
        system_state = SystemState(**get_gpu_metrics_from_gateway(), active_models=[])
        model_metrics = {
            "cuda-q": ModelMetrics(
                model_name="cuda-q",
                vram_used_mib=150 + i*50,
                throughput_ops_per_sec=200.0 - i*20,
                accuracy_score=0.001 * (i+1),
                latency_p50_ms=400 + i*50,
                latency_p95_ms=600 + i*75,
                purity=0.95 - i*0.02,
                effective_dimension=5.0 + i*2,
                energy_gradient=0.001 * (i+1)
            )
        }
        optimizer.evaluate_operating_point(system_state, model_metrics, f"config_{i+1}")

    # Export state
    export_path = Path("./optimizer_state_example.json")
    optimizer.export_state(export_path)

    print(f"\n✓ Exported optimizer state to {export_path}")
    print(f"  Total evaluations: {len(optimizer.history)}")
    print(f"  Pareto frontier: {len(optimizer.find_pareto_frontier())} configs")

    # Load state (demonstrate it works)
    loaded = OrthogonalOptimizer.load_state(export_path)
    print(f"\n✓ Loaded optimizer state from {export_path}")
    print(f"  Workload type: {loaded.workload_type.value}")
    print(f"  Constraints: {loaded.constraints}")

    # Clean up
    export_path.unlink()
    print(f"\n✓ Cleaned up example file")

    return optimizer


def main():
    """Run all examples."""
    print("\n" + "="*80)
    print("ORTHOGONAL OPTIMIZER INTEGRATION EXAMPLES")
    print("="*80)

    example_1_basic_evaluation()
    example_2_configuration_recommendation()
    example_3_pareto_frontier()
    example_4_adaptive_weights()
    example_5_export_import()

    print("\n" + "="*80)
    print("ALL EXAMPLES COMPLETE")
    print("="*80)
    print("\nNext Steps:")
    print("  1. Integrate optimizer into Diamond Gateway (/opt/diamond-gateway/gateway.py)")
    print("  2. Connect to live GPU metrics (nvidia-smi)")
    print("  3. Implement model swapping logic based on recommendations")
    print("  4. Set up monitoring dashboard with Pareto curves")
    print("  5. Configure OFFLOAD trigger integration")
    print("\nSee docs/ORTHOGONAL_OPTIMIZATION.md for detailed integration guide.")


if __name__ == "__main__":
    main()
