#!/bin/bash
# AppSignal Deployment Script
# Configures AppSignal monitoring and deploys diamond-node Worker

set -e

echo "🔧 AppSignal Deployment"
echo "======================="
echo ""

# AppSignal API Key (provided)
APPSIGNAL_KEY="405f98ac-80ac-4e47-a743-a948f4115088"

echo "✅ AppSignal API Key: ${APPSIGNAL_KEY:0:8}...${APPSIGNAL_KEY: -8}"
echo ""

# Check if Wrangler is authenticated
echo "Checking Wrangler authentication..."
if npx wrangler whoami 2>&1 | grep -q "You are not authenticated"; then
    echo "❌ Wrangler not authenticated"
    echo ""
    echo "To authenticate Wrangler:"
    echo "  1. Run: npx wrangler login"
    echo "  2. Follow browser authentication flow"
    echo "  3. Re-run this script"
    echo ""
    echo "OR set CLOUDFLARE_API_TOKEN:"
    echo "  export CLOUDFLARE_API_TOKEN=your-token"
    echo "  Get token: https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    exit 1
fi

echo "✅ Wrangler authenticated"
echo ""

# Configure AppSignal secret
echo "Configuring AppSignal secret..."
echo "$APPSIGNAL_KEY" | npx wrangler secret put APPSIGNAL_KEY

echo "✅ AppSignal secret configured"
echo ""

# Deploy Worker
echo "Deploying diamond-node Worker..."
cd ~/diamond-node
npm run deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "======================="
echo "Verification"
echo "======================="
echo ""

# Get deployment URL
DEPLOY_URL=$(npx wrangler deployments list 2>/dev/null | grep "https://" | head -1 | awk '{print $1}')

if [ -z "$DEPLOY_URL" ]; then
    DEPLOY_URL="https://dn.genesisconductor.io"
fi

echo "Worker URL: $DEPLOY_URL"
echo ""

# Check monitoring status
echo "Checking monitoring status..."
curl -s "$DEPLOY_URL/.well-known/diamond-node.json" | jq '.monitoring, .version' || echo "Could not verify (check URL manually)"

echo ""
echo "======================="
echo "Next Steps"
echo "======================="
echo ""
echo "1. Visit AppSignal dashboard:"
echo "   https://appsignal.com"
echo ""
echo "2. Check for incoming data:"
echo "   - Errors: https://appsignal.com/[org]/diamond-node/errors"
echo "   - Performance: https://appsignal.com/[org]/diamond-node/performance"
echo ""
echo "3. Generate test traffic:"
echo "   curl $DEPLOY_URL/healthz"
echo "   curl $DEPLOY_URL/.well-known/diamond-node.json"
echo ""
echo "4. Configure alerts (recommended):"
echo "   - Error rate > 5%"
echo "   - P95 response time > 1000ms"
echo ""
echo "✅ AppSignal monitoring is now active!"
echo ""
