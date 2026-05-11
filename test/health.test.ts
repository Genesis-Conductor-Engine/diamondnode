import { describe, it, expect } from "vitest";
import worker from "../src/index.js";
import type { Env } from "../src/types.js";

const mockEnv: Env = {
  DIAMOND_NODE_ED25519_PRIV: "",
  DIAMOND_NODE_ED25519_PUB: "test-pubkey-base64",
  DIAMOND_VAULT_AUDIT_URL: "",
  NODE_VERSION: "0.1.0",
  NODE_ID: "diamond-node",
  KEY_ID: "dn-2026-05",
};

const mockCtx = { waitUntil: (_p: Promise<unknown>) => {} } as ExecutionContext;

describe("GET /healthz", () => {
  it("returns ok=true with version and pubkey", async () => {
    const req = new Request("https://dn.genesisconductor.io/healthz");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.version).toBe("0.1.0");
    expect(body.identity_pubkey).toBe("test-pubkey-base64");
    expect(typeof body.ts).toBe("string");
  });
});

describe("GET /.well-known/diamond-node.json", () => {
  it("returns identity manifest", async () => {
    const req = new Request("https://dn.genesisconductor.io/.well-known/diamond-node.json");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.node_id).toBe("diamond-node");
    expect(body.key_id).toBe("dn-2026-05");
  });
});

describe("GET /audit/replay", () => {
  it("returns events array", async () => {
    const req = new Request("https://dn.genesisconductor.io/audit/replay");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(Array.isArray(body.events)).toBe(true);
  });
});

describe("GET /unknown", () => {
  it("returns 404", async () => {
    const req = new Request("https://dn.genesisconductor.io/unknown");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(404);
  });
});
