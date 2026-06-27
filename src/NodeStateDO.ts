export class NodeStateDO {
  private sql: any;

  constructor(state: DurableObjectState) {
    this.sql = (state.storage as any).sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS rpsi_evts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        evt_id      TEXT NOT NULL UNIQUE,
        record_type TEXT NOT NULL,
        ts          TEXT NOT NULL,
        payload     TEXT NOT NULL,
        received_at TEXT NOT NULL
      )
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url   = new URL(request.url);
    const path  = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // POST /ingest — single EVT or array of EVTs
    if (path === "/ingest" && method === "POST") {
      const body = await request.json() as Record<string, unknown> | Record<string, unknown>[];
      const evts = Array.isArray(body) ? body : [body];
      const received_at = new Date().toISOString();
      const inserted: string[] = [];

      for (const evt of evts) {
        const evt_id      = (evt.evt_id as string)      ?? crypto.randomUUID();
        const record_type = (evt.record_type as string) ?? "unknown";
        const ts          = (evt.timestamp as string)   ?? received_at;
        this.sql.exec(
          `INSERT OR IGNORE INTO rpsi_evts (evt_id, record_type, ts, payload, received_at)
           VALUES (?, ?, ?, ?, ?)`,
          evt_id, record_type, ts, JSON.stringify(evt), received_at,
        );
        inserted.push(evt_id);
      }
      return Response.json({ ok: true, inserted, received_at }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // GET /feed?n=20 — latest N EVTs, newest first
    if (path === "/feed" && method === "GET") {
      const n = Math.min(parseInt(url.searchParams.get("n") ?? "20"), 200);
      const rows = [...this.sql.exec(
        `SELECT * FROM rpsi_evts ORDER BY id DESC LIMIT ?`, n,
      )];
      return Response.json({
        count: rows.length,
        evts: rows.map((r: any) => ({ ...r, payload: JSON.parse(r.payload) })),
      }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // GET /status — latest EVT per record_type (pipeline snapshot)
    if (path === "/status" && method === "GET") {
      const rows = [...this.sql.exec(`
        SELECT * FROM rpsi_evts
        WHERE id IN (SELECT MAX(id) FROM rpsi_evts GROUP BY record_type)
        ORDER BY record_type
      `)];
      const status: Record<string, unknown> = {};
      for (const r of rows as any[]) {
        status[r.record_type] = {
          evt_id: r.evt_id,
          ts: r.ts,
          received_at: r.received_at,
          payload: JSON.parse(r.payload),
        };
      }
      return Response.json({ status, ts: new Date().toISOString(), count: rows.length }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // GET /purge?keep=500 — housekeeping
    if (path === "/purge" && method === "GET") {
      const keep = parseInt(url.searchParams.get("keep") ?? "500");
      this.sql.exec(
        `DELETE FROM rpsi_evts WHERE id <= (SELECT id FROM rpsi_evts ORDER BY id DESC LIMIT 1 OFFSET ?)`,
        keep,
      );
      return Response.json({ ok: true, kept: keep }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response("Not Found", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
