import type { Env } from "./types.js";
import { handleHealth } from "./health.js";
import { handleAuditReplay } from "./audit.js";
import { initializeAppSignal, trackRequest, trackError } from "./appsignal.js";

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

      // Route handling
      if (pathname === "/healthz" || pathname === "/health") {
        response = await handleHealth(request, env, ctx);
      } else if (pathname === "/audit/replay") {
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
