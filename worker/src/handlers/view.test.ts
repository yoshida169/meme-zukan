import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { handleView } from "./view";
import type { Env } from "../types";

const HUMAN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15";

function makeDB(runImpl: () => Promise<unknown> = async () => ({ success: true })) {
  const bind = vi.fn();
  const run = vi.fn(runImpl);
  const prepared = { bind: vi.fn(), run };
  prepared.bind.mockReturnValue(prepared);
  const prepare = vi.fn().mockReturnValue(prepared);
  return { DB: { prepare }, _prepare: prepare, _bind: prepared.bind, _run: run };
}

function makeEnv(overrides: Partial<Env> = {}): Env {
  const { DB } = makeDB();
  return {
    GITHUB_REPO: "owner/repo",
    GITHUB_TOKEN: "ghp_test",
    NOTION_WEBHOOK_SECRET: "secret",
    ALLOWED_ORIGIN: "https://example.pages.dev",
    DB: DB as unknown as Env["DB"],
    ...overrides,
  };
}

function makeRequest(body: unknown, ua: string = HUMAN_UA, method = "POST") {
  return new Request("https://worker.example.com/api/view", {
    method,
    body: method === "POST" ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ua,
    },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-24T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("POST /api/view", () => {
  test("正常系: UPSERT クエリが slug と timestamp で bind される", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });
    const ctx = { waitUntil: vi.fn() };

    const res = await handleView(makeRequest({ slug: "neko-meme" }), env, ctx);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.pages.dev"
    );
    expect(mock._prepare).toHaveBeenCalledTimes(1);
    expect(mock._prepare.mock.calls[0][0]).toMatch(/INSERT INTO meme_views/);
    expect(mock._bind).toHaveBeenCalledWith("neko-meme", Date.now());
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);
  });

  test("bot UA はカウントせず 204 を返す", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    const res = await handleView(
      makeRequest({ slug: "neko-meme" }, "Googlebot/2.1"),
      env
    );

    expect(res.status).toBe(204);
    expect(mock._prepare).not.toHaveBeenCalled();
  });

  test("User-Agent 欠落でも bot 扱い（計測せず 204）", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    const req = new Request("https://worker.example.com/api/view", {
      method: "POST",
      body: JSON.stringify({ slug: "x" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleView(req, env);

    expect(res.status).toBe(204);
    expect(mock._prepare).not.toHaveBeenCalled();
  });

  test("slug 欠落で 400", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    const res = await handleView(makeRequest({}), env);

    expect(res.status).toBe(400);
    expect(mock._prepare).not.toHaveBeenCalled();
  });

  test("slug が空文字で 400", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    const res = await handleView(makeRequest({ slug: "   " }), env);

    expect(res.status).toBe(400);
  });

  test("slug が異常に長いと 400", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    const res = await handleView(
      makeRequest({ slug: "a".repeat(201) }),
      env
    );

    expect(res.status).toBe(400);
  });

  test("不正な JSON で 400", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    const req = new Request("https://worker.example.com/api/view", {
      method: "POST",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": HUMAN_UA,
      },
    });
    const res = await handleView(req, env);

    expect(res.status).toBe(400);
  });

  test("OPTIONS preflight は 204 + CORS ヘッダ", async () => {
    const env = makeEnv();
    const req = new Request("https://worker.example.com/api/view", {
      method: "OPTIONS",
    });
    const res = await handleView(req, env);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.pages.dev"
    );
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  test("GET は 405", async () => {
    const env = makeEnv();
    const res = await handleView(makeRequest({ slug: "x" }, HUMAN_UA, "GET"), env);
    expect(res.status).toBe(405);
  });

  test("ctx 未指定時は同期的に書き込みを待つ", async () => {
    const mock = makeDB();
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });

    await handleView(makeRequest({ slug: "x" }), env);

    expect(mock._run).toHaveBeenCalledTimes(1);
  });

  test("D1 書き込み失敗してもクライアントには 204 を返す", async () => {
    const mock = makeDB(async () => {
      throw new Error("db down");
    });
    const env = makeEnv({ DB: mock.DB as unknown as Env["DB"] });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await handleView(makeRequest({ slug: "x" }), env);

    expect(res.status).toBe(204);
    expect(errSpy).toHaveBeenCalled();
  });
});
