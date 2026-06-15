import type { Env, HealthResponse } from "./types.js";
import { makeEvent, signEvent, emitToVault } from "./identity.js";
import { appendAudit } from "./audit.js";

let onlineEmitted = false;

export async function handleHealth(
  _request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const body: HealthResponse = {
    ok: true,
    version: env.NODE_VERSION ?? "0.1.0",
    identity_pubkey: env.DIAMOND_NODE_ED25519_PUB ?? "",
    ts: new Date().toISOString(),
  };

  // Emit node.online once per isolate lifetime
  // Wrap in try-catch to prevent health endpoint failures
  if (!onlineEmitted && env.DIAMOND_NODE_ED25519_PRIV) {
    onlineEmitted = true;
    try {
      const raw = makeEvent("node.online", { version: body.version }, env);
      const signed = await signEvent(raw, env.DIAMOND_NODE_ED25519_PRIV);
      appendAudit(signed);
      await emitToVault(signed, env.DIAMOND_VAULT_AUDIT_URL, ctx);
    } catch (error) {
      // Log error but don't fail health check
      console.error("Failed to emit node.online event:", error);
    }
  }

  return Response.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-cache",
    },
  });
}
