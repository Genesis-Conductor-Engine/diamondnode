"""Orthogonal Optimization Strategy for Multi-Model GPU Orchestration

Maximizes performance across four independent dimensions:
1. VRAM Efficiency (utilization while staying < 85%)
2. Compute Throughput (operations per second)
3. Model Accuracy (precision metrics)
4. Waveform Equilibrium (eigenspace stability)

Mathematical Framework:
=======================
Objective function:
    F(x) = w₁·f_vram(x) + w₂·f_throughput(x) + w₃·f_accuracy(x) + w₄·f_equilibrium(x)

where:
    f_vram(x) = (VRAM_used / VRAM_total) * sigmoid(VRAM_target - VRAM_used)
    f_throughput(x) = (ops/sec) / (max_ops/sec)
    f_accuracy(x) = model_specific_metric / baseline
    f_equilibrium(x) = purity * (1 - energy_gradient)

Constraints:
    - VRAM_used < 3400 MiB (85% of 4 GB)
    - T_gpu < 80°C
    - latency_p95 < threshold
    - H_resource ≤ 8.5

Solution: Multi-objective Pareto frontier analysis with gradient-free optimization
"""

from __future__ import annotations

import json
import math
import time
from dataclasses import dataclass, asdict, field
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Callable

import numpy as np


# ==================================================================================
# Configuration and Types
# ==================================================================================

class WorkloadType(Enum):
    """Workload profile types with different optimization priorities."""
    SCIENTIFIC = "scientific"      # CUDA-Q priority, maximize accuracy
    VISION = "vision"              # YOLO11 priority, maximize throughput
    CONVERSATIONAL = "conversational"  # Qwen priority, balanced
    BALANCED = "balanced"          # Equal weights across all dimensions


class OptimizationDimension(Enum):
    """Four orthogonal optimization dimensions."""
    VRAM_EFFICIENCY = "vram_efficiency"
    COMPUTE_THROUGHPUT = "compute_throughput"
    MODEL_ACCURACY = "model_accuracy"
    WAVEFORM_EQUILIBRIUM = "waveform_equilibrium"


@dataclass
class ModelMetrics:
    """Runtime metrics for a single model."""
    model_name: str
    vram_used_mib: int
    throughput_ops_per_sec: float
    accuracy_score: float  # Model-specific: mAP, energy_convergence, perplexity
    latency_p50_ms: float
    latency_p95_ms: float
    timestamp: float = field(default_factory=time.time)
    
    # Waveform equilibrium metrics (for CUDA-Q)
    purity: Optional[float] = None
    effective_dimension: Optional[float] = None
    energy_gradient: Optional[float] = None


@dataclass
class SystemState:
    """Current system resource state."""
    vram_used_mib: int
    vram_total_mib: int
    vram_util_pct: float
    temp_celsius: float
    hamiltonian: float  # H_resource from Ising model
    active_models: List[str]
    timestamp: float = field(default_factory=time.time)


@dataclass
class OptimizationWeights:
    """Weight vector for multi-objective optimization."""
    vram_efficiency: float
    compute_throughput: float
    model_accuracy: float
    waveform_equilibrium: float
    
    def normalize(self) -> OptimizationWeights:
        """Normalize weights to sum to 1.0."""
        total = (self.vram_efficiency + self.compute_throughput + 
                self.model_accuracy + self.waveform_equilibrium)
        if total == 0:
            return OptimizationWeights(0.25, 0.25, 0.25, 0.25)
        return OptimizationWeights(
            self.vram_efficiency / total,
            self.compute_throughput / total,
            self.model_accuracy / total,
            self.waveform_equilibrium / total
        )
    
    @staticmethod
    def from_workload(workload: WorkloadType) -> OptimizationWeights:
        """Create weight vector from workload profile."""
        profiles = {
            WorkloadType.SCIENTIFIC: OptimizationWeights(
                vram_efficiency=0.15,
                compute_throughput=0.25,
                model_accuracy=0.45,  # Prioritize accuracy
                waveform_equilibrium=0.15
            ),
            WorkloadType.VISION: OptimizationWeights(
                vram_efficiency=0.20,
                compute_throughput=0.50,  # Prioritize FPS
                model_accuracy=0.20,
                waveform_equilibrium=0.10
            ),
            WorkloadType.CONVERSATIONAL: OptimizationWeights(
                vram_efficiency=0.30,  # Memory efficiency for LLM
                compute_throughput=0.25,
                model_accuracy=0.30,
                waveform_equilibrium=0.15
            ),
            WorkloadType.BALANCED: OptimizationWeights(
                vram_efficiency=0.25,
                compute_throughput=0.25,
                model_accuracy=0.25,
                waveform_equilibrium=0.25
            )
        }
        return profiles[workload].normalize()


@dataclass
class OperatingPoint:
    """A point in the multi-dimensional optimization space."""
    config_name: str
    system_state: SystemState
    model_metrics: Dict[str, ModelMetrics]
    objective_scores: Dict[OptimizationDimension, float]
    total_score: float
    is_pareto_optimal: bool = False
    
    def as_dict(self) -> dict:
        return {
            "config_name": self.config_name,
            "system_state": asdict(self.system_state),
            "model_metrics": {k: asdict(v) for k, v in self.model_metrics.items()},
            "objective_scores": {k.value: v for k, v in self.objective_scores.items()},
            "total_score": self.total_score,
            "is_pareto_optimal": self.is_pareto_optimal
        }


# ==================================================================================
# Objective Functions
# ==================================================================================

class ObjectiveFunctions:
    """Objective functions for each optimization dimension."""
    
    # Baselines for normalization (GTX 1650)
    VRAM_TARGET_MIB = 3400  # 85% of 4 GB
    MAX_THROUGHPUT_CUDA_Q = 250.0  # iterations/sec
    MAX_THROUGHPUT_YOLO = 30.0  # FPS
    MAX_THROUGHPUT_QWEN = 20.0  # tokens/sec
    
    BASELINE_ACCURACY_CUDA_Q = 0.001  # Energy gradient threshold
    BASELINE_ACCURACY_YOLO = 0.75  # mAP
    BASELINE_ACCURACY_QWEN = 5.0  # Perplexity (lower is better, invert)
    
    PURITY_TARGET = 0.95
    EFFECTIVE_DIM_TARGET = 5.0
    
    @staticmethod
    def vram_efficiency(vram_used_mib: int, vram_total_mib: int) -> float:
        """Score VRAM efficiency: high utilization but below threshold.
        
        f_vram(x) = (used/total) * sigmoid(2*(target - used)/target)
        
        Penalizes both underutilization and over-utilization.
        Peak at ~75-80% utilization.
        """
        util_ratio = vram_used_mib / vram_total_mib
        target = ObjectiveFunctions.VRAM_TARGET_MIB
        
        # Sigmoid penalty for approaching target
        distance_to_target = (target - vram_used_mib) / target
        sigmoid_factor = 1.0 / (1.0 + math.exp(-10.0 * distance_to_target))
        
        # Combine utilization with safety margin
        score = util_ratio * sigmoid_factor
        return max(0.0, min(1.0, score))
    
    @staticmethod
    def compute_throughput(model_name: str, ops_per_sec: float) -> float:
        """Score compute throughput normalized by model baseline.
        
        f_throughput(x) = (actual_ops/sec) / (baseline_ops/sec)
        """
        baselines = {
            "cuda-q": ObjectiveFunctions.MAX_THROUGHPUT_CUDA_Q,
            "yolo11s": ObjectiveFunctions.MAX_THROUGHPUT_YOLO,
            "qwen-1.5": ObjectiveFunctions.MAX_THROUGHPUT_QWEN
        }
        baseline = baselines.get(model_name.lower(), 1.0)
        score = ops_per_sec / baseline
        return max(0.0, min(1.0, score))
    
    @staticmethod
    def model_accuracy(model_name: str, accuracy_score: float) -> float:
        """Score model accuracy normalized by baseline.
        
        Model-specific metrics:
        - CUDA-Q: convergence = 1 / (1 + energy_gradient)
        - YOLO11: mAP / baseline_mAP
        - Qwen: baseline_perplexity / actual_perplexity
        """
        if "cuda" in model_name.lower():
            # Energy gradient: lower is better, invert
            convergence = 1.0 / (1.0 + accuracy_score)
            baseline = 1.0 / (1.0 + ObjectiveFunctions.BASELINE_ACCURACY_CUDA_Q)
            score = convergence / baseline
        elif "yolo" in model_name.lower():
            score = accuracy_score / ObjectiveFunctions.BASELINE_ACCURACY_YOLO
        elif "qwen" in model_name.lower():
            # Perplexity: lower is better, invert
            score = ObjectiveFunctions.BASELINE_ACCURACY_QWEN / accuracy_score
        else:
            score = accuracy_score
        
        return max(0.0, min(1.5, score))  # Allow exceeding baseline
    
    @staticmethod
    def waveform_equilibrium(purity: float, effective_dim: float, 
                            energy_grad: float) -> float:
        """Score waveform equilibrium (CUDA-Q specific).
        
        f_equilibrium(x) = purity * (1 / effective_dim) * (1 - energy_grad)
        
        High purity + low dimensionality + low gradient = equilibrium
        """
        if purity is None or effective_dim is None or energy_grad is None:
            return 0.0
        
        purity_score = purity / ObjectiveFunctions.PURITY_TARGET
        dim_score = ObjectiveFunctions.EFFECTIVE_DIM_TARGET / max(1.0, effective_dim)
        grad_score = 1.0 - min(1.0, energy_grad / 0.1)
        
        score = purity_score * dim_score * grad_score
        return max(0.0, min(1.0, score))


# ==================================================================================
# Orthogonal Optimizer
# ==================================================================================

class OrthogonalOptimizer:
    """Multi-objective optimizer for GPU orchestration."""
    
    def __init__(self, 
                 workload_type: WorkloadType = WorkloadType.BALANCED,
                 constraints: Optional[Dict[str, float]] = None):
        """Initialize optimizer with workload profile and constraints.
        
        Args:
            workload_type: Optimization profile
            constraints: Hard constraints (vram_max_mib, temp_max_c, hamiltonian_max)
        """
        self.workload_type = workload_type
        self.weights = OptimizationWeights.from_workload(workload_type)
        
        self.constraints = constraints or {
            "vram_max_mib": 3400,
            "temp_max_c": 80.0,
            "hamiltonian_max": 8.5,
            "latency_p95_max_ms": 1000.0
        }
        
        self.objectives = ObjectiveFunctions()
        self.history: List[OperatingPoint] = []
    
    def evaluate_operating_point(self,
                                 system_state: SystemState,
                                 model_metrics: Dict[str, ModelMetrics],
                                 config_name: str = "default") -> OperatingPoint:
        """Evaluate a single operating point across all dimensions.
        
        Returns:
            OperatingPoint with objective scores and total weighted score
        """
        scores = {}
        
        # Dimension 1: VRAM Efficiency
        scores[OptimizationDimension.VRAM_EFFICIENCY] = self.objectives.vram_efficiency(
            system_state.vram_used_mib,
            system_state.vram_total_mib
        )
        
        # Dimension 2: Compute Throughput (aggregate across models)
        throughput_scores = []
        for model_name, metrics in model_metrics.items():
            throughput_scores.append(
                self.objectives.compute_throughput(model_name, metrics.throughput_ops_per_sec)
            )
        scores[OptimizationDimension.COMPUTE_THROUGHPUT] = (
            np.mean(throughput_scores) if throughput_scores else 0.0
        )
        
        # Dimension 3: Model Accuracy (aggregate)
        accuracy_scores = []
        for model_name, metrics in model_metrics.items():
            accuracy_scores.append(
                self.objectives.model_accuracy(model_name, metrics.accuracy_score)
            )
        scores[OptimizationDimension.MODEL_ACCURACY] = (
            np.mean(accuracy_scores) if accuracy_scores else 0.0
        )
        
        # Dimension 4: Waveform Equilibrium (CUDA-Q only)
        equilibrium_score = 0.0
        for model_name, metrics in model_metrics.items():
            if "cuda" in model_name.lower() and metrics.purity is not None:
                equilibrium_score = self.objectives.waveform_equilibrium(
                    metrics.purity,
                    metrics.effective_dimension or 10.0,
                    metrics.energy_gradient or 1.0
                )
                break
        scores[OptimizationDimension.WAVEFORM_EQUILIBRIUM] = equilibrium_score
        
        # Compute weighted total
        total_score = (
            self.weights.vram_efficiency * scores[OptimizationDimension.VRAM_EFFICIENCY] +
            self.weights.compute_throughput * scores[OptimizationDimension.COMPUTE_THROUGHPUT] +
            self.weights.model_accuracy * scores[OptimizationDimension.MODEL_ACCURACY] +
            self.weights.waveform_equilibrium * scores[OptimizationDimension.WAVEFORM_EQUILIBRIUM]
        )
        
        op = OperatingPoint(
            config_name=config_name,
            system_state=system_state,
            model_metrics=model_metrics,
            objective_scores=scores,
            total_score=total_score
        )
        
        self.history.append(op)
        return op
    
    def check_constraints(self, system_state: SystemState,
                         model_metrics: Dict[str, ModelMetrics]) -> Tuple[bool, List[str]]:
        """Check hard constraints. Returns (is_feasible, violations)."""
        violations = []
        
        if system_state.vram_used_mib > self.constraints["vram_max_mib"]:
            violations.append(
                f"VRAM: {system_state.vram_used_mib} > {self.constraints['vram_max_mib']} MiB"
            )
        
        if system_state.temp_celsius > self.constraints["temp_max_c"]:
            violations.append(
                f"Temperature: {system_state.temp_celsius} > {self.constraints['temp_max_c']}°C"
            )
        
        if system_state.hamiltonian > self.constraints["hamiltonian_max"]:
            violations.append(
                f"Hamiltonian: {system_state.hamiltonian:.2f} > {self.constraints['hamiltonian_max']}"
            )
        
        for model_name, metrics in model_metrics.items():
            if metrics.latency_p95_ms > self.constraints["latency_p95_max_ms"]:
                violations.append(
                    f"{model_name} latency P95: {metrics.latency_p95_ms} > "
                    f"{self.constraints['latency_p95_max_ms']} ms"
                )
        
        return len(violations) == 0, violations
    
    def find_pareto_frontier(self,
                            operating_points: Optional[List[OperatingPoint]] = None
                           ) -> List[OperatingPoint]:
        """Find Pareto-optimal operating points (non-dominated solutions).
        
        A point P is Pareto-optimal if no other point Q exists such that:
            Q is better in at least one objective AND
            Q is not worse in any objective
        
        Args:
            operating_points: List of points to analyze (defaults to self.history)
        
        Returns:
            List of Pareto-optimal points
        """
        points = operating_points if operating_points else self.history
        if not points:
            return []
        
        pareto_frontier = []
        
        for i, point_p in enumerate(points):
            is_dominated = False
            
            for j, point_q in enumerate(points):
                if i == j:
                    continue
                
                # Check if Q dominates P
                q_scores = point_q.objective_scores
                p_scores = point_p.objective_scores
                
                better_in_at_least_one = False
                worse_in_any = False
                
                for dim in OptimizationDimension:
                    if q_scores[dim] > p_scores[dim]:
                        better_in_at_least_one = True
                    elif q_scores[dim] < p_scores[dim]:
                        worse_in_any = True
                
                if better_in_at_least_one and not worse_in_any:
                    is_dominated = True
                    break
            
            if not is_dominated:
                point_p.is_pareto_optimal = True
                pareto_frontier.append(point_p)
        
        return sorted(pareto_frontier, key=lambda p: p.total_score, reverse=True)
    
    def recommend_configuration(self,
                               current_state: SystemState,
                               available_configs: List[Dict[str, Any]]
                              ) -> Tuple[Dict[str, Any], OperatingPoint]:
        """Recommend best configuration for current state.
        
        Args:
            current_state: Current system state
            available_configs: List of configuration dicts with predicted metrics
        
        Returns:
            (best_config, predicted_operating_point)
        """
        candidates = []
        
        for config in available_configs:
            # Extract metrics from config prediction
            model_metrics = {}
            for model_name, metrics_dict in config.get("predicted_metrics", {}).items():
                model_metrics[model_name] = ModelMetrics(**metrics_dict)
            
            # Evaluate operating point
            op = self.evaluate_operating_point(
                system_state=current_state,
                model_metrics=model_metrics,
                config_name=config.get("name", "unknown")
            )
            
            # Check constraints
            is_feasible, violations = self.check_constraints(current_state, model_metrics)
            if is_feasible:
                candidates.append((config, op))
        
        if not candidates:
            raise ValueError("No feasible configurations found")
        
        # Return highest scoring feasible config
        best_config, best_op = max(candidates, key=lambda x: x[1].total_score)
        return best_config, best_op
    
    def adapt_weights(self, feedback: Dict[OptimizationDimension, float],
                     learning_rate: float = 0.1):
        """Adapt optimization weights based on feedback.
        
        Online learning: shift weights toward dimensions that need improvement.
        
        Args:
            feedback: Dict of dimension -> desired_improvement (0.0 to 1.0)
            learning_rate: Step size for weight update
        """
        for dim, improvement in feedback.items():
            current_weight = getattr(self.weights, dim.value)
            new_weight = current_weight + learning_rate * improvement
            setattr(self.weights, dim.value, new_weight)
        
        # Renormalize
        self.weights = self.weights.normalize()
    
    def export_state(self, filepath: Path):
        """Export optimizer state and history to JSON."""
        state = {
            "workload_type": self.workload_type.value,
            "weights": asdict(self.weights),
            "constraints": self.constraints,
            "history": [op.as_dict() for op in self.history],
            "pareto_frontier": [
                op.as_dict() for op in self.find_pareto_frontier()
            ]
        }
        
        filepath.write_text(json.dumps(state, indent=2))
    
    @staticmethod
    def load_state(filepath: Path) -> OrthogonalOptimizer:
        """Load optimizer state from JSON."""
        state = json.loads(filepath.read_text())
        
        optimizer = OrthogonalOptimizer(
            workload_type=WorkloadType(state["workload_type"]),
            constraints=state["constraints"]
        )
        optimizer.weights = OptimizationWeights(**state["weights"])
        
        return optimizer


# ==================================================================================
# Utility Functions
# ==================================================================================

def plot_pareto_frontier_2d(pareto_points: List[OperatingPoint],
                           dim_x: OptimizationDimension,
                           dim_y: OptimizationDimension,
                           output_path: Optional[Path] = None):
    """Plot 2D projection of Pareto frontier (requires matplotlib).
    
    Args:
        pareto_points: Pareto-optimal operating points
        dim_x: Dimension for X axis
        dim_y: Dimension for Y axis
        output_path: Save plot to file (optional)
    """
    try:
        import matplotlib.pyplot as plt
        
        x_vals = [p.objective_scores[dim_x] for p in pareto_points]
        y_vals = [p.objective_scores[dim_y] for p in pareto_points]
        labels = [p.config_name for p in pareto_points]
        
        plt.figure(figsize=(10, 6))
        plt.scatter(x_vals, y_vals, s=100, c='red', alpha=0.6, edgecolors='black')
        
        for i, label in enumerate(labels):
            plt.annotate(label, (x_vals[i], y_vals[i]), fontsize=8)
        
        plt.xlabel(dim_x.value.replace('_', ' ').title())
        plt.ylabel(dim_y.value.replace('_', ' ').title())
        plt.title('Pareto Frontier: Trade-off Analysis')
        plt.grid(True, alpha=0.3)
        
        if output_path:
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
        else:
            plt.show()
        
        plt.close()
    except ImportError:
        print("Matplotlib not available for plotting")


def generate_optimization_report(optimizer: OrthogonalOptimizer) -> str:
    """Generate human-readable optimization report."""
    pareto = optimizer.find_pareto_frontier()
    
    report = [
        "=" * 80,
        "ORTHOGONAL OPTIMIZATION REPORT",
        "=" * 80,
        f"Workload Type: {optimizer.workload_type.value}",
        f"Total Operating Points Evaluated: {len(optimizer.history)}",
        f"Pareto-Optimal Configurations: {len(pareto)}",
        "",
        "Optimization Weights:",
        f"  VRAM Efficiency:       {optimizer.weights.vram_efficiency:.3f}",
        f"  Compute Throughput:    {optimizer.weights.compute_throughput:.3f}",
        f"  Model Accuracy:        {optimizer.weights.model_accuracy:.3f}",
        f"  Waveform Equilibrium:  {optimizer.weights.waveform_equilibrium:.3f}",
        "",
        "=" * 80,
        "PARETO FRONTIER",
        "=" * 80,
    ]
    
    for i, point in enumerate(pareto, 1):
        report.append(f"\n[{i}] {point.config_name} (Score: {point.total_score:.4f})")
        report.append(f"    VRAM: {point.system_state.vram_used_mib} MiB "
                     f"({point.system_state.vram_util_pct:.1f}%)")
        report.append(f"    Temp: {point.system_state.temp_celsius:.1f}°C")
        report.append(f"    Hamiltonian: {point.system_state.hamiltonian:.3f}")
        report.append("    Objective Scores:")
        for dim, score in point.objective_scores.items():
            report.append(f"      {dim.value:25s} {score:.4f}")
    
    report.append("\n" + "=" * 80)
    return "\n".join(report)
