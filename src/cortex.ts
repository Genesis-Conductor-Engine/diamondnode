/**
 * cortex.ts — /api/system-status handler
 *
 * Fetches the canonical cortex-feed JSONL, aggregates the latest
 * cortex_state_snapshot plus component_state events, and returns
 * a live JSON payload that Yennefer Cortex (yennobs.genesisconductor.io)
 * expects at GET /api/system-status.
 *
 * Field contract (matches yennefer-cortex cortex-schema.jsonl.example
 * and status/system_aggregates.json):
 *
 *   epsilon_th               — latest cortex_state_snapshot value
 *   crystalline_score        — latest cortex_state_snapshot value
 *   dissonance_r             — latest cortex_state_snapshot value
 *   global_crystalline_invariant
 *   guardian_risk
 *   guardian_risk_threshold
 *   truth_index
 *   qflops_breaths_coherence
 *   project_aurora_percent
 *   system_status            — "CLOSED_LOOP_OPERATIONAL" | "DEGRADED" | "UNKNOWN"
 *   closed_loop_operational  — boolean
 *   all_participant_sets_connected — boolean
 *   hermes_bridge_health
 *   components               — array of latest component_state entries
 *   latest_snapshot_event_id
 *   latest_snapshot_ts
 *   feed_ts                  — when this response was computed
 *   feed_source              — URL of the cortex-feed
 */

import type { Env } from "./types.js";

const CORTEX_FEED_URL =
  "https://raw.githubusercontent.com/Genesis-Conductor-Engine/cortex-feed/main/feed.jsonl";

// Cache TTL: 30 seconds — keeps the dashboard live without hammering GitHub raw
const CACHE_TTL_MS = 30_000;

interface CortexEvent {
  event_id: string;
  timestamp: string;
  type: string;
  epsilon_th?: number;
  crystalline_score?: number;
  dissonance_r?: number;
  content?: Record<string, unknown>;
  source?: string;
  trace_consent_id?: string;
  orcid_attribution?: string;
}

interface SystemStatusResponse {
  ok: boolean;
  epsilon_th: number;
  crystalline_score: number;
  dissonance_r: number;
  global_crystalline_invariant: number;
  guardian_risk: number;
  guardian_risk_threshold: number;
  truth_index: number;
  qflops_breaths_coherence: number;
  project_aurora_percent: number;
  system_status: string;
  closed_loop_operational: boolean;
  all_participant_sets_connected: boolean;
  hermes_bridge_health: string;
  components: ComponentState[];
  latest_snapshot_event_id: string;
  latest_snapshot_ts: string;
  feed_ts: string;
  feed_source: string;
}

interface ComponentState {
  component: string;
  status: string;
  crystalline_score?: number;
  guardian_risk?: number;
  notes?: string;
  ts: string;
}

// In-memory cache (per isolate lifetime)
let cachedResponse: SystemStatusResponse | null = null;
let cacheExpiry = 0;

function parseFeed(raw: string): CortexEvent[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as CortexEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is CortexEvent => e !== null);
}

function aggregateEvents(events: CortexEvent[]): SystemStatusResponse {
  // Most recent cortex_state_snapshot
  const snapshots = events
    .filter((e) => e.type === "cortex_state_snapshot")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const latest = snapshots[0] ?? null;
  const content = (latest?.content ?? {}) as Record<string, unknown>;

  // Latest system_status_update for high-level aggregates
  const statusUpdates = events
    .filter((e) => e.type === "system_status_update")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestStatus = (statusUpdates[0]?.content ?? {}) as Record<string, unknown>;

  // Latest component_state per component (deduplicated by component name)
  const componentMap = new Map<string, ComponentState>();
  events
    .filter((e) => e.type === "component_state" && e.content?.component)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((e) => {
      const c = e.content as Record<string, unknown>;
      componentMap.set(c.component as string, {
        component: c.component as string,
        status: (c.status as string) ?? "unknown",
        crystalline_score:
          (c.crystalline_r as number) ?? (c.crystalline_score as number) ?? e.crystalline_score,
        guardian_risk: (c.guardian_risk as number) ?? undefined,
        notes: (c.notes as string) ?? undefined,
        ts: e.timestamp,
      });
    });

  // Resolve scalar fields — prefer explicit content fields, fall back to event-level
  const epsilon_th =
    (content.epsilon_th as number) ?? latest?.epsilon_th ?? 0;
  const crystalline_score =
    (content.global_crystalline_invariant as number) ??
    (content.crystalline_score as number) ??
    latest?.crystalline_score ??
    0;
  const dissonance_r =
    (content.dissonance_r as number) ?? latest?.dissonance_r ?? 0;
  const guardian_risk =
    (content.guardian_risk as number) ??
    (latestStatus.guardian_risk as number) ??
    0;
  const guardian_risk_threshold =
    (content.guardian_risk_threshold as number) ?? 0.3;
  const truth_index =
    (latestStatus.truth_index as number) ?? 0;
  const qflops_breaths_coherence =
    (latestStatus.qflops_breaths_coherence as number) ?? 0;
  const project_aurora_percent =
    (latestStatus.project_aurora_percent as number) ?? 0;
  const system_status =
    (latestStatus.system_status as string) ??
    (content.status as string) ??
    "UNKNOWN";
  const closed_loop_operational =
    (content.closed_loop_operational as boolean) ??
    (latestStatus.closed_loop_operational as boolean) ??
    false;
  const all_participant_sets_connected =
    (content.all_participant_sets_connected as boolean) ??
    false;
  const hermes_bridge_health =
    (latestStatus.hermes_bridge_health as string) ?? "unknown";

  return {
    ok: true,
    epsilon_th,
    crystalline_score,
    dissonance_r,
    global_crystalline_invariant: crystalline_score,
    guardian_risk,
    guardian_risk_threshold,
    truth_index,
    qflops_breaths_coherence,
    project_aurora_percent,
    system_status,
    closed_loop_operational,
    all_participant_sets_connected,
    hermes_bridge_health,
    components: Array.from(componentMap.values()),
    latest_snapshot_event_id: latest?.event_id ?? "",
    latest_snapshot_ts: latest?.timestamp ?? "",
    feed_ts: new Date().toISOString(),
    feed_source: CORTEX_FEED_URL,
  };
}

export async function handleSystemStatus(
  _request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response> {
  const now = Date.now();

  // Serve from cache if still fresh
  if (cachedResponse && now < cacheExpiry) {
    return Response.json(cachedResponse, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}`,
        "X-Feed-Cached": "true",
      },
    });
  }

  // Override feed URL via env var if set (allows pointing at a private feed)
  const feedUrl = (env as unknown as Record<string, string>).CORTEX_FEED_URL ?? CORTEX_FEED_URL;

  let result: SystemStatusResponse;
  try {
    const feedResp = await fetch(feedUrl, {
      headers: { "User-Agent": "diamondnode-system-status/1.0" },
      // Cloudflare Workers: bypass CF cache to get fresh JSONL
      cf: { cacheEverything: false },
    } as RequestInit);

    if (!feedResp.ok) {
      throw new Error(`Feed fetch failed: ${feedResp.status} ${feedResp.statusText}`);
    }

    const raw = await feedResp.text();
    const events = parseFeed(raw);
    result = aggregateEvents(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cortex] system-status error:", message);
    return Response.json(
      { ok: false, error: message, feed_ts: new Date().toISOString() },
      {
        status: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // Cache the result
  cachedResponse = result;
  cacheExpiry = now + CACHE_TTL_MS;

  return Response.json(result, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}`,
      "X-Feed-Cached": "false",
    },
  });
}
