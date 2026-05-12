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
  if (!onlineEmitted && env.DIAMOND_NODE_ED25519_PRIV) {
    onlineEmitted = true;
    const raw = makeEvent("node.online", { version: body.version }, env);
    const signed = await signEvent(raw, env.DIAMOND_NODE_ED25519_PRIV);
    appendAudit(signed);
    await emitToVault(signed, env.DIAMOND_VAULT_AUDIT_URL, ctx);
  }

  return Response.json(body);
}
