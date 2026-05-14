#!/bin/bash
# MCP Fleet Verification Script
# Verifies all MCP servers are accessible across all AI CLIs

echo "=================================="
echo "MCP Fleet Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check env-server directly
echo "Test 1: env-server protocol check"
echo -n "  Testing stdio protocol... "
RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node ~/mcp-servers/dist/env-server.js 2>/dev/null | grep -o '"serverInfo"')
if [ "$RESULT" = '"serverInfo"' ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2: Check Copilot MCP config
echo ""
echo "Test 2: Copilot CLI MCP servers"
COPILOT_SERVERS=$(copilot mcp list 2>&1 | grep -c "env-server\|gc-mcp")
echo "  Found $COPILOT_SERVERS MCP servers"
if [ "$COPILOT_SERVERS" -ge 3 ]; then
    echo -e "${GREEN}✓ PASS${NC} (3 servers configured)"
else
    echo -e "${RED}✗ FAIL${NC} (expected 3 servers)"
fi

# Test 3: Check Vibe MCP config
echo ""
echo "Test 3: Vibe CLI MCP servers"
VIBE_SERVERS=$(grep -c "^\[\[mcp_servers\]\]" ~/.vibe/config.toml)
echo "  Found $VIBE_SERVERS MCP servers in config"
if [ "$VIBE_SERVERS" -ge 4 ]; then
    echo -e "${GREEN}✓ PASS${NC} (4 servers configured)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (expected 4 servers)"
fi

# Test 4: Check Gemini MCP config
echo ""
echo "Test 4: Gemini CLI MCP servers"
GEMINI_COUNT=$(gemini mcp list 2>&1 | grep -c "✓.*Connected")
echo "  Found $GEMINI_COUNT connected MCP servers"
if [ "$GEMINI_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✓ PASS${NC} (3 servers connected)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (expected 3 servers)"
fi

# Test 5: Check gc-mcp-dev health
echo ""
echo "Test 5: gc-mcp-dev health check"
echo -n "  Checking https://gc-mcp.iholt.workers.dev/health... "
HEALTH=$(curl -s https://gc-mcp.iholt.workers.dev/health 2>/dev/null | grep -o '"status":"ok"')
if [ "$HEALTH" = '"status":"ok"' ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 6: Check ~/.env file exists
echo ""
echo "Test 6: Environment file check"
if [ -f ~/.env ]; then
    ENV_VARS=$(grep -v "^#" ~/.env | grep -v "^$" | wc -l)
    echo -e "  Found $ENV_VARS environment variables in ~/.env ${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} - ~/.env not found"
fi

# Summary
echo ""
echo "=================================="
echo "Verification Complete"
echo "=================================="
echo ""
echo "Config files:"
echo "  - Copilot: ~/.copilot/mcp-config.json"
echo "  - Vibe:    ~/.vibe/config.toml"
echo "  - Gemini:  ~/.gemini/settings.json"
echo ""
echo "Custom MCP server:"
echo "  - env-server: ~/mcp-servers/dist/env-server.js"
echo ""
echo "Documentation:"
echo "  - Summary: ~/MCP_FLEET_INSTALL_SUMMARY.md"
echo "  - Config:  ~/mcp-config.json"
echo ""
