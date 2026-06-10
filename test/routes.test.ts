import { describe, it, expect } from "vitest";
import worker from "../src/index.js";
import type { Env } from "../src/types.js";

const baseEnv: Env = {
  DIAMOND_NODE_ED25519_PRIV: "",
  DIAMOND_NODE_ED25519_PUB: "test-pubkey-base64",
  DIAMOND_VAULT_AUDIT_URL: "",
  NODE_VERSION: "0.1.0",
  NODE_ID: "diamond-node",
  KEY_ID: "dn-2026-05",
};

const mockCtx = { waitUntil: (_p: Promise<unknown>) => {} } as ExecutionContext;
const url = (p: string) => `https://dn.genesisconductor.io${p}`;

describe("landing and dashboard", () => {
  it("GET / serves the landing page", async () => {
    const res = await worker.fetch(new Request(url("/")), baseEnv, mockCtx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(await res.text()).toContain("<!DOCTYPE html");
  });

  it("GET /dashboard serves the Yennefer dashboard", async () => {
    const res = await worker.fetch(new Request(url("/dashboard")), baseEnv, mockCtx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });
});

describe("notion proxy auth gate", () => {
  it("returns 503 when GATEWAY_AUTH_SECRET is not provisioned", async () => {
    const res = await worker.fetch(
      new Request(url("/notion/offload"), { method: "POST", body: "{}" }),
      baseEnv,
      mockCtx
    );
    expect(res.status).toBe(503);
  });

  it("returns 401 on wrong bearer token", async () => {
    const env = { ...baseEnv, GATEWAY_AUTH_SECRET: "s3cret" };
    const res = await worker.fetch(
      new Request(url("/notion/query"), {
        method: "POST",
        body: "{}",
        headers: { Authorization: "Bearer wrong" },
      }),
      env,
      mockCtx
    );
    expect(res.status).toBe(401);
  });

  it("admits correct bearer token (placeholder handler responds)", async () => {
    const env = { ...baseEnv, GATEWAY_AUTH_SECRET: "s3cret" };
    const res = await worker.fetch(
      new Request(url("/notion/query"), {
        method: "POST",
        body: JSON.stringify({ query: "x" }),
        headers: { Authorization: "Bearer s3cret" },
      }),
      env,
      mockCtx
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(String(body.note ?? "")).toContain("placeholder");
  });

  it("GET /notion/health is open and reports config flags", async () => {
    const res = await worker.fetch(new Request(url("/notion/health")), baseEnv, mockCtx);
    expect(res.status).toBe(200);
  });
});

describe("/uq/power_tower (deterministic arbitration via worker)", () => {
  it("signs a node-computed decision and ignores caller-injected fields", async () => {
    const res = await worker.fetch(
      new Request(url("/uq/power_tower"), {
        method: "POST",
        body: JSON.stringify({ guardian_r: 0.9, decision: "promote", energy: -99 }),
      }),
      baseEnv,
      mockCtx
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.result.decision).toBe("veto");
    expect(body.result.mode).toBe("deterministic-objective-v1");
    expect(body.result.energy).not.toBe(-99);
  });
});
