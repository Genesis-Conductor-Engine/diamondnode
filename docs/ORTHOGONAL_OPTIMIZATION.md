# Orthogonal Optimization Strategy

**Multi-Objective GPU Orchestration for Diamond Node**

---

## Overview

The Orthogonal Optimization System maximizes performance across **four independent dimensions** simultaneously:

1. **VRAM Efficiency** — High utilization while staying below 85% threshold
2. **Compute Throughput** — Operations per second (model-specific)
3. **Model Accuracy** — Precision metrics (convergence, mAP, perplexity)
4. **Waveform Equilibrium** — Eigenspace stability for quantum optimization

This multi-objective approach enables **Pareto-optimal** configurations that balance competing trade-offs for different workload profiles.

---

## Mathematical Framework

### Objective Function

The system optimizes a weighted sum of normalized objective functions:

```
F(x) = w₁·f_vram(x) + w₂·f_throughput(x) + w₃·f_accuracy(x) + w₄·f_equilibrium(x)

where:
    Σ wᵢ = 1.0  (normalized weights)
    0 ≤ fᵢ(x) ≤ 1.0  (normalized scores)
```

### Individual Objective Functions

#### 1. VRAM Efficiency

**Goal:** Maximize utilization while maintaining safety margin.

```
f_vram(x) = (VRAM_used / VRAM_total) × sigmoid(2 × (target - used) / target)

where:
    target = 3400 MiB (85% of 4 GB)
    sigmoid(z) = 1 / (1 + e^(-10z))
```

**Rationale:** Penalizes both underutilization (wasted capacity) and overutilization (risk of OOM). Peak score at ~75-80% utilization.

#### 2. Compute Throughput

**Goal:** Maximize operations per second normalized by model baseline.

```
f_throughput(x) = (actual_ops/sec) / (baseline_ops/sec)

Baselines (GTX 1650):
    CUDA-Q:   250 iterations/sec (16-qubit QAOA)
    YOLO11s:  30 FPS (640×640 input)
    Qwen 1.5: 20 tokens/sec (2048 context)
```

**Rationale:** Model-agnostic scoring allows comparing heterogeneous workloads.

#### 3. Model Accuracy

**Goal:** Maximize precision metrics (model-specific).

```
CUDA-Q:   f_accuracy = 1 / (1 + energy_gradient)
YOLO11s:  f_accuracy = mAP / baseline_mAP
Qwen 1.5: f_accuracy = baseline_perplexity / actual_perplexity
```

**Rationale:** Different models optimize different metrics. Normalization enables cross-model comparison.

#### 4. Waveform Equilibrium (CUDA-Q specific)

**Goal:** Maximize eigenspace stability for quantum convergence.

```
f_equilibrium(x) = (purity / purity_target) ×
                   (effective_dim_target / effective_dim) ×
                   (1 - energy_gradient / threshold)

where:
    purity = Σ|αₖ|⁴  (state concentration in eigenspace)
    effective_dim = 1/Σ|αₖ|⁴  (number of significant eigenvectors)
    energy_gradient = |∇E|  (convergence indicator)
```

**Rationale:** High purity + low dimensionality + low gradient = equilibrium. Non-CUDA-Q models score 0.

---

## Constraints

Hard constraints that must be satisfied:

1. **VRAM Limit:** `VRAM_used ≤ 3400 MiB` (85% of 4 GB)
2. **Temperature Limit:** `T_gpu ≤ 80°C` (thermal safety)
3. **Hamiltonian Threshold:** `H_resource ≤ 8.5` (OFFLOAD trigger)
4. **Latency Limit:** `latency_p95 ≤ threshold` (QoS requirement)

**Ising Hamiltonian for Resource State:**

```
H_resource(s) = (VRAM_used / VRAM_total) × 10 + 0.3 × (T_gpu / 89.6)

Critical region: H > 8.5 triggers OFFLOAD to Notion
```

---

## Workload Profiles

### 1. Scientific (CUDA-Q Priority)

**Use Case:** Quantum optimization, QAOA, mycelial QUBO solving

**Optimization Weights:**
- VRAM Efficiency: 15%
- Compute Throughput: 25%
- Model Accuracy: **45%** ← Highest priority
- Waveform Equilibrium: 15%

**Typical Configuration:**
```yaml
CUDA-Q:
  VRAM: 180 MiB
  Throughput: 220 iter/sec
  Energy Gradient: 0.0008
  Purity: 0.96
  Effective Dimension: 4.2
  Latency P95: 680 ms
```

**Trade-offs:**
- Lower throughput acceptable
- Prioritizes convergence quality
- Early stopping at equilibrium

**Recommended:** High shot count (1024+), 16 qubits, 3 QAOA layers

---

### 2. Vision (YOLO11 Priority)

**Use Case:** Real-time object detection, video processing, surveillance

**Optimization Weights:**
- VRAM Efficiency: 20%
- Compute Throughput: **50%** ← Highest priority
- Model Accuracy: 20%
- Waveform Equilibrium: 10%

**Typical Configuration:**
```yaml
YOLO11s:
  VRAM: 1250 MiB
  Throughput: 28.5 FPS
  mAP: 0.72
  Latency P50: 32 ms
  Latency P95: 48 ms
```

**Trade-offs:**
- Lower precision acceptable (0.25 conf threshold)
- Batch size 4 for throughput
- FP16 quantization for speed

**Recommended:** 640×640 input, half precision, batch size 2-4

---

### 3. Conversational (Qwen Priority)

**Use Case:** Chat applications, text generation, LLM inference

**Optimization Weights:**
- VRAM Efficiency: **30%** ← Highest priority (memory-hungry)
- Compute Throughput: 25%
- Model Accuracy: 30%
- Waveform Equilibrium: 15%

**Typical Configuration:**
```yaml
Qwen 1.5:
  VRAM: 2650 MiB
  Throughput: 18.5 tokens/sec
  Perplexity: 4.2
  Latency P50: 280 ms
  Latency P95: 420 ms
  Quantization: INT4
```

**Trade-offs:**
- INT4 quantization for memory efficiency
- Context length 2048 tokens
- KV cache in FP16

**Recommended:** INT4/INT8 quantization, 1024-2048 context, Flash Attention

---

### 4. Balanced Multi-Model

**Use Case:** Mixed workloads, multi-tenant scenarios, exploration

**Optimization Weights:**
- VRAM Efficiency: 25%
- Compute Throughput: 25%
- Model Accuracy: 25%
- Waveform Equilibrium: 25%

**Typical Configuration:**
```yaml
Dynamic Scheduling:
  CUDA-Q: 140 MiB (priority 1)
  YOLO11s: 1180 MiB (priority 2)
  Qwen 1.5: 1950 MiB (priority 3)
  Total: 3270 MiB
  H_resource: 6.8
```

**Trade-offs:**
- Priority-based preemption (CUDA-Q > YOLO > Qwen)
- Idle timeout-based swapping
- Adaptive throughput

**Recommended:** Model swapping with 30-120 sec idle timeouts

---

## Pareto Frontier Analysis

### What is a Pareto Frontier?

A configuration is **Pareto-optimal** if no other configuration is strictly better in at least one objective without being worse in any other.

**Example:**

```
Config A: VRAM=0.8, Throughput=0.9, Accuracy=0.7, Equilibrium=0.6
Config B: VRAM=0.7, Throughput=0.9, Accuracy=0.8, Equilibrium=0.6

B dominates A (higher accuracy, equal/better in others)
→ A is NOT Pareto-optimal
→ B is Pareto-optimal (no config dominates B)
```

### Interpreting Pareto Curves

**2D Projections:**

1. **VRAM vs Throughput:**
   - Positive correlation (more VRAM → more batching → higher throughput)
   - Pareto frontier shows optimal VRAM allocation for target throughput

2. **Throughput vs Accuracy:**
   - Negative correlation (speed vs precision trade-off)
   - Pareto frontier shows best accuracy achievable at each throughput level

3. **Accuracy vs Equilibrium:**
   - Weak correlation (mostly independent for CUDA-Q)
   - Pareto frontier shows configurations excelling in both

**Finding Optimal Operating Point:**

1. Identify your priority (weights)
2. Find Pareto-optimal configs
3. Select highest-scoring config by weighted objective

---

## Implementation Guide

### 1. Basic Usage

```python
from unified_inference.optimizer import (
    OrthogonalOptimizer,
    WorkloadType,
    SystemState,
    ModelMetrics
)

# Create optimizer for scientific workload
optimizer = OrthogonalOptimizer(
    workload_type=WorkloadType.SCIENTIFIC,
    constraints={
        "vram_max_mib": 3400,
        "temp_max_c": 80.0,
        "hamiltonian_max": 8.5,
        "latency_p95_max_ms": 1000
    }
)

# Evaluate current operating point
system_state = SystemState(
    vram_used_mib=1800,
    vram_total_mib=3972,
    vram_util_pct=45.3,
    temp_celsius=52.0,
    hamiltonian=5.2,
    active_models=["cuda-q"]
)

model_metrics = {
    "cuda-q": ModelMetrics(
        model_name="cuda-q",
        vram_used_mib=180,
        throughput_ops_per_sec=220.0,
        accuracy_score=0.0008,
        latency_p50_ms=450,
        latency_p95_ms=680,
        purity=0.96,
        effective_dimension=4.2,
        energy_gradient=0.0008
    )
}

operating_point = optimizer.evaluate_operating_point(
    system_state=system_state,
    model_metrics=model_metrics,
    config_name="cuda_q_1024_shots"
)

print(f"Total Score: {operating_point.total_score:.4f}")
print(f"VRAM Efficiency: {operating_point.objective_scores[OptimizationDimension.VRAM_EFFICIENCY]:.4f}")
```

### 2. Configuration Recommendation

```python
# Define available configurations with predicted metrics
available_configs = [
    {
        "name": "low_vram_config",
        "predicted_metrics": {
            "cuda-q": {
                "model_name": "cuda-q",
                "vram_used_mib": 150,
                "throughput_ops_per_sec": 180.0,
                "accuracy_score": 0.003,
                # ... other metrics
            }
        }
    },
    # ... more configs
]

# Get recommendation
best_config, best_op = optimizer.recommend_configuration(
    current_state=system_state,
    available_configs=available_configs
)

print(f"Recommended: {best_config['name']}")
print(f"Expected Score: {best_op.total_score:.4f}")
```

### 3. Adaptive Weight Tuning

```python
# Provide feedback to shift weights
feedback = {
    OptimizationDimension.MODEL_ACCURACY: 0.2,  # Need more accuracy
    OptimizationDimension.COMPUTE_THROUGHPUT: -0.1  # Throughput too high
}

optimizer.adapt_weights(feedback, learning_rate=0.1)

# Weights automatically renormalized
print(optimizer.weights)
```

### 4. Pareto Frontier Analysis

```python
# Evaluate multiple configs
for config in available_configs:
    op = optimizer.evaluate_operating_point(...)

# Find Pareto frontier
pareto_frontier = optimizer.find_pareto_frontier()

for op in pareto_frontier:
    print(f"{op.config_name}: {op.total_score:.4f}")
```

### 5. Export and Reporting

```python
from pathlib import Path
from unified_inference.optimizer import generate_optimization_report

# Export state
optimizer.export_state(Path("./optimizer_state.json"))

# Generate report
report = generate_optimization_report(optimizer)
print(report)
```

---

## Benchmarking

### Quick Benchmark

```bash
cd ~/diamond-node/benchmarks
python orthogonal_test.py --mode quick
```

Output:
```
QUICK BENCHMARK (Balanced Workload)
================================================================================
light_load      ✓ FEASIBLE
  Score:       0.6523
  VRAM:        120 MiB
  Temperature: 30.4°C
  Hamiltonian: 0.40

medium_load     ✓ FEASIBLE
  Score:       0.7891
  VRAM:        1200 MiB
  Temperature: 43.6°C
  Hamiltonian: 3.17
```

### Full Benchmark Suite

```bash
python orthogonal_test.py --mode full --output ./benchmark_results
```

Generates:
- `pareto_scientific.json` — Pareto frontier for scientific workload
- `pareto_vision.json` — Pareto frontier for vision workload
- `pareto_conversational.json` — Pareto frontier for conversational workload
- `pareto_balanced.json` — Pareto frontier for balanced workload
- `report_*.txt` — Human-readable reports

**Benchmark Results Summary:**
- ~50 configurations tested per workload
- ~10-15 Pareto-optimal configs found
- Correlation analysis between dimensions
- Constraint sensitivity testing

---

## Trade-off Analysis

### VRAM vs Throughput

**Positive Correlation** (r ≈ +0.65)

- More VRAM → larger batch sizes → higher throughput
- Optimal zone: 1200-2400 MiB for balanced workloads
- Diminishing returns beyond 2800 MiB

**Pareto Points:**
- Low VRAM (150 MiB): 180 ops/sec (CUDA-Q only)
- Medium VRAM (1250 MiB): 28 FPS (YOLO11s)
- High VRAM (2650 MiB): 18 tok/sec (Qwen)

### Throughput vs Accuracy

**Negative Correlation** (r ≈ -0.42)

- Speed vs precision trade-off
- Larger batches reduce per-sample attention
- Lower quantization improves accuracy but reduces throughput

**Pareto Points:**
- High Throughput: 30 FPS, 0.70 mAP (YOLO batch=4)
- Balanced: 22 FPS, 0.73 mAP (YOLO batch=2)
- High Accuracy: 0.0008 gradient, 220 iter/sec (CUDA-Q 1024 shots)

### Accuracy vs Waveform Equilibrium

**Weak Correlation** (r ≈ +0.15)

- Mostly independent (equilibrium is CUDA-Q-specific)
- High equilibrium (purity >0.95) often coincides with good convergence
- Not a strong trade-off

### VRAM vs Accuracy

**Non-linear Relationship**

- CUDA-Q: More shots → better accuracy → same VRAM (CPU-bound)
- YOLO: Larger models → better mAP → more VRAM
- Qwen: FP16 vs INT4 → better perplexity → more VRAM

**Pareto Frontier:**
- Shows minimum VRAM needed for target accuracy
- Identifies wasteful over-allocation

---

## Tuning Guidelines

### Maximizing VRAM Efficiency

1. **Use quantization:**
   - INT4: 60% VRAM reduction, 1.3× perplexity increase
   - INT8: 40% VRAM reduction, 1.1× perplexity increase
   - FP16: 50% VRAM reduction (vs FP32), minimal accuracy loss

2. **Dynamic model swapping:**
   - Unload idle models after 30-120 sec
   - Priority-based preemption (CUDA-Q > YOLO > Qwen)

3. **Batch size optimization:**
   - YOLO: batch=2 is sweet spot (throughput vs VRAM)
   - Qwen: batch=1 (interactive latency requirement)
   - CUDA-Q: batch=1 (quantum state collapse)

### Maximizing Throughput

1. **CUDA stream parallelism:**
   - Run CUDA-Q and YOLO on separate streams
   - Qwen requires exclusive GPU (large context)

2. **Batch processing:**
   - YOLO: batch=4 achieves 1.4× throughput vs batch=1
   - Diminishing returns beyond batch=8

3. **Half precision (FP16):**
   - YOLO: 1.3× speedup, minimal accuracy loss
   - CUDA-Q: Not applicable (quantum operations)
   - Qwen: 1.2× speedup with Flash Attention

### Maximizing Accuracy

1. **CUDA-Q:**
   - Increase shots: 256 → 1024 → 2048
   - More QAOA layers: 2 → 3 (diminishing returns beyond 3)
   - Enable waveform equilibrium early stopping

2. **YOLO11s:**
   - Lower confidence threshold: 0.25 → 0.15 (higher recall)
   - Larger input size: 416 → 640 (better small object detection)
   - Reduce batch size: 4 → 2 (more per-sample attention)

3. **Qwen 1.5:**
   - Use FP16 instead of INT4
   - Increase context length: 1024 → 2048 → 4096
   - Lower temperature: 0.9 → 0.7 (more focused generation)

### Maximizing Waveform Equilibrium

1. **Target high purity (>0.95):**
   - More shots per iteration (1024+)
   - Proper QAOA initialization (uniform superposition)
   - Avoid over-optimization (stop at equilibrium)

2. **Reduce effective dimension (<5):**
   - Good problem encoding (QUBO matrix structure)
   - Sufficient QAOA layers (2-3)
   - Avoid noise (high shot count)

3. **Monitor energy gradient:**
   - |∇E| < 0.001: excellent convergence
   - |∇E| < 0.01: acceptable
   - |∇E| > 0.1: poor convergence, increase shots

---

## Integration with Existing Infrastructure

### Diamond Gateway Integration

```python
# In gateway.py orchestrate endpoint
from unified_inference.optimizer import OrthogonalOptimizer, WorkloadType

optimizer = OrthogonalOptimizer(workload_type=WorkloadType.BALANCED)

# Before loading model
current_state = SystemState(
    vram_used_mib=get_current_vram(),
    # ... other metrics
)

# Check if model load is feasible
proposed_metrics = {"qwen-1.5": ModelMetrics(...)}
is_feasible, violations = optimizer.check_constraints(current_state, proposed_metrics)

if not is_feasible:
    return {"action": "REJECT", "reason": violations}

# Evaluate and recommend config
op = optimizer.evaluate_operating_point(current_state, proposed_metrics, "load_qwen")
if op.total_score < 0.5:
    return {"action": "DEFER", "reason": "Low optimization score"}
```

### Waveform Equilibrium Integration

```python
# In waveform_equilibrium.py
from unified_inference.optimizer import ObjectiveFunctions

# After QAOA iteration
equilibrium_score = ObjectiveFunctions.waveform_equilibrium(
    purity=metrics.purity,
    effective_dim=metrics.effective_dimension,
    energy_grad=metrics.energy_gradient
)

if equilibrium_score > 0.9:
    # Early stopping
    print("Waveform equilibrium reached, stopping optimization")
    break
```

---

## Monitoring and Logging

### Metrics to Track

1. **Real-time:**
   - VRAM utilization (%)
   - Temperature (°C)
   - Hamiltonian H_resource
   - Throughput (model-specific)

2. **Per-request:**
   - Latency (P50, P95, P99)
   - Accuracy score
   - Objective function scores
   - Total optimization score

3. **Historical:**
   - Pareto frontier evolution
   - Constraint violations
   - Model swap frequency
   - OFFLOAD trigger rate

### Logging Format

```json
{
  "timestamp": "2024-05-12T07:30:00Z",
  "operating_point": {
    "config_name": "scientific_q16_s1024",
    "total_score": 0.8234,
    "system_state": {
      "vram_used_mib": 180,
      "temp_celsius": 45.2,
      "hamiltonian": 2.87
    },
    "objective_scores": {
      "vram_efficiency": 0.72,
      "compute_throughput": 0.88,
      "model_accuracy": 0.92,
      "waveform_equilibrium": 0.85
    },
    "is_pareto_optimal": true
  }
}
```

---

## FAQ

### Q: How do I choose the right workload profile?

**A:** Match your primary use case:
- **Scientific:** Quantum optimization, research, accuracy-critical
- **Vision:** Real-time detection, video processing, FPS-critical
- **Conversational:** Chat, text generation, memory-constrained
- **Balanced:** Multi-tenant, mixed workloads, exploration

### Q: What if I have custom optimization priorities?

**A:** Create custom weights:

```python
optimizer = OrthogonalOptimizer(workload_type=WorkloadType.BALANCED)
optimizer.weights = OptimizationWeights(
    vram_efficiency=0.1,
    compute_throughput=0.6,  # My priority
    model_accuracy=0.2,
    waveform_equilibrium=0.1
).normalize()
```

### Q: How often should I recompute Pareto frontier?

**A:**
- **Offline:** Once per configuration change (model update, new hardware)
- **Online:** Every 100-1000 requests (adaptive optimization)
- **Emergency:** After constraint violation or OFFLOAD

### Q: Can I use this with models other than CUDA-Q/YOLO/Qwen?

**A:** Yes, extend `ObjectiveFunctions` with new baselines:

```python
ObjectiveFunctions.MAX_THROUGHPUT_NEW_MODEL = 50.0
ObjectiveFunctions.BASELINE_ACCURACY_NEW_MODEL = 0.80

# In compute_throughput():
baselines["new-model"] = ObjectiveFunctions.MAX_THROUGHPUT_NEW_MODEL
```

### Q: What's the computational overhead of optimization?

**A:** Negligible:
- Evaluate single point: <1 ms
- Find Pareto frontier (100 points): ~5-10 ms
- Full benchmark suite: ~30-60 sec

### Q: How do I handle constraint violations?

**A:**
1. Check `is_feasible` before deployment
2. If violated: reduce load (swap out model, reduce batch size)
3. If persistent: update constraints or workload profile
4. Emergency: trigger OFFLOAD (H_resource > 8.5)

---

## References

### Related Documentation

- `~/diamond-node/docs/waveform_equilibrium_theory.md` — Waveform math
- `~/diamond-node/docs/waveform_integration_guide.md` — CUDA-Q integration
- `~/UNIFIED_INFERENCE_ARCHITECTURE.md` — Overall system design
- `~/diamond-node/config/optimization_profiles.yaml` — Configuration templates

### Key Files

- `unified-inference/optimizer.py` — Core optimizer implementation
- `benchmarks/orthogonal_test.py` — Benchmark suite
- `config/optimization_profiles.yaml` — Workload profiles

### External Resources

- Pareto Efficiency: https://en.wikipedia.org/wiki/Pareto_efficiency
- Multi-Objective Optimization: https://en.wikipedia.org/wiki/Multi-objective_optimization
- CUDA-Q Documentation: https://nvidia.github.io/cuda-quantum/

---

## Appendix: Mathematical Proofs

### Theorem: Pareto Dominance is Transitive

**Proof:**
If A dominates B, and B dominates C, then A dominates C.

Let:
- `A ≻ B` mean A dominates B (A better in ≥1 dimension, not worse in any)
- `fᵢ(X)` be objective i evaluated at config X

Given:
1. `A ≻ B`: ∃i: fᵢ(A) > fᵢ(B), ∀j: fⱼ(A) ≥ fⱼ(B)`
2. `B ≻ C`: ∃k: fₖ(B) > fₖ(C), ∀l: f_l(B) ≥ f_l(C)`

Then:
- For dimension i: `fᵢ(A) > fᵢ(B) ≥ fᵢ(C)` → `fᵢ(A) > fᵢ(C)`
- For all j: `fⱼ(A) ≥ fⱼ(B) ≥ fⱼ(C)` → `fⱼ(A) ≥ fⱼ(C)`

Therefore `A ≻ C`. ∎

**Implication:** Pareto frontier can be computed in O(n²) by pairwise comparison.

---

*Last Updated: 2024-05-12*
*Version: 1.0.0*
*Author: Diamond Node Orchestration Team*
