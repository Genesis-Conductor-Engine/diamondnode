import cudaq
import json

cudaq.set_target('qpp-cpu')

@cudaq.kernel
def bell_probe():
    q = cudaq.qubit()
    h(q)
    mz(q)

r = cudaq.sample(bell_probe, shots_count=256)

# SampleResult.items() yields (bitstring, count) pairs
counts = {k: v for k, v in r.items()}
total = r.get_total_shots()
print(json.dumps({'total': total, 'counts': counts}))
