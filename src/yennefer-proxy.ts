import type { Env } from "./types.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  });
}

function getYenneferApiUrl(env: Env): string | null {
  const raw = env.YENNEFER_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

async function proxyJson(request: Request, upstreamUrl: string): Promise<Response> {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    responseHeaders.set(key, value);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function handleYenneferProxy(request: Request, env: Env): Promise<Response> {
  const apiUrl = getYenneferApiUrl(env);
  if (!apiUrl) {
    return jsonResponse(
      {
        ok: false,
        error: "YENNEFER_API_URL is not configured",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  try {
    if (url.pathname === "/api/yennefer/metrics" && request.method === "GET") {
      return await proxyJson(request, `${apiUrl}/api/vram`);
    }

    if (url.pathname === "/api/yennefer/orchestrate" && request.method === "POST") {
      return await proxyJson(request, `${apiUrl}/v1/yennefer`);
    }

    return jsonResponse({ ok: false, error: "Not Found" }, { status: 404 });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: "Yennefer upstream unavailable",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
