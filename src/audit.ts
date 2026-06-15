import type { AuditEvent } from "./types.js";

const MAX_EVENTS = 100;
const ring: AuditEvent[] = [];

export function appendAudit(event: AuditEvent): void {
  ring.push(event);
  if (ring.length > MAX_EVENTS) ring.shift();
}

export function handleAuditReplay(request: Request): Response {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: { "Access-Control-Allow-Origin": "*" } });
  }
  const url = new URL(request.url);
  const n = Math.min(parseInt(url.searchParams.get("n") ?? "20", 10), MAX_EVENTS);
  const page = ring.slice(-n);
  return Response.json({ events: page, total: ring.length }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": "no-cache",
    },
  });
}
