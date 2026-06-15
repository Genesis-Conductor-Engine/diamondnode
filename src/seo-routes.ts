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

const AGENT_JSON = `{
  "name": "Yennefer",
  "type": "Thermodynamic AI Orchestrator",
  "domain": "https://yennefer.quest",
  "api": "https://api.yennefer.quest",
  "endpoints": {
    "health": "GET /api/health",
    "agent_state": "GET /api/agent/state",
    "agent_stream": "GET /ws/agent-state"
  },
  "discovery": ["/.well-known/agent.json", "/llms.txt"],
  "tags": ["ai", "consciousness", "thermodynamics", "gpu", "real-time", "claude", "quantum", "orchestration"]
}`;

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
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  
  if (pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  
  if (pathname === "/llms.txt") {
    return new Response(LLMS_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  
  if (pathname === "/.well-known/agent.json") {
    return new Response(AGENT_JSON, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  
  return null;
}
