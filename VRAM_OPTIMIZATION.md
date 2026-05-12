# VRAM Optimization Guide - GTX 1650 (4GB)

**GPU**: NVIDIA GeForce GTX 1650  
**Total VRAM**: 4096 MiB (4 GB)  
**Current Usage**: 2502 MiB (61%)  
**Available**: 1594 MiB (39%)

---

## 🎯 Objective

Run **Qwen + YOLO** simultaneously on GTX 1650 with sufficient headroom for stable operation.

**Challenge**:
```
Qwen unquantized:  ~2048 MiB
YOLO (YOLOv8n):    ~700 MiB
Current baseline:  2502 MiB
                   --------
Total needed:      ~5250 MiB (EXCEEDS 4096 MiB by 1154 MiB)
```

**Solution**: Model quantization + strategic offloading

---

## 🔧 Strategy 1: Qwen Quantization (Recommended)

### Option A: 4-bit Quantization (GGUF)

**VRAM Savings**: ~60-70%

```bash
# Install llama.cpp for GGUF support
cd ~
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Download Qwen 4-bit quantized
wget https://huggingface.co/Qwen/Qwen-7B-Chat-GGUF/resolve/main/qwen-7b-chat-q4_0.gguf -O models/qwen-7b-q4.gguf

# Run with CUDA
./main -m models/qwen-7b-q4.gguf -n 512 -ngl 35 --color

# Expected VRAM: ~800-1000 MiB (saves ~1200 MiB)
```

**New Calculation**:
```
Qwen 4-bit:        ~900 MiB
YOLO (YOLOv8n):    ~700 MiB
Baseline:          2502 MiB
                   --------
Total:             ~4100 MiB (FITS in 4096 MiB with tight margin)
```

### Option B: 8-bit Quantization (Balanced)

**VRAM Savings**: ~40-50%

```bash
# Using Ollama with quantization
ollama pull qwen:7b-chat-q8_0

# Or manually with transformers
pip install bitsandbytes accelerate

# In Python:
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen-7B-Chat",
    load_in_8bit=True,
    device_map="auto"
)

# Expected VRAM: ~1200-1400 MiB (saves ~800 MiB)
```

**New Calculation**:
```
Qwen 8-bit:        ~1300 MiB
YOLO (YOLOv8n):    ~700 MiB
Baseline:          2502 MiB
                   --------
Total:             ~4500 MiB (EXCEEDS by 400 MiB - still tight)
```

---

## 🔧 Strategy 2: YOLO Optimization

### Option A: Use Smaller YOLO Model

```bash
# YOLOv8n (nano) - current
# VRAM: ~700 MiB

# YOLOv5n (nano) - even smaller
# VRAM: ~400 MiB
pip install ultralytics
yolo task=detect mode=predict model=yolov5n.pt

# Saves: ~300 MiB
```

### Option B: CPU Offloading for YOLO

```python
from ultralytics import YOLO

# Force YOLO to CPU
model = YOLO('yolov8n.pt')
model.to('cpu')

# Run inference on CPU (slower but frees ~700 MiB VRAM)
results = model('image.jpg', device='cpu')
```

**Benefits**:
- Frees ~700 MiB VRAM for Qwen
- YOLO inference still relatively fast on CPU for single images
- Recommended for batch processing where latency is acceptable

---

## 🔧 Strategy 3: Sequential Execution

Run models sequentially instead of simultaneously:

```python
import torch

def run_qwen_task():
    # Load Qwen
    qwen_model = load_qwen()
    result = qwen_model.generate(...)
    
    # Free VRAM
    del qwen_model
    torch.cuda.empty_cache()
    
    return result

def run_yolo_task():
    # Load YOLO (Qwen now unloaded)
    yolo_model = YOLO('yolov8n.pt')
    result = yolo_model('image.jpg')
    
    # Free VRAM
    del yolo_model
    torch.cuda.empty_cache()
    
    return result

# Execute sequentially
qwen_output = run_qwen_task()
yolo_output = run_yolo_task()
```

**Benefits**:
- Can use unquantized models
- No memory pressure
- Best quality results

**Drawbacks**:
- Slower overall throughput
- Model loading overhead

---

## 🔧 Strategy 4: Dynamic Model Loading (Diamond Gateway Integration)

Integrate with Diamond Gateway's Ising Hamiltonian VRAM monitoring:

```python
import torch
from typing import Optional

class VRAMManager:
    def __init__(self, hamiltonian_threshold=8.5):
        self.threshold = hamiltonian_threshold
        self.models = {}
    
    def get_vram_status(self):
        """Calculate Ising Hamiltonian H(s)"""
        total = torch.cuda.get_device_properties(0).total_memory / (1024**2)
        used = torch.cuda.memory_allocated(0) / (1024**2)
        
        H = (used / total) * 10
        return {
            'used_mib': used,
            'total_mib': total,
            'free_mib': total - used,
            'hamiltonian': H,
            'should_offload': H > self.threshold
        }
    
    def load_model(self, name: str, loader_fn, force=False):
        """Load model with VRAM check"""
        status = self.get_vram_status()
        
        if status['should_offload'] and not force:
            print(f"⚠️  H(s) = {status['hamiltonian']:.2f} > {self.threshold}")
            print(f"   VRAM pressure high, offloading...")
            self.offload_least_used()
        
        if name not in self.models:
            self.models[name] = loader_fn()
        
        return self.models[name]
    
    def offload_least_used(self):
        """Offload least recently used model"""
        if not self.models:
            return
        
        # Simple LRU: offload first model
        model_name = list(self.models.keys())[0]
        print(f"   Offloading {model_name}...")
        del self.models[model_name]
        torch.cuda.empty_cache()

# Usage
manager = VRAMManager(hamiltonian_threshold=8.5)

# Load Qwen (checks VRAM first)
qwen = manager.load_model('qwen', load_qwen_model)

# Load YOLO (may offload Qwen if VRAM pressure high)
yolo = manager.load_model('yolo', load_yolo_model)
```

---

## 📊 Recommended Configuration

### For Simultaneous Execution:

```yaml
Configuration:
  Qwen:
    Type: 4-bit quantized (GGUF)
    VRAM: ~900 MiB
  
  YOLO:
    Type: YOLOv5n (nano)
    VRAM: ~400 MiB
  
  Baseline:
    VRAM: 2502 MiB
  
  Total:
    VRAM: ~3800 MiB
    Headroom: ~300 MiB (7%)
    Status: ✅ SAFE
```

### For Sequential Execution:

```yaml
Configuration:
  Qwen:
    Type: Unquantized or 8-bit
    VRAM: ~2000 MiB (when loaded)
  
  YOLO:
    Type: YOLOv8n
    VRAM: ~700 MiB (when loaded)
  
  Strategy:
    Load Qwen → Run → Unload
    Load YOLO → Run → Unload
  
  Status: ✅ OPTIMAL QUALITY
```

---

## 🚀 Implementation Steps

### Step 1: Install Quantization Tools

```bash
# Option A: llama.cpp for GGUF
cd ~
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Option B: bitsandbytes for 8-bit
pip install bitsandbytes accelerate
```

### Step 2: Download Quantized Qwen

```bash
# 4-bit (recommended)
cd ~/models
wget https://huggingface.co/Qwen/Qwen-7B-Chat-GGUF/resolve/main/qwen-7b-chat-q4_0.gguf

# Or via Ollama
ollama pull qwen:7b-chat-q4_0
```

### Step 3: Install Smaller YOLO

```bash
# YOLOv5n (400 MiB instead of 700 MiB)
pip install ultralytics
python3 -c "from ultralytics import YOLO; YOLO('yolov5n.pt')"
```

### Step 4: Test Configuration

```bash
# Monitor VRAM
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader -l 1

# In another terminal, run your workload
python3 your_inference_script.py
```

### Step 5: Integrate with Diamond Gateway

```python
# Add to your inference script
import requests

def check_vram_hamiltonian():
    response = requests.post(
        'http://localhost:8000/v1/orchestrate',
        headers={'Authorization': f'Bearer {GATEWAY_SECRET}'},
        json={
            'session_id': 'inference-session',
            'context_buffer': '[Qwen+YOLO inference]'
        }
    )
    
    if response.json()['action'] == 'OFFLOAD':
        # Hamiltonian > 8.5, VRAM pressure high
        offload_models()
```

---

## 📈 Monitoring

### Real-time VRAM Monitoring

```bash
# Terminal 1: Watch VRAM
watch -n 1 'nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader'

# Terminal 2: Diamond Gateway logs
sudo journalctl -u diamond-gateway -f

# Terminal 3: Your workload
python3 inference.py
```

### Logging VRAM Events

```python
import logging
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_vram_status(label=""):
    allocated = torch.cuda.memory_allocated(0) / (1024**2)
    reserved = torch.cuda.memory_reserved(0) / (1024**2)
    total = torch.cuda.get_device_properties(0).total_memory / (1024**2)
    
    logger.info(f"VRAM {label}: {allocated:.0f}MB allocated, {reserved:.0f}MB reserved, {total:.0f}MB total")

# Usage
log_vram_status("Before Qwen load")
model = load_qwen()
log_vram_status("After Qwen load")
```

---

## ✅ Success Criteria

After optimization:

- [ ] Qwen + YOLO fit in 4GB VRAM simultaneously
- [ ] VRAM Hamiltonian H(s) < 8.5 during normal operation
- [ ] At least 300 MiB (7%) headroom maintained
- [ ] No CUDA out-of-memory errors
- [ ] Inference latency acceptable (<2s for Qwen, <100ms for YOLO)
- [ ] Diamond Gateway monitoring integrated

---

## 📚 Resources

- **Qwen GGUF Models**: https://huggingface.co/Qwen/Qwen-7B-Chat-GGUF
- **llama.cpp**: https://github.com/ggerganov/llama.cpp
- **Ultralytics YOLO**: https://docs.ultralytics.com/
- **Diamond Gateway**: `/opt/diamond-gateway/gateway.py`
- **VRAM Monitoring**: `nvidia-smi --help-query-gpu`

---

**Status**: Ready to implement  
**Recommended**: Strategy 1 (Qwen 4-bit) + YOLO YOLOv5n  
**Expected VRAM**: ~3800 MiB (300 MiB headroom)
