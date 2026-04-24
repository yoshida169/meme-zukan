import { isBotUA } from "../bot";
import { corsHeaders, preflightResponse } from "../cors";
import type { Env } from "../types";

interface ViewBody {
  slug?: unknown;
}

// ExecutionContext は Cloudflare Workers のランタイムが渡す引数。
// テストからは省略されるので optional 扱い + フォールバックで await。
interface CtxLike {
  waitUntil(promise: Promise<unknown>): void;
}

export async function handleView(
  request: Request,
  env: Env,
  ctx?: CtxLike
): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";

  if (request.method === "OPTIONS") {
    return preflightResponse(origin);
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(origin),
    });
  }

  const ua = request.headers.get("User-Agent");
  if (isBotUA(ua)) {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  let body: ViewBody;
  try {
    body = (await request.json()) as ViewBody;
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug || slug.length > 200) {
    return new Response("Invalid slug", {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const stmt = env.DB.prepare(
    `INSERT INTO meme_views (slug, count, updated_at)
     VALUES (?1, 1, ?2)
     ON CONFLICT(slug) DO UPDATE SET
       count = count + 1,
       updated_at = ?2`
  ).bind(slug, Date.now());

  const run = stmt.run().catch((err) => {
    console.error("D1 upsert failed:", err);
  });

  if (ctx?.waitUntil) {
    ctx.waitUntil(run);
  } else {
    await run;
  }

  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
