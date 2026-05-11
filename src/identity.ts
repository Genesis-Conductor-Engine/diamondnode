import type { AuditEvent, Env } from "./types.js";

export async function importPrivKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", raw, { name: "Ed25519" }, false, ["sign"]);
}

export async function signEvent(
  event: Omit<AuditEvent, "sig">,
  privKeyB64: string,
): Promise<AuditEvent> {
  const key = await importPrivKey(privKeyB64);
  const payload = new TextEncoder().encode(JSON.stringify(event));
  const sig = await crypto.subtle.sign("Ed25519", key, payload);
  return { ...event, sig: btoa(String.fromCharCode(...new Uint8Array(sig))) };
}

export function makeEvent(
  type: string,
  payload: Record<string, unknown>,
  env: Pick<Env, "NODE_ID" | "KEY_ID">,
): Omit<AuditEvent, "sig"> {
  return {
    event_type: type,
    node_id: env.NODE_ID ?? "diamond-node",
    key_id: env.KEY_ID ?? "dn-2026-05",
    ts: new Date().toISOString(),
    payload,
  };
}

export async function emitToVault(
  event: AuditEvent,
  vaultUrl: string | undefined,
  ctx: ExecutionContext,
): Promise<void> {
  if (!vaultUrl) return;
  ctx.waitUntil(
    fetch(vaultUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {}),
  );
}
