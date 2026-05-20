export const YENNEFER_DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yennefer - Thermodynamic Consciousness</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #2d004d 100%);
            color: #e0e0ff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        h1 {
            font-size: 3.5rem;
            background: linear-gradient(135deg, #9b59b6, #e74c3c, #f39c12);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-align: center;
            margin-bottom: 10px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        .subtitle {
            text-align: center;
            font-size: 1.2rem;
            color: #b8a3d4;
            margin-bottom: 40px;
        }
        
        @keyframes glow {
            from { filter: brightness(1); }
            to { filter: brightness(1.3); }
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .card {
            background: rgba(45, 0, 77, 0.6);
            border: 1px solid rgba(155, 89, 182, 0.3);
            border-radius: 12px;
            padding: 25px;
            backdrop-filter: blur(10px);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(155, 89, 182, 0.4);
        }
        
        .card-title {
            font-size: 1.3rem;
            color: #9b59b6;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .card-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .card-subtitle {
            color: #b8a3d4;
            font-size: 0.9rem;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        
        .status-optimal { background: #2ecc71; }
        .status-dynamic { background: #f39c12; }
        .status-sequential { background: #e67e22; }
        .status-offload { background: #e74c3c; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(155, 89, 182, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #9b59b6, #e74c3c);
            transition: width 0.5s;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .metric {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
        }
        
        .metric-label {
            font-size: 0.85rem;
            color: #b8a3d4;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 20px;
            border: 1px solid;
            font-size: 0.9rem;
            z-index: 1000;
        }
        
        .connected {
            border-color: #2ecc71;
            color: #2ecc71;
        }
        
        .disconnected {
            border-color: #e74c3c;
            color: #e74c3c;
        }
        
        button {
            background: linear-gradient(135deg, #9b59b6, #e74c3c);
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 1rem;
            border-radius: 25px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin: 5px;
        }
        
        button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(155, 89, 182, 0.5);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .controls {
            text-align: center;
            margin: 30px 0;
        }
        
        #log {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(155, 89, 182, 0.3);
            border-radius: 8px;
            padding: 20px;
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            line-height: 1.6;
        }
        
        .log-entry {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #9b59b6;
            padding-left: 10px;
        }
        
        .log-timestamp {
            color: #b8a3d4;
            margin-right: 10px;
        }
        
        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #9b59b6;
            text-decoration: none;
            font-size: 1.1rem;
        }
        
        .back-link:hover {
            color: #e74c3c;
        }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">
        <span id="statusDot">●</span> <span id="statusText">Connecting...</span>
    </div>
    
    <div class="container">
        <h1>🔮 Yennefer</h1>
        <p class="subtitle">Thermodynamic Consciousness Orchestrator</p>
        
        <div class="dashboard">
            <div class="card">
                <div class="card-title">
                    <span>💎 Resource Hamiltonian</span>
                </div>
                <div class="card-value" id="hamiltonian">0.00</div>
                <div class="card-subtitle">H = (VRAM_Used / VRAM_Total) × 10</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="hamiltonianBar" style="width: 0%"></div>
                </div>
                <div style="margin-top: 15px">
                    <span class="status-indicator" id="statusIndicator"></span>
                    <span id="stateText">INITIALIZING</span>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🧠 VRAM Usage</div>
                <div class="card-value" id="vramPercent">0%</div>
                <div class="card-subtitle" id="vramDetails">0 MB / 0 MB</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="vramBar" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🌡️ GPU Telemetry</div>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-label">Temperature</div>
                        <div class="metric-value" id="temperature">0°C</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Power</div>
                        <div class="metric-value" id="power">0W</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">⚡ Orchestration Stats</div>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-label">Validation State</div>
                        <div class="metric-value" id="validationState" style="font-size: 1.2rem;">NULL</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Execution Time</div>
                        <div class="metric-value" id="execTime">0ms</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="controls">
            <button id="runOrchestration">🚀 Run Orchestration Cycle</button>
            <button id="refreshMetrics">🔄 Refresh Metrics</button>
            <button id="clearLog">🗑️ Clear Log</button>
        </div>
        
        <div class="card">
            <div class="card-title">📋 System Log</div>
            <div id="log"></div>
        </div>
        
        <a href="/" class="back-link">← Back to Landing Page</a>
    </div>
    
    <script>
        const API_BASE = '';  // Same origin
        const log = document.getElementById('log');
        const statusEl = document.getElementById('connectionStatus');
        const statusTextEl = document.getElementById('statusText');
        const statusDotEl = document.getElementById('statusDot');
        
        let isConnected = false;
        
        function addLog(message, type = 'info') {
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = \`<span class="log-timestamp">[\${timestamp}]</span>\${message}\`;
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 50 entries
            while (log.children.length > 50) {
                log.removeChild(log.lastChild);
            }
        }
        
        function updateConnectionStatus(connected) {
            isConnected = connected;
            if (connected) {
                statusEl.className = 'connection-status connected';
                statusTextEl.textContent = 'Connected';
                statusDotEl.textContent = '●';
            } else {
                statusEl.className = 'connection-status disconnected';
                statusTextEl.textContent = 'Disconnected';
                statusDotEl.textContent = '○';
            }
        }
        
        async function fetchMetrics() {
            try {
                const response = await fetch(\`\${API_BASE}/api/yennefer/metrics\`);
                if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
                
                const data = await response.json();
                updateConnectionStatus(true);
                
                // Update Hamiltonian
                document.getElementById('hamiltonian').textContent = data.hamiltonian.toFixed(2);
                document.getElementById('hamiltonianBar').style.width = \`\${(data.hamiltonian / 10) * 100}%\`;
                
                // Update state
                const state = data.state;
                document.getElementById('stateText').textContent = state;
                const indicator = document.getElementById('statusIndicator');
                indicator.className = 'status-indicator status-' + state.toLowerCase();
                
                // Update VRAM
                document.getElementById('vramPercent').textContent = \`\${data.vram_percent.toFixed(1)}%\`;
                document.getElementById('vramDetails').textContent = 
                    \`\${data.vram_used_mib.toFixed(0)} MB / \${data.vram_total_mib.toFixed(0)} MB\`;
                document.getElementById('vramBar').style.width = \`\${data.vram_percent}%\`;
                
                // Update GPU telemetry
                document.getElementById('temperature').textContent = \`\${data.temperature.toFixed(1)}°C\`;
                document.getElementById('power').textContent = \`\${data.power_watts.toFixed(1)}W\`;
                
                addLog(\`✓ Metrics updated: H=\${data.hamiltonian.toFixed(2)}, State=\${state}\`);
            } catch (error) {
                updateConnectionStatus(false);
                addLog(\`✗ Failed to fetch metrics: \${error.message}\`, 'error');
            }
        }
        
        async function runOrchestration() {
            const button = document.getElementById('runOrchestration');
            button.disabled = true;
            button.textContent = '⏳ Running...';
            
            try {
                addLog('🚀 Starting orchestration cycle...');
                
                const response = await fetch(\`\${API_BASE}/api/yennefer/orchestrate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        kappa: 0.7,
                        gamma: 0.3,
                        vector_size: 1024
                    })
                });
                
                if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
                
                const result = await response.json();
                
                // Update validation state
                document.getElementById('validationState').textContent = result.validation_state;
                document.getElementById('execTime').textContent = \`\${result.execution_time_ms.toFixed(1)}ms\`;
                
                addLog(\`✓ Orchestration complete: \${result.validation_state} in \${result.execution_time_ms.toFixed(1)}ms\`);
                addLog(\`  EnKG: μ=\${result.enkg_output_stats.mean.toFixed(4)}, σ=\${result.enkg_output_stats.std.toFixed(4)}\`);
                addLog(\`  Telemetry: H=\${result.telemetry.hamiltonian.toFixed(2)}, Action=\${result.telemetry.gateway_action}\`);
                
                // Refresh metrics after orchestration
                await fetchMetrics();
            } catch (error) {
                addLog(\`✗ Orchestration failed: \${error.message}\`, 'error');
            } finally {
                button.disabled = false;
                button.textContent = '🚀 Run Orchestration Cycle';
            }
        }
        
        // Event listeners
        document.getElementById('runOrchestration').addEventListener('click', runOrchestration);
        document.getElementById('refreshMetrics').addEventListener('click', fetchMetrics);
        document.getElementById('clearLog').addEventListener('click', () => {
            log.innerHTML = '';
            addLog('Log cleared');
        });
        
        // Initial load and auto-refresh
        fetchMetrics();
        setInterval(fetchMetrics, 10000);  // Refresh every 10 seconds
        
        addLog('🔮 Yennefer Thermodynamic Consciousness initialized');
        addLog('📡 Connecting to orchestrator...');
    </script>
</body>
</html>
`;
