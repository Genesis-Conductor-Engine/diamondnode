export interface Env {
  // Secrets — set via: wrangler secret put <NAME>
  DIAMOND_NODE_ED25519_PRIV: string; // base64-encoded PKCS#8 private key
  DIAMOND_NODE_ED25519_PUB: string;  // base64-encoded SPKI public key
  DIAMOND_VAULT_AUDIT_URL: string;   // upstream audit endpoint (optional)

  // Vars — set in wrangler.toml [vars]
  NODE_VERSION: string;
  NODE_ID: string;
  KEY_ID: string;
}

export interface AuditEvent {
  event_type: string;
  node_id: string;
  key_id: string;
  ts: string;
  payload: Record<string, unknown>;
  sig?: string;
}

export interface HealthResponse {
  ok: boolean;
  version: string;
  identity_pubkey: string;
  ts: string;
}
