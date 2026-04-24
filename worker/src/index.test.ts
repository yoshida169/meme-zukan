import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import worker from "./index";
import type { Env } from "./types";

const env: Env = {
  GITHUB_REPO: "owner/repo",
  GITHUB_TOKEN: "ghp_test",
  NOTION_WEBHOOK_SECRET: "secret",
  ALLOWED_ORIGIN: "https://example.pages.dev",
  // 既存 Webhook テストは D1 を使わないのでダミー
  DB: {
    prepare: () => {
      throw new Error("DB should not be used in webhook tests");
    },
  } as unknown as Env["DB"],
};

function makeRequest(body: unknown, init: RequestInit = {}) {
  return new Request("https://worker.example.com/", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Notion Webhook Worker", () => {
  test("POST 以外は 405 を返す", async () => {
    const req = new Request("https://worker.example.com/", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(405);
  });

  test("不正な JSON は 400 を返す", async () => {
    const req = makeRequest("not-json");
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("url_verification チャレンジに challenge を返す", async () => {
    const req = makeRequest({
      type: "url_verification",
      challenge: "abc123",
    });
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.json()).toEqual({ challenge: "abc123" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("対象外イベントは無視して 200 を返す", async () => {
    const req = makeRequest({ type: "page.deleted" });
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Event ignored");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each([
    "page.created",
    "page.properties_updated",
    "database.content_updated",
  ])("%s イベントで GitHub repository_dispatch を発火する", async (eventType) => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response("ok", { status: 200 })
    );

    const req = makeRequest({
      type: eventType,
      entity: { id: "entity-1" },
    });
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/owner/repo/dispatches");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer ghp_test",
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "meme-zukan-webhook-worker",
    });
    expect(JSON.parse(init.body)).toEqual({
      event_type: "notion_updated",
      client_payload: {
        event: eventType,
        entity_id: "entity-1",
      },
    });
  });

  test("entity が無くても entity_id: null で送信する", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response("ok", { status: 200 })
    );

    const req = makeRequest({ type: "page.created" });
    await worker.fetch(req, env);

    const init = (global.fetch as any).mock.calls[0][1];
    expect(JSON.parse(init.body).client_payload.entity_id).toBeNull();
  });

  test("GitHub API がエラー応答すると 502 を返す", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response("bad credentials", { status: 401 })
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = makeRequest({ type: "page.created" });
    const res = await worker.fetch(req, env);

    expect(res.status).toBe(502);
    expect(await res.text()).toBe("GitHub dispatch failed");
    expect(errorSpy).toHaveBeenCalled();
  });
});
