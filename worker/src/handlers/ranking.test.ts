import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { handleRanking } from "./ranking";
import type { Env } from "../types";

function makeDB(results: Array<{ slug: string; count: number }>) {
  const all = vi.fn().mockResolvedValue({ success: true, results });
  const prepared = { bind: vi.fn(), all };
  prepared.bind.mockReturnValue(prepared);
  const prepare = vi.fn().mockReturnValue(prepared);
  return { DB: { prepare }, _prepare: prepare, _bind: prepared.bind, _all: all };
}

function makeEnv(db: unknown): Env {
  return {
    GITHUB_REPO: "owner/repo",
    GITHUB_TOKEN: "ghp_test",
    NOTION_WEBHOOK_SECRET: "secret",
    ALLOWED_ORIGIN: "https://example.pages.dev",
    DB: db as Env["DB"],
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/ranking", () => {
  test("D1 から上位を SELECT して JSON で返す", async () => {
    const mock = makeDB([
      { slug: "a", count: 100 },
      { slug: "b", count: 50 },
    ]);
    const env = makeEnv(mock.DB);

    const req = new Request("https://worker.example.com/api/ranking");
    const res = await handleRanking(req, env);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.pages.dev"
    );
    expect(await res.json()).toEqual({
      ranking: [
        { slug: "a", count: 100 },
        { slug: "b", count: 50 },
      ],
    });
    expect(mock._prepare.mock.calls[0][0]).toMatch(/ORDER BY count DESC/);
  });

  test("limit クエリを尊重する（1〜100 の範囲）", async () => {
    const mock = makeDB([]);
    const env = makeEnv(mock.DB);

    await handleRanking(
      new Request("https://worker.example.com/api/ranking?limit=20"),
      env
    );
    expect(mock._bind).toHaveBeenCalledWith(20);
  });

  test("limit が範囲外なら clamp する", async () => {
    const mock = makeDB([]);
    const env = makeEnv(mock.DB);

    await handleRanking(
      new Request("https://worker.example.com/api/ranking?limit=9999"),
      env
    );
    expect(mock._bind).toHaveBeenCalledWith(100);

    await handleRanking(
      new Request("https://worker.example.com/api/ranking?limit=-5"),
      env
    );
    expect(mock._bind).toHaveBeenCalledWith(1);
  });

  test("limit が数値でない場合はデフォルト 100", async () => {
    const mock = makeDB([]);
    const env = makeEnv(mock.DB);

    await handleRanking(
      new Request("https://worker.example.com/api/ranking?limit=abc"),
      env
    );
    expect(mock._bind).toHaveBeenCalledWith(100);
  });

  test("OPTIONS preflight は 204 + CORS", async () => {
    const env = makeEnv(makeDB([]).DB);
    const req = new Request("https://worker.example.com/api/ranking", {
      method: "OPTIONS",
    });
    const res = await handleRanking(req, env);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.pages.dev"
    );
  });

  test("POST は 405", async () => {
    const env = makeEnv(makeDB([]).DB);
    const req = new Request("https://worker.example.com/api/ranking", {
      method: "POST",
    });
    const res = await handleRanking(req, env);
    expect(res.status).toBe(405);
  });

  test("結果が空でも 200 + 空配列", async () => {
    const mock = makeDB([]);
    const env = makeEnv(mock.DB);

    const res = await handleRanking(
      new Request("https://worker.example.com/api/ranking"),
      env
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ranking: [] });
  });
});
