/**
 * Generate an Ed25519 keypair for diamond-node.
 * Run once offline: node scripts/gen-identity.mjs
 *
 * Then:
 *   wrangler secret put DIAMOND_NODE_ED25519_PRIV   # paste privKey
 *   wrangler secret put DIAMOND_NODE_ED25519_PUB    # paste pubKey
 */
import { webcrypto } from "node:crypto";

const { privateKey, publicKey } = await webcrypto.subtle.generateKey(
  { name: "Ed25519" },
  true,
  ["sign", "verify"],
);

const privRaw = await webcrypto.subtle.exportKey("pkcs8", privateKey);
const pubRaw = await webcrypto.subtle.exportKey("spki", publicKey);

const toB64 = buf => Buffer.from(buf).toString("base64");

console.log("=== diamond-node Ed25519 identity keypair ===");
console.log("DIAMOND_NODE_ED25519_PRIV (keep secret):");
console.log(toB64(privRaw));
console.log("\nDIAMOND_NODE_ED25519_PUB (public, commit to .well-known):");
console.log(toB64(pubRaw));
console.log("\nkey_id: dn-" + new Date().toISOString().slice(0, 7));
