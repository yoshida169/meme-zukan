import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import RankingClient from "./RankingClient";
import type { Meme } from "@/types/meme";

const WORKER_URL = "https://worker.example.com";

const memes: Meme[] = [
  {
    id: "1",
    name: "猫ミーム",
    slug: "neko",
    description: "猫のミーム",
    thumbnailUrl: null,
    tags: [],
    year: 2024,
    status: "published",
    sourceUrl: null,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "犬ミーム",
    slug: "inu",
    description: "犬のミーム",
    thumbnailUrl: null,
    tags: [],
    year: 2023,
    status: "published",
    sourceUrl: null,
    createdAt: "2023-06-01",
  },
];

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_WORKER_URL", WORKER_URL);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("RankingClient", () => {
  test("Worker URL 未設定時は案内を表示", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "");
    render(<RankingClient memes={memes} />);
    expect(screen.getByText(/準備中/)).toBeInTheDocument();
  });

  test("loading → data 遷移でランキングを表示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ranking: [
              { slug: "neko", count: 120 },
              { slug: "inu", count: 80 },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<RankingClient memes={memes} />);
    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("▶ 猫ミーム")).toBeInTheDocument();
    });
    expect(screen.getByText("▶ 犬ミーム")).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
    expect(screen.getByText("👑")).toBeInTheDocument();
  });

  test("fetch 失敗時はエラー表示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    render(<RankingClient memes={memes} />);

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました/)).toBeInTheDocument();
    });
    expect(screen.getByText(/network down/)).toBeInTheDocument();
  });

  test("HTTPエラーレスポンスでエラー表示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );

    render(<RankingClient memes={memes} />);

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/)).toBeInTheDocument();
    });
  });

  test("ランキングが空なら案内メッセージ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ranking: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(<RankingClient memes={memes} />);

    await waitFor(() => {
      expect(
        screen.getByText(/まだランキングデータがありません/)
      ).toBeInTheDocument();
    });
  });

  test("存在しない slug は無視される", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ranking: [
              { slug: "neko", count: 5 },
              { slug: "deleted-meme", count: 999 },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    render(<RankingClient memes={memes} />);

    await waitFor(() => {
      expect(screen.getByText("▶ 猫ミーム")).toBeInTheDocument();
    });
    expect(screen.queryByText("deleted-meme")).not.toBeInTheDocument();
  });
});
