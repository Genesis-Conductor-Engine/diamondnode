export interface Env {
  // Secrets — set via: wrangler secret put <NAME>
  DIAMOND_NODE_ED25519_PRIV: string; // base64-encoded PKCS#8 private key
  DIAMOND_NODE_ED25519_PUB: string;  // base64-encoded SPKI public key
  DIAMOND_VAULT_AUDIT_URL: string;   // upstream audit endpoint (optional)
  APPSIGNAL_KEY?: string;            // AppSignal API key (optional, for monitoring)

  // Notion AI Worker Configuration
  NOTION_TOKEN?: string;              // Notion integration token (optional)
  NOTION_DATABASE_ID?: string;        // Notion database ID (default: 21e416066ef1411084d1bbaf67af79d1)
  GATEWAY_AUTH_SECRET?: string;       // Gateway authentication secret (optional)
  CUDA_Q_OPTIMIZED?: string;          // CUDA-Q optimization flag (default: "true")
  GTX1650_MODE?: string;              // GTX 1650 mode flag (default: "true")
  QUADRATIC_EMBEDDING?: string;       // Quadratic embedding flag (default: "true")
  QFLOP_THROUGHPUT?: string;          // QFlop throughput mode (default: "max")

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
