#!/bin/bash
# diamondnode-ops/gpu_watch.sh
# Simple GPU monitor for diamondnode

watch -n 2 'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader && echo "" && df -h /tmp'