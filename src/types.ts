export interface Env {
  // Secrets — set via: wrangler secret put <NAME>
  DIAMOND_NODE_ED25519_PRIV: string; // base64-encoded PKCS#8 private key
  DIAMOND_NODE_ED25519_PUB: string;  // base64-encoded SPKI public key
  DIAMOND_VAULT_AUDIT_URL: string;   // upstream audit endpoint (optional)
  APPSIGNAL_KEY?: string;            // AppSignal API key (optional, for monitoring)

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

export interface RadixAttentionClaim {
  prefix_id: string;           // rev:01:wrap_fees etc.
  root_hash: string;           // current RadixAttention root for this prefix
  uq_version: number;
  uq_value: number;
  ts: string;
  sig: string;                 // Ed25519 over the above (verifiable)
}

export interface DiamondNodeManifest {
  node_id: string;
  deploy_url: string;
  repo: string;
  key_id: string;
  identity_pubkey: string;
  version: string;
  ts: string;
  monitoring?: string;
  // v0.3: verifiable RadixAttention coherence roots (signed claims)
  radix_attention_claims?: RadixAttentionClaim[];
  latest_power_tower?: {
    decision: string;
    energy: number;
    elapsed_ms: number;
    ts: string;
  };
}
