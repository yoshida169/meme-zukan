import { corsHeaders, preflightResponse } from "../cors";
import type { Env } from "../types";

interface ViewRow {
  slug: string;
  count: number;
}

export async function handleRanking(
  request: Request,
  env: Env
): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";

  if (request.method === "OPTIONS") {
    return preflightResponse(origin);
  }
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(origin),
    });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const parsed = limitParam ? parseInt(limitParam, 10) : 100;
  const limit = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 1), 100)
    : 100;

  const result = await env.DB.prepare(
    `SELECT slug, count FROM meme_views ORDER BY count DESC, slug ASC LIMIT ?1`
  )
    .bind(limit)
    .all<ViewRow>();

  const rows = result.results ?? [];

  return new Response(JSON.stringify({ ranking: rows }), {
    status: 200,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
