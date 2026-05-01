"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import MemeCard from "./MemeCard";
import type { Meme } from "@/types/meme";

interface MemeGridProps {
  memes: Meme[];
}

export default function MemeGrid({ memes }: MemeGridProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const filtered = useMemo(() => {
    if (!query) return memes;
    return memes.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [memes, query]);

  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      {/* フィルターバー */}
      <table
        cellPadding={3}
        cellSpacing={0}
        style={{
          background: "#ffffcc",
          border: "1px solid #cc9900",
          marginBottom: "6px",
          fontSize: "11px",
        }}
      >
        <tbody>
          <tr>
            <td style={{ whiteSpace: "nowrap", fontWeight: "bold" }}>
              絞り込み：
            </td>
            <td>
              <input
                type="text"
                placeholder="ミーム名で検索"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
                style={{
                  fontSize: "11px",
                  border: "1px inset #999",
                  padding: "1px 3px",
                  width: "180px",
                }}
              />
            </td>
            <td style={{ color: "#666", whiteSpace: "nowrap" }}>{filtered.length}件</td>
          </tr>
        </tbody>
      </table>

      {/* カードグリッド */}
      <div
        className="meme-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "6px",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "20px",
              color: "#666",
              fontSize: "12px",
              background: "#f0f0f0",
              border: "1px solid #ccc",
            }}
          >
            該当するミームが見つかりませんでした
          </div>
        ) : (
          filtered.map((meme, index) => (
            <MemeCard key={meme.id} meme={meme} priority={index < 16} />
          ))
        )}
      </div>
    </div>
  );
}
