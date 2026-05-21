import type { Env } from "./types.js";
import { handleHealth } from "./health.js";
import { handleAuditReplay } from "./audit.js";
import { initializeAppSignal, trackRequest, trackError } from "./appsignal.js";
import {
  handleNotionHealth,
  handleNotionOffload,
  handleNotionEmbed,
  handleNotionQuery,
  handleNotionSearch,
} from "./notion.js";
import { checkAndBlockBot } from "./botid.js";
import { LANDING_HTML } from "./landing-html.js";
import { YENNEFER_DASHBOARD_HTML } from "./yennefer-dashboard.js";
import { handleSEORoutes } from "./seo-routes.js";

const WELL_KNOWN_TEMPLATE = {
  node_id: "diamond-node",
  deploy_url: "https://dn.genesisconductor.io",
  repo: "https://github.com/Genesis-Conductor-Engine/diamond-node",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const { pathname } = new URL(request.url);
    
    // Initialize AppSignal if API key is provided
    const appsignal = env.APPSIGNAL_KEY 
      ? initializeAppSignal(env.APPSIGNAL_KEY, env.NODE_VERSION)
      : null;

    try {
      let response: Response;

      // Check for SEO routes first (sitemap.xml, robots.txt, llms.txt)
      const seoResponse = handleSEORoutes(pathname);
      if (seoResponse) {
        return seoResponse;
      }

      // Route handling
      if (pathname === "/") {
        // Serve landing page at root
        response = new Response(LANDING_HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } else if (pathname === "/dashboard" || pathname === "/yennefer") {
        // Serve Yennefer dashboard
        response = new Response(YENNEFER_DASHBOARD_HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        });
      } else if (pathname === "/api/yennefer/metrics") {
        // Proxy to local Yennefer orchestrator (via Cloudflare Tunnel)
        const YENNEFER_API = env.YENNEFER_API_URL || "http://localhost:8080";
        try {
          const proxyResponse = await fetch(`${YENNEFER_API}/api/vram`, {
            headers: {
              "Authorization": env.GATEWAY_SECRET ? `Bearer ${env.GATEWAY_SECRET}` : "",
            },
          });
          response = new Response(await proxyResponse.text(), {
            status: proxyResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (error) {
          response = Response.json({ error: "Yennefer orchestrator unavailable", message: String(error) }, { status: 503 });
        }
      } else if (pathname === "/api/yennefer/orchestrate" && request.method === "POST") {
        // Proxy orchestration requests to local Yennefer
        const YENNEFER_API = env.YENNEFER_API_URL || "http://localhost:8080";
        try {
          const body = await request.text();
          const proxyResponse = await fetch(`${YENNEFER_API}/v1/yennefer`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": env.GATEWAY_SECRET ? `Bearer ${env.GATEWAY_SECRET}` : "",
            },
            body,
          });
          response = new Response(await proxyResponse.text(), {
            status: proxyResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (error) {
          response = Response.json({ error: "Yennefer orchestration failed", message: String(error) }, { status: 503 });
        }
      } else if (pathname === "/api/agent/state") {
        // Proxy agent state API to orchestrator
        const YENNEFER_API = env.YENNEFER_API_URL || "http://localhost:8080";
        try {
          const proxyResponse = await fetch(`${YENNEFER_API}/api/agent/state`, {
            headers: {
              "Authorization": env.GATEWAY_SECRET ? `Bearer ${env.GATEWAY_SECRET}` : "",
            },
          });
          response = new Response(await proxyResponse.text(), {
            status: proxyResponse.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache",
            },
          });
        } catch (error) {
          response = Response.json({ 
            error: "Agent state unavailable", 
            message: String(error) 
          }, { status: 503 });
        }
      } else if (pathname === "/ws/agent-state") {
        // WebSocket upgrade for agent state
        // Note: CF Workers WebSocket support requires special handling
        // For production, use Cloudflare Tunnel at api.yennefer.quest
        const upgradeHeader = request.headers.get("Upgrade");
        if (upgradeHeader !== "websocket") {
          return new Response("Expected Upgrade: websocket", { status: 426 });
        }
        
        // Return instructions for direct tunnel connection
        response = Response.json({
          error: "WebSocket proxying not supported through Worker",
          message: "For WebSocket connections, connect directly to wss://api.yennefer.quest/ws/agent-state (via Cloudflare Tunnel)",
          fallback: "Use REST API at /api/agent/state for polling",
        }, { status: 501 });
      } else if (pathname === "/healthz" || pathname === "/health") {
        // Basic bot protection for health endpoint
        const botBlock = await checkAndBlockBot(request, "basic");
        if (botBlock) return botBlock;
        
        response = await handleHealth(request, env, ctx);
      } else if (pathname === "/audit/replay") {
        // Deep bot protection for audit endpoint
        const botBlock = await checkAndBlockBot(request, "deepAnalysis");
        if (botBlock) return botBlock;
        
        response = await handleAuditReplay(request);
      } else if (pathname === "/.well-known/diamond-node.json") {
        response = Response.json({
          ...WELL_KNOWN_TEMPLATE,
          key_id: env.KEY_ID ?? "dn-2026-05",
          identity_pubkey: env.DIAMOND_NODE_ED25519_PUB ?? "",
          version: env.NODE_VERSION ?? "0.1.0",
          ts: new Date().toISOString(),
          monitoring: env.APPSIGNAL_KEY ? "enabled" : "disabled",
        });
      } else if (pathname === "/notion/health" || pathname === "/notion/healthz") {
        // Basic bot protection for notion health
        const botBlock = await checkAndBlockBot(request, "basic");
        if (botBlock) return botBlock;
        
        response = await handleNotionHealth(request, env);
      } else if (pathname === "/notion/offload" && request.method === "POST") {
        // Deep bot protection for notion API endpoints
        const botBlock = await checkAndBlockBot(request, "deepAnalysis");
        if (botBlock) return botBlock;
        
        response = await handleNotionOffload(request, env);
      } else if (pathname === "/notion/embed" && request.method === "POST") {
        // Deep bot protection for notion API endpoints
        const botBlock = await checkAndBlockBot(request, "deepAnalysis");
        if (botBlock) return botBlock;
        
        response = await handleNotionEmbed(request, env);
      } else if (pathname === "/notion/query" && request.method === "POST") {
        // Deep bot protection for notion API endpoints
        const botBlock = await checkAndBlockBot(request, "deepAnalysis");
        if (botBlock) return botBlock;
        
        response = await handleNotionQuery(request, env);
      } else if (pathname === "/notion/search" && request.method === "POST") {
        // Deep bot protection for notion API endpoints
        const botBlock = await checkAndBlockBot(request, "deepAnalysis");
        if (botBlock) return botBlock;
        
        response = await handleNotionSearch(request, env);
      } else if (pathname === "/v1/identity") {
        // Identity endpoint - public key + node identity
        response = Response.json({
          node_id: env.NODE_ID ?? "diamond-node",
          version: env.NODE_VERSION ?? "0.1.0",
          region: "global",
          capabilities: ["sign", "attest", "ccip-read"],
          identity_pubkey: env.DIAMOND_NODE_ED25519_PUB ?? "",
          key_id: env.KEY_ID ?? "dn-2026-05",
          ts: new Date().toISOString(),
        });
      } else if (pathname === "/.well-known/agent.json") {
        // A2A Protocol agent manifest
        response = Response.json({
          schema_version: "1.0",
          name: "YENNEFER",
          description: "Diamond Node AI orchestration agent with GPU-backed inference and blockchain attestation",
          homepage_url: "https://yennefer.quest",
          contact_email: "node@genesisconductor.io",
          legal_info_url: "https://genesisconductor.io/legal",
          capabilities: {
            inference: ["claude-opus", "yolo11", "embedding"],
            attestation: ["ed25519-signature", "blockchain-anchor"],
            orchestration: ["resource-hamiltonian", "qubo-optimization"],
          },
          endpoints: {
            identity: "https://yennefer.quest/v1/identity",
            health: "https://yennefer.quest/health",
            sign: "https://yennefer.quest/v1/sign",
          },
          version: env.NODE_VERSION ?? "0.1.0",
          node_id: env.NODE_ID ?? "diamond-node",
        });
      } else if (pathname === "/.well-known/ai-plugin.json") {
        // OpenAI plugin manifest
        response = Response.json({
          schema_version: "v1",
          name_for_human: "YENNEFER Agent",
          name_for_model: "yennefer",
          description_for_human: "AI orchestration with GPU inference and blockchain attestation",
          description_for_model: "Access to Diamond Node GPU-backed AI inference (Claude, YOLO11), QUBO optimization, and Ed25519 signing/attestation capabilities",
          auth: {
            type: "none",
          },
          api: {
            type: "openapi",
            url: "https://yennefer.quest/openapi.json",
          },
          logo_url: "https://yennefer.quest/logo.png",
          contact_email: "node@genesisconductor.io",
          legal_info_url: "https://genesisconductor.io/legal",
        });
      } else {
        response = new Response("Not Found", { status: 404 });
      }
      
      // Track request metrics if AppSignal is enabled
      if (appsignal) {
        const duration = Date.now() - startTime;
        trackRequest(appsignal, request, response, duration);
      }
      
      return response;
    } catch (error) {
      // Track error if AppSignal is enabled
      if (appsignal) {
        trackError(appsignal, error as Error, {
          method: request.method,
          path: pathname,
          url: request.url,
        });
      }
      
      console.error("Request error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

// Durable Objects class - required for existing DO bindings
export class NodeStateDO {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    return new Response("Not Implemented", { status: 501 });
  }
}
