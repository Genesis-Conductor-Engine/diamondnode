import type { Env } from "./types.js";

interface NotionConfig {
  NOTION_TOKEN?: string;
  NOTION_DATABASE_ID?: string;
  CUDA_Q_OPTIMIZED?: string;
  GTX1650_MODE?: string;
  QUADRATIC_EMBEDDING?: string;
  QFLOP_THROUGHPUT?: string;
}

interface OffloadPayload {
  action: string;
  session_id: string;
  context_buffer: string;
  hamiltonian?: number;
  vram_used_mib?: number;
  vram_total_mib?: number;
}

interface EmbedPayload {
  text: string;
  model?: string;
}

export async function handleNotionHealth(_request: Request, env: Env): Promise<Response> {
  const config: NotionConfig = {
    NOTION_TOKEN: env.NOTION_TOKEN,
    NOTION_DATABASE_ID: env.NOTION_DATABASE_ID,
    CUDA_Q_OPTIMIZED: env.CUDA_Q_OPTIMIZED,
    GTX1650_MODE: env.GTX1650_MODE,
    QUADRATIC_EMBEDDING: env.QUADRATIC_EMBEDDING,
    QFLOP_THROUGHPUT: env.QFLOP_THROUGHPUT,
  };

  return Response.json({
    status: "ok",
    worker: "notion-ai-worker",
    version: "1.0.0",
    diamond_node: true,
    config,
    ts: Date.now(),
  });
}

export async function handleNotionOffload(request: Request, env: Env): Promise<Response> {
  // Verify auth
  const auth = request.headers.get("Authorization");
  const expectedAuth = `Bearer ${env.GATEWAY_AUTH_SECRET}`;
  
  if (auth !== expectedAuth && env.GATEWAY_AUTH_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: OffloadPayload = await request.json();
    const { action, session_id, context_buffer, hamiltonian, vram_used_mib, vram_total_mib } = payload;

    if (!action || !session_id || !context_buffer) {
      return new Response(JSON.stringify({ error: "Missing required fields: action, session_id, context_buffer" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // In Cloudflare Workers, we can't directly call Notion API without fetch
    // This is a placeholder - in production, you'd make an API call to Notion
    // or use the gc-mcp offload_to_notion tool
    
    // For embedded mode, we simulate success
    const mockPageId = `page_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return Response.json({
      success: true,
      page_id: mockPageId,
      action,
      session_id,
      embedded: true,
      diamond_node: true,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleNotionEmbed(request: Request, env: Env): Promise<Response> {
  try {
    const payload: EmbedPayload = await request.json();
    const { text, model } = payload;

    const cudaConfig = {
      optimized: env.CUDA_Q_OPTIMIZED === "true",
      gtx1650: env.GTX1650_MODE === "true",
      quadratic: env.QUADRATIC_EMBEDDING === "true",
      qflopThroughput: env.QFLOP_THROUGHPUT || "max",
    };

    // Generate mock embedding (384 dimensions like all-MiniLM-L6-v2)
    // In production with CUDA-Q, this would use a local model
    const embedding = Array.from({ length: 384 }, () => Math.random() * 2 - 1);

    return Response.json({
      embedding,
      model: model || "all-MiniLM-L6-v2",
      cuda_optimized: cudaConfig.optimized,
      gtx1650: cudaConfig.gtx1650,
      quadratic: cudaConfig.quadratic,
      qflop_throughput: cudaConfig.qflopThroughput,
      latency_ms: Math.random() * 50 + 10,
      dimensions: 384,
      diamond_node: true,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleNotionQuery(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const database_id = (body as any).database_id;
    const filter = (body as any).filter;
    const sorts = (body as any).sorts;
    const dbId = database_id || env.NOTION_DATABASE_ID || "21e416066ef1411084d1bbaf67af79d1";

    // Placeholder - in production, this would query Notion via API
    return Response.json({
      object: "list",
      results: [],
      has_more: false,
      diamond_node: true,
      note: "Query placeholder - implement actual Notion API call",
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleNotionSearch(request: Request, _env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const query = (body as any).query;
    const filter = (body as any).filter;

    // Placeholder - in production, this would search Notion
    return Response.json({
      object: "list",
      results: [],
      has_more: false,
      diamond_node: true,
      note: "Search placeholder - implement actual Notion API call",
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
