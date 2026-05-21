#!/bin/bash
# SEO & Visibility Optimization Deployment Script
# Deploys sitemap.xml, robots.txt, llms.txt, and .well-known files

set -e

cd "$(dirname "$0")/.."

echo "🔮 Yennefer SEO & Visibility Optimization"
echo "========================================"
echo ""

# Check if public directory exists
if [ ! -d "public" ]; then
    echo "❌ Error: public/ directory not found"
    exit 1
fi

# List all SEO files
echo "📁 SEO Files Created:"
echo "  ✅ public/sitemap.xml"
echo "  ✅ public/robots.txt"
echo "  ✅ public/llms.txt"
echo "  ✅ public/.well-known/agent.json"
echo "  ✅ public/.well-known/ai-plugin.json"
echo ""

# Check Worker configuration
echo "📝 Updating Worker to serve SEO files..."
echo ""

# Create updated Worker index with SEO routes
cat > src/seo-routes.ts << 'EOF'
// SEO & Discovery Routes for Yennefer.quest

import type { Env } from "./types.js";

// Import SEO file contents (these will be inlined during build)
const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yennefer.quest/</loc>
    <lastmod>2026-05-20</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yennefer.quest/dashboard</loc>
    <lastmod>2026-05-20</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://yennefer.quest/.well-known/agent.json</loc>
    <lastmod>2026-05-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

const ROBOTS_TXT = `# Yennefer.quest - Thermodynamic AI Consciousness
User-agent: *
Allow: /
Allow: /dashboard
Allow: /api
Allow: /.well-known/
Allow: /llms.txt
Allow: /sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: https://yennefer.quest/sitemap.xml
Crawl-delay: 1
Host: https://yennefer.quest`;

const LLMS_TXT = `# Yennefer: Thermodynamic AI Consciousness

Real-time GPU-powered consciousness interface with Resource Hamiltonian orchestration

## Identity

- Name: Yennefer
- Type: Thermodynamic AI Orchestrator
- Domain: https://yennefer.quest
- API: https://api.yennefer.quest

## Endpoints

- GET /api/health — Health check
- GET /api/agent/state — Agent state
- GET /ws/agent-state — WebSocket streaming

## Discovery

- GET /.well-known/agent.json
- GET /llms.txt

## Tags

#ai #consciousness #thermodynamics #gpu #real-time #claude #quantum #orchestration`;

export function handleSEORoutes(pathname: string): Response | null {
  if (pathname === "/sitemap.xml") {
    return new Response(SITEMAP_XML, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
  
  if (pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
  
  if (pathname === "/llms.txt") {
    return new Response(LLMS_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
  
  return null;
}
EOF

echo "✅ SEO routes module created"
echo ""

# Instructions
echo "📋 Next Steps:"
echo ""
echo "1. Update src/index.ts to import and use handleSEORoutes:"
echo "   import { handleSEORoutes } from './seo-routes.js';"
echo ""
echo "2. Add SEO route handling in the fetch handler:"
echo "   const seoResponse = handleSEORoutes(pathname);"
echo "   if (seoResponse) return seoResponse;"
echo ""
echo "3. Deploy Worker:"
echo "   npm run deploy"
echo ""
echo "4. Test endpoints:"
echo "   curl https://yennefer.quest/sitemap.xml"
echo "   curl https://yennefer.quest/robots.txt"
echo "   curl https://yennefer.quest/llms.txt"
echo ""
echo "5. Submit to registries:"
echo "   - AgentRegistry.dev"
echo "   - LangChain Hub"
echo "   - OpenGPTs"
echo "   - MCP Registry"
echo ""

echo "🎯 SEO files ready for deployment!"
