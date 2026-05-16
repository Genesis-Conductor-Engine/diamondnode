"""CUDA-Q GPU verification test for GTX 1650

Tests:
1. Basic QAOA circuit execution
2. GPU target detection
3. VRAM monitoring during execution
4. Multi-shot sampling performance
"""
import cudaq
import json
import subprocess
import time
from datetime import datetime, timezone


def get_vram_usage():
    """Get current VRAM usage in MiB."""
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=memory.used,memory.total,temperature.gpu",
         "--format=csv,noheader,nounits"],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        parts = [p.strip() for p in result.stdout.strip().split(",")]
        return {
            "used_mib": int(parts[0]),
            "total_mib": int(parts[1]),
            "temp_c": float(parts[2])
        }
    return None


def test_qaoa_circuit(num_qubits=10, shots=1024):
    """Test QAOA circuit with specified parameters."""
    print(f"\n=== QAOA Test: {num_qubits} qubits, {shots} shots ===")

    # Record baseline VRAM
    vram_before = get_vram_usage()
    print(f"VRAM before: {vram_before['used_mib']} / {vram_before['total_mib']} MiB ({vram_before['temp_c']}°C)")

    # Simple QAOA kernel for MaxCut problem
    @cudaq.kernel
    def qaoa_maxcut(gamma: float, beta: float):
        qubits = cudaq.qvector(num_qubits)
        # Initialize |+> state
        for i in range(num_qubits):
            h(qubits[i])

        # Phase separation (ZZ gates for edges)
        for i in range(num_qubits - 1):
            cx(qubits[i], qubits[i + 1])
            rz(gamma, qubits[i + 1])
            cx(qubits[i], qubits[i + 1])

        # Mixer
        for i in range(num_qubits):
            rx(2.0 * beta, qubits[i])

        # Measure all qubits (CUDA-Q requires explicit calls)
        for i in range(num_qubits):
            mz(qubits[i])

    # Execute with timing
    t0 = time.perf_counter()
    result = cudaq.sample(qaoa_maxcut, 0.5, 0.3, shots_count=shots)
    duration = time.perf_counter() - t0

    # Record post-execution VRAM
    time.sleep(0.5)  # Allow GPU to settle
    vram_after = get_vram_usage()
    print(f"VRAM after:  {vram_after['used_mib']} / {vram_after['total_mib']} MiB ({vram_after['temp_c']}°C)")

    # Analyze results
    total_shots = result.get_total_shots()
    unique_states = len(result)

    print(f"Duration: {duration:.3f}s")
    print(f"Total shots: {total_shots}")
    print(f"Unique states: {unique_states}")
    print(f"VRAM delta: {vram_after['used_mib'] - vram_before['used_mib']} MiB")
    print(f"Temp delta: {vram_after['temp_c'] - vram_before['temp_c']:.1f}°C")

    return {
        "num_qubits": num_qubits,
        "shots": shots,
        "duration_s": round(duration, 3),
        "total_shots": total_shots,
        "unique_states": unique_states,
        "vram_before_mib": vram_before["used_mib"],
        "vram_after_mib": vram_after["used_mib"],
        "vram_delta_mib": vram_after["used_mib"] - vram_before["used_mib"],
        "temp_before_c": vram_before["temp_c"],
        "temp_after_c": vram_after["temp_c"],
        "target": cudaq.get_target().name
    }


def main():
    print("=" * 60)
    print("CUDA-Q GPU Test Suite for GTX 1650")
    print("=" * 60)

    print(f"\nCUDA-Q Version: {cudaq.__version__}")
    print(f"Current Target: {cudaq.get_target().name}")

    # Get GPU info
    vram_info = get_vram_usage()
    print(f"\nGPU Status:")
    print(f"  VRAM: {vram_info['used_mib']} / {vram_info['total_mib']} MiB")
    print(f"  Temperature: {vram_info['temp_c']}°C")
    print(f"  Available VRAM: {vram_info['total_mib'] - vram_info['used_mib']} MiB")

    # Run test suite
    results = []

    # Test 1: Small circuit (10 qubits, 512 shots)
    results.append(test_qaoa_circuit(num_qubits=10, shots=512))

    # Test 2: Medium circuit (16 qubits, 512 shots) - matching mycelial topology
    results.append(test_qaoa_circuit(num_qubits=16, shots=512))

    # Test 3: Larger circuit (20 qubits, 256 shots) - stress test
    results.append(test_qaoa_circuit(num_qubits=20, shots=256))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    max_vram = max(r["vram_after_mib"] for r in results)
    max_temp = max(r["temp_after_c"] for r in results)
    total_duration = sum(r["duration_s"] for r in results)

    print(f"Peak VRAM usage: {max_vram} MiB / 4096 MiB ({max_vram/4096*100:.1f}%)")
    print(f"Peak temperature: {max_temp}°C (threshold: 89.6°C)")
    print(f"Total execution time: {total_duration:.2f}s")
    print(f"Target backend: {results[0]['target']}")

    # Generate report
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cuda_q_version": str(cudaq.__version__),
        "target": cudaq.get_target().name,
        "gpu": "NVIDIA GeForce GTX 1650",
        "vram_total_mib": vram_info["total_mib"],
        "peak_vram_mib": max_vram,
        "peak_temp_c": max_temp,
        "total_duration_s": round(total_duration, 3),
        "tests": results,
        "status": "PASS" if max_vram < 4096 and max_temp < 89.6 else "WARN"
    }

    print(f"\nStatus: {report['status']}")

    # Save report
    output_file = "/home/diamondnode/diamond-node/reports/cudaq_gpu_test.json"
    import pathlib
    pathlib.Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nReport saved to: {output_file}")

    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    exit(main())
