interface Env {
  GITHUB_REPO: string;
  GITHUB_TOKEN: string; // secret: GitHub PAT (repo scope)
  NOTION_WEBHOOK_SECRET: string; // secret: Notion webhook verification
}

// Notion Webhook → GitHub Actions repository_dispatch をブリッジするWorker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Notion webhook verification (challenge handshake)
    const body = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Notion sends a verification challenge on webhook creation
    if (payload.type === "url_verification") {
      return new Response(
        JSON.stringify({ challenge: payload.challenge }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // DB内のページ追加・更新イベントのみ処理
    const relevantEvents = [
      "page.created",
      "page.properties_updated",
      "database.content_updated",
    ];
    if (!relevantEvents.includes(payload.type)) {
      return new Response("Event ignored", { status: 200 });
    }

    // GitHub Actions の repository_dispatch を発火
    const ghRes = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "meme-zukan-webhook-worker",
        },
        body: JSON.stringify({
          event_type: "notion_updated",
          client_payload: {
            event: payload.type,
            entity_id: payload.entity?.id ?? null,
          },
        }),
      }
    );

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      console.error("GitHub dispatch failed:", ghRes.status, errText);
      return new Response("GitHub dispatch failed", { status: 502 });
    }

    return new Response("OK", { status: 200 });
  },
};
