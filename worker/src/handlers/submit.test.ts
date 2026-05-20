import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { handleSubmit } from "./submit";
import type { Env } from "../types";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    GITHUB_REPO: "owner/repo",
    GITHUB_TOKEN: "ghp_test",
    NOTION_WEBHOOK_SECRET: "secret",
    ALLOWED_ORIGIN: "https://example.pages.dev",
    DB: {
      prepare: () => {
        throw new Error("DB should not be used");
      },
    } as unknown as Env["DB"],
    ...overrides,
  };
}

function makeRequest(body: unknown, method = "POST") {
  return new Request("https://worker.example.com/api/submit", {
    method,
    body: method === "POST" ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/submit", () => {
  test("OPTIONS は 204 を返す (preflight)", async () => {
    const req = new Request("https://worker.example.com/api/submit", {
      method: "OPTIONS",
    });
    const res = await handleSubmit(req, makeEnv());
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.pages.dev"
    );
  });

  test("GET は 405", async () => {
    const req = makeRequest(null, "GET");
    const res = await handleSubmit(req, makeEnv());
    expect(res.status).toBe(405);
  });

  test("不正な JSON は 400", async () => {
    const req = new Request("https://worker.example.com/api/submit", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleSubmit(req, makeEnv());
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("name か description が無いと 400", async () => {
    const res = await handleSubmit(
      makeRequest({ name: "あ" }),
      makeEnv()
    );
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("honeypot に値が入っていたら 204 を返し GitHub を叩かない", async () => {
    const res = await handleSubmit(
      makeRequest({
        name: "test",
        description: "desc",
        website: "spam",
      }),
      makeEnv()
    );
    expect(res.status).toBe(204);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("無効な sourceUrl は 400", async () => {
    const res = await handleSubmit(
      makeRequest({
        name: "test",
        description: "desc",
        sourceUrl: "javascript:alert(1)",
      }),
      makeEnv()
    );
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("年が範囲外なら 400", async () => {
    const res = await handleSubmit(
      makeRequest({
        name: "test",
        description: "desc",
        year: 1800,
      }),
      makeEnv()
    );
    expect(res.status).toBe(400);
  });

  test("正常な送信で GitHub Issue を作成し 201 を返す", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify({ number: 42 }), { status: 201 })
    );

    const res = await handleSubmit(
      makeRequest({
        name: "草",
        description: "笑いを表す表現",
        year: 2010,
        origin: "2ch",
        sourceUrl: "https://example.com",
        submitter: "anon",
      }),
      makeEnv()
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/owner/repo/issues");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer ghp_test",
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "meme-zukan-submit-worker",
    });
    const payload = JSON.parse(init.body);
    expect(payload.title).toBe("[ミーム情報提供] 草");
    expect(payload.labels).toEqual(["meme-submission"]);
    expect(payload.body).toContain("**名前**: 草");
    expect(payload.body).toContain("**発祥年**: 2010");
    expect(payload.body).toContain("**発祥**: 2ch");
    expect(payload.body).toContain("**ソースURL**: https://example.com");
    expect(payload.body).toContain("**提供者**: anon");
    expect(payload.body).toContain("笑いを表す表現");
  });

  test("任意項目を省略しても通り、未記入が body に入る", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response("{}", { status: 201 })
    );
    await handleSubmit(
      makeRequest({ name: "?", description: "なんか" }),
      makeEnv()
    );
    const init = (global.fetch as any).mock.calls[0][1];
    const payload = JSON.parse(init.body);
    expect(payload.body).toContain("**発祥年**: (未記入)");
    expect(payload.body).toContain("**提供者**: (匿名)");
  });

  test("GitHub API がエラーなら 502", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response("nope", { status: 401 })
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handleSubmit(
      makeRequest({ name: "x", description: "y" }),
      makeEnv()
    );
    expect(res.status).toBe(502);
    expect(errSpy).toHaveBeenCalled();
  });
});
