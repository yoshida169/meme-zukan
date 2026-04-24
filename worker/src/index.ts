import { handleNotionWebhook } from "./handlers/webhook";
import { handleRanking } from "./handlers/ranking";
import { handleView } from "./handlers/view";
import type { Env } from "./types";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx?: { waitUntil(promise: Promise<unknown>): void }
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/view") {
      return handleView(request, env, ctx);
    }
    if (url.pathname === "/api/ranking") {
      return handleRanking(request, env);
    }

    return handleNotionWebhook(request, env);
  },
};
