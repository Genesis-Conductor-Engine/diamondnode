#!/usr/bin/env python3
"""
VRAM Manager for Diamond Node
Implements Ising Hamiltonian-based VRAM monitoring and model offloading
"""

import torch
import subprocess
import json
import os
from typing import Dict, Optional, List, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class VRAMStatus:
    """VRAM status snapshot"""
    used_mib: float
    total_mib: float
    free_mib: float
    hamiltonian: float
    should_offload: bool
    timestamp: str

class VRAMManager:
    """
    VRAM manager with Ising Hamiltonian monitoring

    H(s) = (VRAM_Used / VRAM_Total) * 10

    If H(s) > threshold (default 8.5 = 90% saturation), triggers OFFLOAD
    """

    def __init__(self, hamiltonian_threshold: float = 8.5, device_id: int = 0):
        self.threshold = hamiltonian_threshold
        self.device_id = device_id
        self.loaded_models: Dict[str, Any] = {}
        self.load_history: List[str] = []

    def get_vram_status(self) -> VRAMStatus:
        """Calculate current VRAM status and Ising Hamiltonian"""
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA not available")

        props = torch.cuda.get_device_properties(self.device_id)
        total_mib = props.total_memory / (1024 ** 2)
        used_mib = torch.cuda.memory_allocated(self.device_id) / (1024 ** 2)
        free_mib = total_mib - used_mib

        # Ising Hamiltonian: H(s) = (Used / Total) * 10
        hamiltonian = (used_mib / total_mib) * 10
        should_offload = hamiltonian > self.threshold

        return VRAMStatus(
            used_mib=used_mib,
            total_mib=total_mib,
            free_mib=free_mib,
            hamiltonian=hamiltonian,
            should_offload=should_offload,
            timestamp=datetime.utcnow().isoformat()
        )

    def log_status(self, label: str = "") -> VRAMStatus:
        """Log VRAM status with optional label"""
        status = self.get_vram_status()

        emoji = "⚠️" if status.should_offload else "✅"
        print(f"{emoji} VRAM {label}:")
        print(f"   Used:  {status.used_mib:.0f} MiB ({status.used_mib/status.total_mib*100:.1f}%)")
        print(f"   Free:  {status.free_mib:.0f} MiB ({status.free_mib/status.total_mib*100:.1f}%)")
        print(f"   H(s):  {status.hamiltonian:.2f} {'> THRESHOLD' if status.should_offload else ''}")

        return status

    def check_headroom(self, required_mib: float) -> bool:
        """Check if sufficient VRAM headroom available"""
        status = self.get_vram_status()
        available = status.free_mib

        print(f"Checking headroom: {available:.0f} MiB available, {required_mib:.0f} MiB required")

        if available < required_mib:
            print(f"⚠️  Insufficient headroom (need {required_mib - available:.0f} MiB more)")
            return False

        return True

    def load_model(self, name: str, loader_fn, required_vram_mib: Optional[float] = None, force: bool = False):
        """
        Load model with VRAM check

        Args:
            name: Model identifier
            loader_fn: Function that returns loaded model
            required_vram_mib: Estimated VRAM requirement
            force: Skip VRAM check if True

        Returns:
            Loaded model
        """
        # Check if already loaded
        if name in self.loaded_models:
            print(f"✅ Model '{name}' already loaded")
            return self.loaded_models[name]

        # Check VRAM status
        status = self.get_vram_status()

        if status.should_offload and not force:
            print(f"⚠️  H(s) = {status.hamiltonian:.2f} > {self.threshold}")
            print(f"   VRAM pressure high, offloading...")
            self.offload_least_used()

        # Check headroom if estimated size provided
        if required_vram_mib and not force:
            if not self.check_headroom(required_vram_mib):
                print(f"   Attempting to free space...")
                self.offload_least_used()

                # Recheck
                if not self.check_headroom(required_vram_mib):
                    raise RuntimeError(f"Cannot free sufficient VRAM for {name}")

        # Load model
        print(f"Loading model '{name}'...")
        self.log_status("before load")

        model = loader_fn()
        self.loaded_models[name] = model
        self.load_history.append(name)

        self.log_status("after load")

        return model

    def offload_model(self, name: str):
        """Offload specific model"""
        if name not in self.loaded_models:
            print(f"⚠️  Model '{name}' not loaded")
            return

        print(f"Offloading model '{name}'...")
        del self.loaded_models[name]
        torch.cuda.empty_cache()

        self.log_status("after offload")

    def offload_least_used(self):
        """Offload least recently used model"""
        if not self.loaded_models:
            print("⚠️  No models loaded to offload")
            return

        # Simple LRU: offload oldest in history that's still loaded
        for name in self.load_history:
            if name in self.loaded_models:
                self.offload_model(name)
                self.load_history.remove(name)
                return

        # Fallback: offload first loaded model
        name = list(self.loaded_models.keys())[0]
        self.offload_model(name)

    def offload_all(self):
        """Offload all loaded models"""
        print(f"Offloading all models ({len(self.loaded_models)})...")

        for name in list(self.loaded_models.keys()):
            del self.loaded_models[name]

        torch.cuda.empty_cache()
        self.load_history.clear()

        self.log_status("after offload all")

    def report_to_gateway(self, session_id: str = "vram-manager", context: str = "") -> Dict:
        """
        Report VRAM status to Diamond Gateway

        Returns gateway response with OFFLOAD or CONTINUE action
        """
        gateway_secret = os.getenv('GATEWAY_SECRET')
        if not gateway_secret:
            print("⚠️  GATEWAY_SECRET not set, skipping gateway report")
            return {}

        status = self.get_vram_status()

        payload = {
            'session_id': session_id,
            'context_buffer': context or f"[VRAM Manager] H(s)={status.hamiltonian:.2f}",
        }

        try:
            import requests
            response = requests.post(
                'http://localhost:8000/v1/orchestrate',
                headers={'Authorization': f'Bearer {gateway_secret}'},
                json=payload,
                timeout=5
            )

            if response.status_code == 200:
                result = response.json()
                print(f"Gateway response: {result['action']}")

                if result['action'] == 'OFFLOAD':
                    print(f"⚠️  Gateway recommends OFFLOAD (H={result['hamiltonian']:.2f})")

                return result
            else:
                print(f"⚠️  Gateway error: {response.status_code}")
                return {}

        except ImportError:
            print("⚠️  'requests' not installed, skipping gateway report")
            return {}
        except Exception as e:
            print(f"⚠️  Gateway request failed: {e}")
            return {}


def main():
    """CLI for VRAM monitoring"""
    import argparse

    parser = argparse.ArgumentParser(description="VRAM Manager for Diamond Node")
    parser.add_argument('--threshold', type=float, default=8.5, help='Hamiltonian threshold (default: 8.5)')
    parser.add_argument('--device', type=int, default=0, help='CUDA device ID (default: 0)')
    parser.add_argument('--report-gateway', action='store_true', help='Report to Diamond Gateway')
    parser.add_argument('--session-id', type=str, default='vram-cli', help='Session ID for gateway')

    args = parser.parse_args()

    manager = VRAMManager(hamiltonian_threshold=args.threshold, device_id=args.device)

    print("=" * 60)
    print("VRAM Manager - Diamond Node")
    print("=" * 60)
    print()

    # Get status
    status = manager.log_status()

    print()
    print("=" * 60)

    # Gateway report if requested
    if args.report_gateway:
        print()
        print("Reporting to Diamond Gateway...")
        gateway_response = manager.report_to_gateway(
            session_id=args.session_id,
            context=f"CLI check: H(s)={status.hamiltonian:.2f}"
        )

        if gateway_response:
            print()
            print("Gateway Response:")
            print(json.dumps(gateway_response, indent=2))


if __name__ == '__main__':
    main()
