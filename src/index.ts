import type { Env, RadixAttentionClaim, DiamondNodeManifest } from "./types.js";
import { handleHealth } from "./health.js";
import { handleAuditReplay } from "./audit.js";
import { initializeAppSignal, trackRequest, trackError } from "./appsignal.js";
import { makeEvent, signEvent, signRadixClaim } from "./identity.js";
import { appendAudit } from "./audit.js";
import { arbitratePowerTower } from "./power-tower.js";
import {
  handleNotionHealth,
  handleNotionOffload,
  handleNotionEmbed,
  handleNotionQuery,
  handleNotionSearch,
} from "./notion.js";
import { handleSEORoutes } from "./seo-routes.js";
import { LANDING_HTML } from "./landing-html.js";
import { YENNEFER_DASHBOARD_HTML } from "./yennefer-dashboard.js";

// Central bearer gate for mutating Notion proxy routes. Routes stay 503 until the
// secret is provisioned — never silently open (no-public-endpoint-without-auth gate).
function requireGatewayAuth(request: Request, env: Env): Response | null {
  if (!env.GATEWAY_AUTH_SECRET) {
    return Response.json({ error: "not_configured", detail: "GATEWAY_AUTH_SECRET unset" }, { status: 503 });
  }
  if (request.headers.get("Authorization") !== `Bearer ${env.GATEWAY_AUTH_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

const WELL_KNOWN_TEMPLATE = {
  node_id: "diamond-node",
  deploy_url: "https://dn.genesisconductor.io",
  repo: "https://github.com/Genesis-Conductor-Engine/diamond-node",
};

// v0.3 in-memory cache for latest signed radix claims (populated by U_Q worker POSTs)
let latestRadixClaims: RadixAttentionClaim[] = [];
let latestPowerTower: any = null;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const { pathname } = new URL(request.url);

    const appsignal = env.APPSIGNAL_KEY
      ? initializeAppSignal(env.APPSIGNAL_KEY, env.NODE_VERSION)
      : null;

    try {
      let response: Response;

      if (pathname === "/healthz" || pathname === "/health") {
        response = await handleHealth(request, env, ctx);
      } else if (pathname === "/audit/replay") {
        response = await handleAuditReplay(request);
      } else if (pathname === "/.well-known/diamond-node.json") {
        const manifest: DiamondNodeManifest = {
          ...WELL_KNOWN_TEMPLATE,
          key_id: env.KEY_ID ?? "dn-2026-05",
          identity_pubkey: env.DIAMOND_NODE_ED25519_PUB ?? "",
          version: env.NODE_VERSION ?? "0.3.0-iqg",
          ts: new Date().toISOString(),
          monitoring: env.APPSIGNAL_KEY ? "enabled" : "disabled",
          radix_attention_claims: latestRadixClaims.length > 0 ? latestRadixClaims : undefined,
          latest_power_tower: latestPowerTower ?? undefined,
        };
        response = Response.json(manifest);

      // v0.3.1: Deterministic power-tower arbitration (ported from unified_inference/optimizer.py).
      // Caller telemetry is captured under inputs/telemetry_used, never spread into the
      // signed decision — the attestation covers only node-computed values.
      } else if (pathname === "/uq/power_tower" && request.method === "POST") {
        const body = await request.json();
        const decision = arbitratePowerTower(body);
        latestPowerTower = { decision: decision.decision, energy: decision.energy, elapsed_ms: decision.elapsed_ms, ts: new Date().toISOString() };

        const event = makeEvent("UQ_POWER_TOWER", { ...decision }, env);
        const signed = env.DIAMOND_NODE_ED25519_PRIV
          ? await signEvent(event, env.DIAMOND_NODE_ED25519_PRIV)
          : { ...event, sig: "unsigned-dev" };
        appendAudit(signed as any);

        response = Response.json({ ok: true, result: decision, attest: signed });

      // v0.3: Accept + sign RadixAttention claims from gc-dynamic-uq-service
      } else if (pathname === "/uq/radix_claims" && request.method === "POST") {
        const body = await request.json() as { claims: any[]; uq_version: number; uq_value: number };
        if (!env.DIAMOND_NODE_ED25519_PRIV) {
          response = Response.json({ error: "no_priv_key" }, { status: 500 });
        } else {
          const signedClaims: RadixAttentionClaim[] = [];
          for (const c of (body.claims || [])) {
            const claim = await signRadixClaim({
              prefix_id: c.prefix_id,
              root_hash: c.root_hash,
              uq_version: body.uq_version,
              uq_value: body.uq_value,
              ts: new Date().toISOString(),
            }, env.DIAMOND_NODE_ED25519_PRIV);
            signedClaims.push(claim);
          }
          latestRadixClaims = signedClaims;
          const event = makeEvent("RADIX_CLAIMS_SIGNED", { count: signedClaims.length, uq_version: body.uq_version }, env);
          const signedEvent = await signEvent(event, env.DIAMOND_NODE_ED25519_PRIV);
          appendAudit(signedEvent as any);
          response = Response.json({ ok: true, signed: signedClaims.length });
        }

      } else if (pathname === "/" && request.method === "GET") {
        response = new Response(LANDING_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });

      } else if (pathname === "/dashboard" && request.method === "GET") {
        response = new Response(YENNEFER_DASHBOARD_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });

      } else if (pathname === "/notion/health" && request.method === "GET") {
        response = await handleNotionHealth(request, env);

      } else if (pathname.startsWith("/notion/") && request.method === "POST") {
        const denied = requireGatewayAuth(request, env);
        if (denied) {
          response = denied;
        } else if (pathname === "/notion/offload") {
          response = await handleNotionOffload(request, env);
        } else if (pathname === "/notion/embed") {
          response = await handleNotionEmbed(request, env);
        } else if (pathname === "/notion/query") {
          response = await handleNotionQuery(request, env);
        } else if (pathname === "/notion/search") {
          response = await handleNotionSearch(request, env);
        } else {
          response = new Response("Not Found", { status: 404 });
        }

      } else {
        response = handleSEORoutes(pathname) ?? new Response("Not Found", { status: 404 });
      }

      if (appsignal) {
        const duration = Date.now() - startTime;
        trackRequest(appsignal, request, response, duration);
      }
      return response;
    } catch (error) {
      if (appsignal) trackError(appsignal, error as Error, { method: request.method, path: pathname, url: request.url });
      console.error("Request error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
