import type { Env } from "./types.js";
import { handleHealth } from "./health.js";
import { handleAuditReplay } from "./audit.js";

const WELL_KNOWN_TEMPLATE = {
  node_id: "diamond-node",
  deploy_url: "https://dn.genesisconductor.io",
  repo: "https://github.com/Genesis-Conductor-Engine/diamond-node",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/healthz" || pathname === "/health") {
      return handleHealth(request, env, ctx);
    }

    if (pathname === "/audit/replay") {
      return handleAuditReplay(request);
    }

    if (pathname === "/.well-known/diamond-node.json") {
      return Response.json({
        ...WELL_KNOWN_TEMPLATE,
        key_id: env.KEY_ID ?? "dn-2026-05",
        identity_pubkey: env.DIAMOND_NODE_ED25519_PUB ?? "",
        version: env.NODE_VERSION ?? "0.1.0",
        ts: new Date().toISOString(),
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
