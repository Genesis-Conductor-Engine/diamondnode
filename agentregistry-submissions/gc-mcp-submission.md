# AgentRegistry Submission: gc-mcp

## Server Information

**Name:** gc-mcp  
**Display Name:** Ground Control MCP Server  
**Version:** 1.0.0  
**Author:** Optimization Inversion / Genesis Conductor  
**License:** PROPRIETARY  
**Category:** Orchestration  
**Pricing:** Free (for approved users)  
**Availability:** Public with authentication

## Description

Ground Control MCP Server provides multi-agent task dispatch, Notion soul-capsule integration, and claw propagation capabilities via the Model Context Protocol.

### Key Features
- Multi-Agent Orchestration: Dispatch tasks to Codex and Claude Opus agents
- Notion Integration: Offload session context to Notion soul-capsule database
- Alert Propagation: Broadcast to Slack, Telegram, and custom claw endpoints
- GPU Monitoring: Integrates with Diamond Gateway for VRAM orchestration
- Ising Hamiltonian: H(s) for intelligent VRAM threshold management

## Protocol Compliance

- MCP Protocol Version: 2025-03-26
- Transport: Streamable HTTP (recommended), SSE (legacy)
- JSON-RPC: 2.0
- CORS: Enabled

## Endpoints

Production: https://api.optimizationinversion.com/mcp
Development: https://gc-mcp.iholt.workers.dev/mcp

## Capabilities: 5 Tools

1. submit_hybrid_task - Dispatch Codex agent tasks
2. submit_opus_notion_task - Dispatch Claude+Notion tasks  
3. submit_opus_task - Dispatch Claude Opus tasks
4. offload_to_notion - Offload session context
5. propagate_to_claws - Propagate to endpoints

## Tags

mcp, model-context-protocol, multi-agent, orchestration, gpu-monitoring
