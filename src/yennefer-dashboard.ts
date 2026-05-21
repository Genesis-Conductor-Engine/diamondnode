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
        
        /* Agent State UI Additions */
        .agent-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .agent-status-container {
            text-align: center;
            padding: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 15px;
            animation: pulse 2s infinite;
        }
        
        .status-badge.idle { background: #2ecc71; color: white; }
        .status-badge.thinking { background: #3498db; color: white; }
        .status-badge.executing { background: #9b59b6; color: white; }
        .status-badge.active { background: #f39c12; color: white; }
        
        .status-activity {
            color: #b8a3d4;
            font-size: 1.1rem;
        }
        
        .connections-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
        }
        
        .connection-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        }
        
        .connection-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .connection-indicator.connected { 
            background: #2ecc71; 
            animation: pulse 2s infinite; 
        }
        .connection-indicator.disconnected { background: #e74c3c; }
        
        .actions-timeline {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .action-item {
            padding: 10px;
            margin-bottom: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-left: 3px solid #9b59b6;
            border-radius: 4px;
        }
        
        .action-timestamp {
            color: #b8a3d4;
            font-size: 0.85rem;
        }
        
        .action-result.success { color: #2ecc71; }
        .action-result.error { color: #e74c3c; }
        
        .live-metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 15px;
        }
        
        .live-metric {
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            border-radius: 6px;
            text-align: center;
        }
        
        .live-metric-label {
            font-size: 0.75rem;
            color: #b8a3d4;
            margin-bottom: 5px;
        }
        
        .live-metric-value {
            font-size: 1.3rem;
            font-weight: bold;
            color: #9b59b6;
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
        
        <div class="agent-section">
            <div class="card">
                <div class="card-title">🤖 Agent Status</div>
                <div class="agent-status-container">
                    <div class="status-badge idle" id="agentStatus">IDLE</div>
                    <div class="status-activity" id="agentActivity">Waiting for commands...</div>
                </div>
                <div class="live-metrics-grid">
                    <div class="live-metric">
                        <div class="live-metric-label">Total Cycles</div>
                        <div class="live-metric-value" id="totalCycles">0</div>
                    </div>
                    <div class="live-metric">
                        <div class="live-metric-label">Uptime</div>
                        <div class="live-metric-value" id="agentUptime">0h 0m</div>
                    </div>
                    <div class="live-metric">
                        <div class="live-metric-label">Avg Exec Time</div>
                        <div class="live-metric-value" id="avgExecTime">0ms</div>
                    </div>
                    <div class="live-metric">
                        <div class="live-metric-label">Success Rate</div>
                        <div class="live-metric-value" id="successRate">100%</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">📊 Live Connections</div>
                <div class="connections-grid">
                    <div class="connection-item">
                        <span class="connection-indicator disconnected" id="gatewayStatus"></span>
                        <span>Gateway</span>
                    </div>
                    <div class="connection-item">
                        <span class="connection-indicator disconnected" id="claudeStatus"></span>
                        <span>Claude API</span>
                    </div>
                    <div class="connection-item">
                        <span class="connection-indicator disconnected" id="enkgStatus"></span>
                        <span>EnKG Kernel</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-title">⚡ Recent Actions</div>
            <div id="recentActions" class="actions-timeline"></div>
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
        let agentWS = null;
        let agentStartTime = Date.now();
        let totalCycles = 0;
        let successfulCycles = 0;
        let totalExecTime = 0;
        
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
        
        // WebSocket for real-time agent state
        function connectAgentWebSocket() {
            // Determine WebSocket URL based on environment
            let wsUrl;
            if (window.location.hostname.includes('yennefer.quest')) {
                // Production: Use Cloudflare Tunnel endpoint directly
                wsUrl = 'wss://api.yennefer.quest/ws/agent-state';
            } else {
                // Development: Connect to same origin
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                wsUrl = \`\${wsProtocol}//\${window.location.host}/ws/agent-state\`;
            }
            
            agentWS = new WebSocket(wsUrl);
            
            agentWS.onopen = () => {
                addLog('🔗 Connected to agent state stream');
                updateAgentStatus('idle');
            };
            
            agentWS.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleAgentStateUpdate(message);
                } catch (e) {
                    addLog(\`⚠ Failed to parse agent state message: \${e.message}\`, 'warning');
                }
            };
            
            agentWS.onerror = () => {
                addLog('✗ Agent state WebSocket error', 'error');
            };
            
            agentWS.onclose = () => {
                addLog('⚠ Agent state connection closed, reconnecting...', 'warning');
                updateAgentStatus('idle');
                setTimeout(connectAgentWebSocket, 5000);
            };
        }
        
        function handleAgentStateUpdate(message) {
            const { type, data, timestamp } = message;
            
            if (type === 'state_update') {
                updateAgentStatus(data.status);
                updateAgentActivity(data.activity || 'Idle');
                if (data.connections) {
                    updateConnections(data.connections);
                }
            } else if (type === 'activity') {
                updateAgentActivity(data.activity);
            } else if (type === 'action') {
                addRecentAction(data);
            } else if (type === 'metrics') {
                updateLiveMetrics(data);
            }
        }
        
        function updateAgentStatus(status) {
            const badge = document.getElementById('agentStatus');
            badge.textContent = status.toUpperCase();
            badge.className = \`status-badge \${status}\`;
        }
        
        function updateAgentActivity(activity) {
            document.getElementById('agentActivity').textContent = activity;
        }
        
        function updateConnections(connections) {
            document.getElementById('gatewayStatus').className = 
                \`connection-indicator \${connections.gateway || 'disconnected'}\`;
            document.getElementById('claudeStatus').className = 
                \`connection-indicator \${connections.claude || 'disconnected'}\`;
            document.getElementById('enkgStatus').className = 
                \`connection-indicator \${connections.enkg_kernel || 'disconnected'}\`;
        }
        
        function addRecentAction(action) {
            const container = document.getElementById('recentActions');
            const item = document.createElement('div');
            item.className = 'action-item';
            
            const actionTime = action.timestamp ? new Date(action.timestamp) : new Date();
            item.innerHTML = \`
                <div class="action-timestamp">\${actionTime.toLocaleTimeString()}</div>
                <div>\${action.action}</div>
                <div class="action-result \${action.result}">\${action.details}</div>
            \`;
            container.insertBefore(item, container.firstChild);
            
            // Keep only last 5 actions
            while (container.children.length > 5) {
                container.removeChild(container.lastChild);
            }
        }
        
        function updateLiveMetrics(data) {
            if (data.total_cycles !== undefined) {
                document.getElementById('totalCycles').textContent = data.total_cycles;
            }
            if (data.avg_exec_time !== undefined) {
                document.getElementById('avgExecTime').textContent = \`\${data.avg_exec_time.toFixed(0)}ms\`;
            }
            if (data.success_rate !== undefined) {
                document.getElementById('successRate').textContent = \`\${data.success_rate.toFixed(0)}%\`;
            }
        }
        
        function updateUptime() {
            const uptimeMs = Date.now() - agentStartTime;
            const hours = Math.floor(uptimeMs / 3600000);
            const minutes = Math.floor((uptimeMs % 3600000) / 60000);
            document.getElementById('agentUptime').textContent = \`\${hours}h \${minutes}m\`;
        }
        
        // Enhanced orchestration tracking
        async function runOrchestrationEnhanced() {
            const button = document.getElementById('runOrchestration');
            button.disabled = true;
            button.textContent = '⏳ Running...';
            
            updateAgentStatus('executing');
            updateAgentActivity('Running orchestration cycle...');
            
            const startTime = Date.now();
            
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
                const execTime = Date.now() - startTime;
                
                // Update validation state
                document.getElementById('validationState').textContent = result.validation_state;
                document.getElementById('execTime').textContent = \`\${result.execution_time_ms.toFixed(1)}ms\`;
                
                // Track metrics
                totalCycles++;
                successfulCycles++;
                totalExecTime += execTime;
                
                // Update live metrics
                updateLiveMetrics({
                    total_cycles: totalCycles,
                    avg_exec_time: totalExecTime / totalCycles,
                    success_rate: (successfulCycles / totalCycles) * 100
                });
                
                // Add to recent actions
                addRecentAction({
                    action: 'Orchestration Cycle',
                    result: 'success',
                    details: \`Completed in \${execTime}ms - \${result.validation_state}\`,
                    timestamp: new Date().toISOString()
                });
                
                addLog(\`✓ Orchestration complete: \${result.validation_state} in \${result.execution_time_ms.toFixed(1)}ms\`);
                addLog(\`  EnKG: μ=\${result.enkg_output_stats.mean.toFixed(4)}, σ=\${result.enkg_output_stats.std.toFixed(4)}\`);
                addLog(\`  Telemetry: H=\${result.telemetry.hamiltonian.toFixed(2)}, Action=\${result.telemetry.gateway_action}\`);
                
                updateAgentStatus('idle');
                updateAgentActivity('Cycle completed successfully');
                
                // Check connections based on result
                updateConnections({
                    gateway: 'connected',
                    claude: result.validation_state !== 'NULL' ? 'connected' : 'disconnected',
                    enkg_kernel: result.enkg_output_stats ? 'connected' : 'disconnected'
                });
                
                // Refresh metrics after orchestration
                await fetchMetrics();
            } catch (error) {
                totalCycles++;
                
                addLog(\`✗ Orchestration failed: \${error.message}\`, 'error');
                
                addRecentAction({
                    action: 'Orchestration Cycle',
                    result: 'error',
                    details: error.message,
                    timestamp: new Date().toISOString()
                });
                
                updateAgentStatus('idle');
                updateAgentActivity('Error: ' + error.message);
                
                // Update metrics even on failure
                updateLiveMetrics({
                    total_cycles: totalCycles,
                    avg_exec_time: totalExecTime / Math.max(successfulCycles, 1),
                    success_rate: (successfulCycles / totalCycles) * 100
                });
            } finally {
                button.disabled = false;
                button.textContent = '🚀 Run Orchestration Cycle';
            }
        }
        
        // Event listeners (updated)
        document.getElementById('runOrchestration').removeEventListener('click', runOrchestration);
        document.getElementById('runOrchestration').addEventListener('click', runOrchestrationEnhanced);
        document.getElementById('refreshMetrics').addEventListener('click', fetchMetrics);
        document.getElementById('clearLog').addEventListener('click', () => {
            log.innerHTML = '';
            addLog('Log cleared');
        });
        
        // Initialize agent state
        updateConnections({
            gateway: 'disconnected',
            claude: 'disconnected',
            enkg_kernel: 'disconnected'
        });
        
        // Start WebSocket connection (will gracefully fail if endpoint not available)
        connectAgentWebSocket();
        
        // Update uptime every minute
        setInterval(updateUptime, 60000);
        updateUptime();
        
        // Initial load and auto-refresh
        fetchMetrics();
        setInterval(fetchMetrics, 10000);  // Refresh every 10 seconds
        
        addLog('🔮 Yennefer Thermodynamic Consciousness initialized');
        addLog('📡 Connecting to orchestrator...');
    </script>
</body>
</html>
`;
