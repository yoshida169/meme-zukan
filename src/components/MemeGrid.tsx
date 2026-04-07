"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import MemeCard from "./MemeCard";
import type { Meme } from "@/types/meme";

interface MemeGridProps {
  memes: Meme[];
}

const popularityOrder: Record<string, number> = {
  "🔥大流行": 0,
  "😊中規模": 1,
  "🌱ニッチ": 2,
};

export default function MemeGrid({ memes }: MemeGridProps) {
  const searchParams = useSearchParams();
  const [sort, setSort] = useState<"new" | "year" | "popular">(
    (searchParams.get("sort") as "new" | "year" | "popular") ?? "new"
  );
  const [origin, setOrigin] = useState(searchParams.get("origin") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const allTags = useMemo(
    () => Array.from(new Set(memes.flatMap((m) => m.tags))).sort(),
    [memes]
  );
  const allOrigins = useMemo(
    () =>
      Array.from(new Set(memes.map((m) => m.origin).filter(Boolean))).sort(),
    [memes]
  );

  const filtered = useMemo(() => {
    let list = [...memes];
    if (query)
      list = list.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase())
      );
    if (origin) list = list.filter((m) => m.origin === origin);
    if (tag) list = list.filter((m) => m.tags.includes(tag));

    if (sort === "year")
      list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    else if (sort === "popular")
      list.sort(
        (a, b) =>
          (popularityOrder[a.popularity ?? ""] ?? 99) -
          (popularityOrder[b.popularity ?? ""] ?? 99)
      );
    else
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return list;
  }, [memes, query, origin, tag, sort]);

  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      {/* フィルターバー */}
      <table
        width="100%"
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
                style={{
                  fontSize: "11px",
                  border: "1px inset #999",
                  padding: "1px 3px",
                  width: "140px",
                }}
              />
            </td>
            <td>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{ fontSize: "11px", border: "1px inset #999" }}
              >
                <option value="">発祥元: すべて</option>
                {allOrigins.map((o) => (
                  <option key={o} value={o!}>
                    {o}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={{ fontSize: "11px", border: "1px inset #999" }}
              >
                <option value="">タグ: すべて</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "new" | "year" | "popular")
                }
                style={{ fontSize: "11px", border: "1px inset #999" }}
              >
                <option value="new">新着順</option>
                <option value="year">年代順</option>
                <option value="popular">人気順</option>
              </select>
            </td>
            <td style={{ color: "#666" }}>{filtered.length}件</td>
          </tr>
        </tbody>
      </table>

      {/* カードグリッド */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
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
          filtered.map((meme) => <MemeCard key={meme.id} meme={meme} />)
        )}
      </div>
    </div>
  );
}
