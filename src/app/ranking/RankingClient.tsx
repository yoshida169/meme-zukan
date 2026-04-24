"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Meme } from "@/types/meme";

interface Props {
  memes: Meme[];
}

interface RankingEntry {
  slug: string;
  count: number;
}

type State =
  | { kind: "unconfigured" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; entries: RankingEntry[] };

function rankMark(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}位`;
}

export default function RankingClient({ memes }: Props) {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  const [state, setState] = useState<State>(() =>
    workerUrl ? { kind: "loading" } : { kind: "unconfigured" }
  );

  useEffect(() => {
    if (!workerUrl) return;

    let cancelled = false;
    fetch(`${workerUrl}/api/ranking?limit=100`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { ranking: RankingEntry[] };
        if (cancelled) return;
        setState({ kind: "ready", entries: data.ranking ?? [] });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({ kind: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [workerUrl]);

  if (state.kind === "unconfigured") {
    return (
      <div
        style={{
          background: "#fafafa",
          border: "1px dashed #999",
          padding: "12px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        ランキング機能は現在準備中です（Worker URL が未設定）。
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <div style={{ fontSize: "12px", padding: "8px", color: "#666" }}>
        読み込み中…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        style={{
          background: "#ffeeee",
          border: "1px solid #cc0000",
          padding: "8px",
          fontSize: "12px",
          color: "#cc0000",
        }}
      >
        ランキングの取得に失敗しました: {state.message}
      </div>
    );
  }

  const memeBySlug = new Map(memes.map((m) => [m.slug, m]));
  const rows = state.entries
    .map((entry) => ({ entry, meme: memeBySlug.get(entry.slug) }))
    .filter((row): row is { entry: RankingEntry; meme: Meme } => !!row.meme);

  if (rows.length === 0) {
    return (
      <div
        style={{
          background: "#fafafa",
          border: "1px solid #ddd",
          padding: "12px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        まだランキングデータがありません。各ミームページを訪問すると集計が始まります。
      </div>
    );
  }

  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ borderCollapse: "collapse", fontSize: "12px" }}
    >
      <tbody>
        {rows.map(({ entry, meme }, idx) => {
          const rank = idx + 1;
          return (
            <tr
              key={meme.id}
              style={{ background: idx % 2 === 0 ? "#f5f5ff" : "#ffffff" }}
            >
              <td
                style={{
                  width: "50px",
                  padding: "4px",
                  border: "1px solid #ddd",
                  borderTop: idx === 0 ? "1px solid #ddd" : "none",
                  textAlign: "center",
                  verticalAlign: "middle",
                  fontWeight: "bold",
                  color: rank <= 3 ? "#cc0000" : "#333",
                }}
              >
                {rankMark(rank)}
              </td>
              <td
                style={{
                  width: "64px",
                  padding: "3px",
                  border: "1px solid #ddd",
                  borderTop: idx === 0 ? "1px solid #ddd" : "none",
                  borderLeft: "none",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                {meme.thumbnailUrl ? (
                  <Image
                    src={meme.thumbnailUrl}
                    alt={meme.name}
                    width={60}
                    height={44}
                    style={{ objectFit: "cover", display: "block" }}
                    unoptimized
                  />
                ) : (
                  <div
                    style={{
                      width: "60px",
                      height: "44px",
                      background: "#ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    🌐
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ddd",
                  borderTop: idx === 0 ? "1px solid #ddd" : "none",
                  borderLeft: "none",
                  verticalAlign: "top",
                }}
              >
                <Link
                  href={`/meme/${meme.slug}`}
                  style={{
                    color: "#0000cc",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  ▶ {meme.name}
                </Link>
                {meme.description && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#444",
                      marginTop: "2px",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {meme.description}
                  </div>
                )}
              </td>
              <td
                style={{
                  width: "80px",
                  padding: "4px 6px",
                  border: "1px solid #ddd",
                  borderTop: idx === 0 ? "1px solid #ddd" : "none",
                  borderLeft: "none",
                  textAlign: "right",
                  verticalAlign: "middle",
                  fontSize: "11px",
                  color: "#333",
                }}
              >
                <strong>{entry.count.toLocaleString()}</strong> 回
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
