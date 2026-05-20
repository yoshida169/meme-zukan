import { corsHeaders, preflightResponse } from "../cors";
import type { Env } from "../types";

interface SubmitBody {
  name?: unknown;
  description?: unknown;
  year?: unknown;
  origin?: unknown;
  sourceUrl?: unknown;
  submitter?: unknown;
  // honeypot
  website?: unknown;
}

const LIMITS = {
  name: 100,
  description: 2000,
  origin: 50,
  sourceUrl: 500,
  submitter: 50,
};

function asTrimmedString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length > max ? "" : trimmed;
}

function escapeMd(s: string): string {
  return s.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
}

export async function handleSubmit(
  request: Request,
  env: Env
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

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  // honeypot: ボットが埋めがちな hidden field に値が入っていたら静かに 204
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const name = asTrimmedString(body.name, LIMITS.name);
  const description = asTrimmedString(body.description, LIMITS.description);
  const originField = asTrimmedString(body.origin, LIMITS.origin);
  const sourceUrl = asTrimmedString(body.sourceUrl, LIMITS.sourceUrl);
  const submitter = asTrimmedString(body.submitter, LIMITS.submitter);
  const yearRaw = body.year;
  const year =
    typeof yearRaw === "number" && Number.isFinite(yearRaw)
      ? Math.trunc(yearRaw)
      : typeof yearRaw === "string" && /^\d{4}$/.test(yearRaw.trim())
      ? Number(yearRaw.trim())
      : null;

  if (!name || !description) {
    return new Response("Missing required fields", {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (year !== null && (year < 1900 || year > 2100)) {
    return new Response("Invalid year", {
      status: 400,
      headers: corsHeaders(origin),
    });
  }
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
    return new Response("Invalid sourceUrl", {
      status: 400,
      headers: corsHeaders(origin),
    });
  }

  const title = `[ミーム情報提供] ${name}`;
  const lines = [
    `## ミーム情報`,
    ``,
    `- **名前**: ${escapeMd(name)}`,
    `- **発祥年**: ${year ?? "(未記入)"}`,
    `- **発祥**: ${originField ? escapeMd(originField) : "(未記入)"}`,
    `- **ソースURL**: ${sourceUrl ? sourceUrl : "(未記入)"}`,
    `- **提供者**: ${submitter ? escapeMd(submitter) : "(匿名)"}`,
    ``,
    `## 説明`,
    ``,
    escapeMd(description),
    ``,
    `---`,
    `_このIssueは サイト経由の情報提供フォームから自動作成されました_`,
  ];
  const issueBody = lines.join("\n");

  const ghRes = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "meme-zukan-submit-worker",
      },
      body: JSON.stringify({
        title,
        body: issueBody,
        labels: ["meme-submission"],
      }),
    }
  );

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    console.error("GitHub issue creation failed:", ghRes.status, errText);
    return new Response("Failed to submit", {
      status: 502,
      headers: corsHeaders(origin),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}
