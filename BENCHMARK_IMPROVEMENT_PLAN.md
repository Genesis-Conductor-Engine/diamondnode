# Benchmark Analysis & Improvement Plan

**Generated**: 2026-05-12 09:15 UTC  
**Focus**: Improve Pareto-optimal ratios from current baseline

---

## 📊 Current Benchmark Results

### Summary

| Benchmark | Pareto-Optimal | Total Configs | Pass Rate | Status |
|-----------|---------------|---------------|-----------|--------|
| **Conversational** | 2 | 9 | 22% | ❌ **CRITICAL** |
| **Vision** | 4 | 8 | 50% | ⚠️ NEEDS WORK |
| **Scientific** | 6 | 12 | 50% | ⚠️ NEEDS WORK |
| **Balanced** | 2 | 2 | 100% | ✅ GOOD |

**Overall**: 14/31 = **45% Pareto-optimal**  
**Target**: 80% Pareto-optimal

---

## 🔍 Detailed Analysis

### 1. Conversational Workload (22% - CRITICAL)

**Pareto-Optimal Configurations (2/9)**:
1. `conversational_fp16_seq1024` (Score: 0.7982)
   - VRAM: 3000 MiB (75.5%)
   - Throughput: 60 ops/sec
   - Accuracy: 6.75
   - Hamiltonian: 7.764

2. `conversational_fp16_seq2048` (Score: 0.7982)
   - VRAM: 3000 MiB (75.5%)
   - Throughput: 30 ops/sec
   - Accuracy: 6.75
   - Hamiltonian: 7.764

**Non-Pareto Configurations (7/9)**:
- `conversational_int4_seq1024/2048/4096` (3 configs)
  - VRAM: 1200 MiB (30%)
  - Throughput: 60/30/15 ops/sec
  - Accuracy: 5.2 ⚠️ **Lower accuracy**
  - Score: 0.629 (vs 0.798 for fp16)

- `conversational_int8_seq1024/2048/4096` (3 configs)
  - VRAM: 1800 MiB (45%)
  - Throughput: 60/30/15 ops/sec
  - Accuracy: 6.0 ⚠️ **Still lower than fp16**
  - Score: 0.706 (vs 0.798 for fp16)

- `conversational_fp16_seq4096` (1 config)
  - VRAM: 3000 MiB
  - Throughput: 15 ops/sec ⚠️ **Too slow**
  - Accuracy: 6.75
  - Score: 0.724 (lower due to throughput)

**Root Causes**:
1. **Quantization accuracy loss** - int4/int8 models have lower accuracy (5.2-6.0 vs 6.75)
2. **Long sequence penalty** - seq4096 has poor throughput (15 ops/sec)
3. **Lack of middle-ground configs** - No fp16_seq512 or int8_seq1536 tested

---

### 2. Vision Workload (50% - NEEDS WORK)

**Pareto-Optimal Configurations (4/8)**:
1. `vision_b8_i640` - Best throughput, moderate VRAM
2. `vision_b4_i640` - Balanced
3. `vision_b2_i640` - Lower VRAM, high accuracy
4. `vision_b1_i640` - Lowest VRAM, highest accuracy

**Non-Pareto Configurations (4/8)**:
- `vision_b*_i320` (4 configs) - All lower resolution variants
  - Lower accuracy due to smaller input size
  - Not competitive with 640x640 variants

**Root Causes**:
1. **Resolution matters** - All 640x640 configs are Pareto-optimal
2. **320x320 not competitive** - Lower resolution hurts accuracy too much
3. **Need intermediate resolutions** - Test 480x480, 512x512

---

### 3. Scientific Workload (50% - NEEDS WORK)

**Pareto-Optimal Configurations (6/12)**:
- Good mix of qubit counts (12, 16, 20) and sequence lengths
- All Pareto configs have low VRAM (180-220 MiB)
- Balance between throughput and accuracy

**Non-Pareto Configurations (6/12)**:
- Configurations with poor throughput/accuracy trade-offs
- Too many qubits with long sequences (high latency)
- Too few qubits (lower accuracy potential)

**Root Causes**:
1. **Over-parameterization** - Some configs use more resources than needed
2. **Under-parameterization** - Others don't meet accuracy requirements
3. **Need better sampling** - Explore q14, q18 qubit counts

---

## 🎯 Improvement Strategies

### Strategy 1: Improve Conversational (22% → 67% target)

**Add 4 new configurations**:

1. **`conversational_fp16_seq512`**
   ```yaml
   Quantization: FP16 (no loss)
   Sequence: 512 (shorter, faster)
   Expected: Higher throughput (120 ops/sec)
   VRAM: ~2400 MiB
   Reason: Gap between seq1024 and seq2048
   ```

2. **`conversational_int8_seq1536`**
   ```yaml
   Quantization: INT8 (acceptable loss)
   Sequence: 1536 (middle ground)
   Expected: Good accuracy (6.2-6.4), moderate throughput
   VRAM: ~1950 MiB
   Reason: Better int8 accuracy with optimal sequence length
   ```

3. **`conversational_fp16_seq768`**
   ```yaml
   Quantization: FP16
   Sequence: 768
   Expected: High throughput (80 ops/sec), full accuracy
   VRAM: ~2700 MiB
   Reason: Fill gap between seq512 and seq1024
   ```

4. **`conversational_int8_seq768`**
   ```yaml
   Quantization: INT8
   Sequence: 768
   Expected: Better throughput (80 ops/sec), acceptable accuracy (6.0-6.2)
   VRAM: ~1650 MiB
   Reason: INT8 sweet spot - shorter sequences improve accuracy
   ```

**Expected Result**: 6/13 = **46%** (still below target, but 2x improvement)

**Additional Improvements**:
- Tune quantization calibration for int4/int8
- Use Qwen2:1.5b instead of Qwen-1.5 (better accuracy)
- Test dynamic quantization (loads fp16, quantizes at runtime)

---

### Strategy 2: Improve Vision (50% → 75% target)

**Add 2 new configurations**:

1. **`vision_b*_i512`** (4 configs: b1, b2, b4, b8)
   ```yaml
   Resolution: 512x512 (intermediate)
   Expected: Better accuracy than 320, lower VRAM than 640
   Reason: Fill resolution gap
   ```

2. **`vision_b*_i480`** (4 configs)
   ```yaml
   Resolution: 480x480
   Expected: Good balance
   Reason: Common mobile resolution
   ```

**Expected Result**: 10/16 = **63%** (if 6 new configs are Pareto-optimal)

**Additional Improvements**:
- Use YOLOv8n quantized (reduces VRAM by 40%)
- Test TensorRT optimization (improves throughput)
- Add mAP50 metric for accuracy

---

### Strategy 3: Improve Scientific (50% → 75% target)

**Add 4 new configurations**:

1. **`scientific_q14_s1024`**
   ```yaml
   Qubits: 14 (between 12 and 16)
   Sequence: 1024
   Expected: Good accuracy/throughput balance
   ```

2. **`scientific_q18_s1024`**
   ```yaml
   Qubits: 18 (between 16 and 20)
   Sequence: 1024
   Expected: Higher accuracy, acceptable throughput
   ```

3. **`scientific_q14_s2048`**
4. **`scientific_q18_s2048`**

**Expected Result**: 10/16 = **63%**

**Additional Improvements**:
- Use adaptive shot count (more shots for higher qubits)
- Tune QAOA parameters (gamma, beta) per configuration
- Test VQE algorithm (may be more efficient)

---

## 🚀 Implementation Plan

### Phase 1: Quick Wins (2 hours)

1. **Add conversational configs**
   ```bash
   cd ~/diamond-node/benchmarks
   # Edit orthogonal_test.py to add 4 new configs
   ```

2. **Add vision i512 resolution**
   ```bash
   # Add 4 new vision configs with 512x512 resolution
   ```

3. **Re-run benchmarks**
   ```bash
   /home/diamondnode/venv312/bin/python benchmarks/orthogonal_test.py --workload all
   ```

### Phase 2: Model Optimization (4 hours)

1. **Switch to Qwen2:1.5b**
   ```bash
   ollama pull qwen2:1.5b  # Better accuracy than Qwen-1.5
   ```

2. **Quantize YOLO**
   ```python
   # Use YOLOv8n with INT8 quantization
   from ultralytics import YOLO
   model = YOLO('yolov8n.pt')
   model.export(format='engine', int8=True)
   ```

3. **Tune QUBO parameters**
   ```python
   # In mycelial_qubo.py
   lam_dist = 0.35  # was 0.4
   lam_redund = -0.25  # was -0.2
   lam_resource = -0.9  # was -0.8
   ```

### Phase 3: Advanced (8 hours)

1. **Implement dynamic quantization**
2. **Add TensorRT optimization**
3. **Implement waveform equilibrium scoring** (currently returns 0)
4. **Add LangSmith tracing for optimization metrics**

---

## 📈 Expected Outcomes

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|---------|---------------|---------------|---------------|
| **Conversational** | 22% | 46% | 56% | **67%** ✅ |
| **Vision** | 50% | 63% | 69% | **75%** ✅ |
| **Scientific** | 50% | 63% | 69% | **75%** ✅ |
| **Overall** | 45% | 57% | 65% | **72%** |

**Final Target**: 72% overall (close to 80% goal)

---

## 🔧 Quick Test Commands

### Test Conversational with Qwen2:1.5b
```bash
# Pull better model
ollama pull qwen2:1.5b

# Test inference
ollama run qwen2:1.5b "What is 2+2?" --verbose

# Monitor VRAM
~/diamond-node/scripts/vram_check.sh
```

### Test Vision with Quantized YOLO
```python
from ultralytics import YOLO
import torch

# Load and quantize
model = YOLO('yolov8n.pt')
model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)

# Test inference
results = model('test_image.jpg')
```

### Test Scientific QUBO Tuning
```bash
cd ~/diamond-node

# Edit scripts/mycelial_qubo.py with new lambda values
nano scripts/mycelial_qubo.py

# Run test
/home/diamondnode/venv312/bin/python scripts/mycelial_qubo.py --shots 1024 --outer-rounds 5 --json
```

---

## 📊 Monitoring

### Track Progress
```bash
# Run full benchmark suite
/home/diamondnode/venv312/bin/python benchmarks/orthogonal_test.py --workload all

# Check results
cat ~/diamond-node/benchmark_results/current-full/report_*.txt

# Compare before/after
diff \
  ~/diamond-node/benchmark_results/previous/report_conversational.txt \
  ~/diamond-node/benchmark_results/current-full/report_conversational.txt
```

### VRAM Monitoring During Benchmarks
```bash
# Terminal 1: Run benchmarks
/home/diamondnode/venv312/bin/python benchmarks/orthogonal_test.py

# Terminal 2: Monitor VRAM
watch -n 1 '~/diamond-node/scripts/vram_check.sh'

# Terminal 3: Monitor GPU temperature
watch -n 1 'nvidia-smi --query-gpu=temperature.gpu,power.draw --format=csv,noheader'
```

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] 4 new conversational configs added
- [ ] 4 new vision i512 configs added
- [ ] Benchmark suite runs successfully
- [ ] Conversational: 4-5 Pareto-optimal (44-56%)

### Phase 2 Complete When:
- [ ] Qwen2:1.5b installed and tested
- [ ] YOLO quantization working
- [ ] QUBO parameters tuned
- [ ] Conversational: 5-6 Pareto-optimal (56-67%)

### Phase 3 Complete When:
- [ ] Waveform equilibrium implemented
- [ ] TensorRT optimization working
- [ ] LangSmith tracing active
- [ ] Overall: 70%+ Pareto-optimal ✅

---

**Status**: Analysis complete, ready for implementation  
**Priority**: Phase 1 (quick wins) recommended  
**ETA**: Phase 1 = 2 hours, Phase 2 = 6 hours, Phase 3 = 14 hours total
