import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllMemes } from "@/lib/notion";
import type { Meme } from "@/types/meme";

export const metadata: Metadata = {
  title: "ミーム年表 | ネットミーム図鑑",
  description: "インターネットミームを流行した年代順に並べた年表です。",
};

const popularityOrder = ["🔥大流行", "😊中規模", "🌱ニッチ"];

function sortByPopularity(a: Meme, b: Meme): number {
  const ai = a.popularity ? popularityOrder.indexOf(a.popularity) : 99;
  const bi = b.popularity ? popularityOrder.indexOf(b.popularity) : 99;
  return ai - bi;
}

export default async function TimelinePage() {
  const memes = await getAllMemes();

  // year でグループ化（yearなし → 「不明」）
  const grouped = new Map<string, Meme[]>();
  for (const meme of memes) {
    const key = meme.year ? String(meme.year) : "不明";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(meme);
  }

  // 年代降順ソート（「不明」は末尾）
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "不明") return 1;
    if (b === "不明") return -1;
    return Number(b) - Number(a);
  });

  // 各年内を人気度順にソート
  for (const key of sortedKeys) {
    grouped.get(key)!.sort(sortByPopularity);
  }

  const decades = Array.from(
    new Set(
      sortedKeys
        .filter((k) => k !== "不明")
        .map((k) => `${Math.floor(Number(k) / 10) * 10}年代`)
    )
  );

  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      {/* パンくず */}
      <div style={{ fontSize: "10px", marginBottom: "6px", color: "#666" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          トップ
        </Link>
        {" > "}
        <span>ミーム年表</span>
      </div>

      {/* タイトル帯 */}
      <div
        style={{
          background: "#cc0000",
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "bold",
          padding: "4px 8px",
          borderBottom: "2px solid #990000",
          marginBottom: "8px",
        }}
      >
        ★ ミーム年表
      </div>

      {/* 年代ジャンプリンク */}
      {decades.length > 0 && (
        <div
          style={{
            background: "#ffffcc",
            border: "1px solid #cc9900",
            padding: "4px 8px",
            fontSize: "11px",
            marginBottom: "10px",
          }}
        >
          <strong>◆ 年代ジャンプ：</strong>
          {decades.map((d, i) => {
            const decade = d.replace("年代", "");
            return (
              <span key={d}>
                {i > 0 && " ／ "}
                <a href={`#decade-${decade}`} style={{ color: "#0000cc" }}>
                  [{d}]
                </a>
              </span>
            );
          })}
        </div>
      )}

      {/* 年表本体 */}
      {sortedKeys.map((year) => {
        const items = grouped.get(year)!;
        const decade =
          year !== "不明"
            ? String(Math.floor(Number(year) / 10) * 10)
            : undefined;

        // その年代の最初の年かどうか（見出し用アンカー設置判定）
        const isFirstOfDecade =
          decade &&
          sortedKeys
            .filter((k) => k !== "不明")
            .find(
              (k) => Math.floor(Number(k) / 10) * 10 === Number(decade)
            ) === year;

        return (
          <div key={year} style={{ marginBottom: "16px" }}>
            {isFirstOfDecade && (
              <span id={`decade-${decade}`} style={{ display: "block", height: 0 }} />
            )}

            {/* 年見出し */}
            <div
              style={{
                background: "#003399",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "bold",
                padding: "3px 8px",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>■ {year !== "不明" ? `${year}年` : "流行年不明"}</span>
              <span style={{ fontSize: "10px", color: "#aaccff" }}>
                （{items.length}件）
              </span>
            </div>

            {/* ミーム一覧テーブル */}
            <table
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              style={{ borderCollapse: "collapse", fontSize: "12px" }}
            >
              <tbody>
                {items.map((meme, idx) => (
                  <tr
                    key={meme.id}
                    style={{ background: idx % 2 === 0 ? "#f5f5ff" : "#ffffff" }}
                  >
                    {/* サムネイル */}
                    <td
                      style={{
                        width: "64px",
                        padding: "3px",
                        border: "1px solid #ddd",
                        borderTop: "none",
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

                    {/* 名前・説明 */}
                    <td
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #ddd",
                        borderTop: "none",
                        borderLeft: "none",
                        verticalAlign: "top",
                      }}
                    >
                      <div>
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
                        {meme.popularity && (
                          <span
                            style={{
                              marginLeft: "6px",
                              fontSize: "10px",
                              color: "#666",
                            }}
                          >
                            {meme.popularity}
                          </span>
                        )}
                      </div>
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

                    {/* 発祥元 */}
                    <td
                      style={{
                        width: "90px",
                        padding: "4px 6px",
                        border: "1px solid #ddd",
                        borderTop: "none",
                        borderLeft: "none",
                        verticalAlign: "middle",
                        fontSize: "11px",
                        color: "#333",
                        textAlign: "center",
                      }}
                    >
                      {meme.origin ? (
                        <Link
                          href={`/?origin=${encodeURIComponent(meme.origin)}`}
                          style={{ color: "#660000", textDecoration: "none" }}
                        >
                          [{meme.origin}]
                        </Link>
                      ) : (
                        <span style={{ color: "#999" }}>-</span>
                      )}
                    </td>

                    {/* タグ */}
                    <td
                      style={{
                        width: "140px",
                        padding: "4px 6px",
                        border: "1px solid #ddd",
                        borderTop: "none",
                        borderLeft: "none",
                        verticalAlign: "middle",
                      }}
                    >
                      {meme.tags.slice(0, 3).map((tag) => (
                        <Link
                          key={tag}
                          href={`/tag/${encodeURIComponent(tag)}`}
                          style={{
                            display: "inline-block",
                            background: "#003399",
                            color: "#fff",
                            padding: "0px 4px",
                            marginRight: "2px",
                            marginBottom: "2px",
                            fontSize: "10px",
                            textDecoration: "none",
                            border: "1px outset #6666cc",
                          }}
                        >
                          {tag}
                        </Link>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div style={{ marginTop: "12px", fontSize: "11px" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          ◀ 一覧に戻る
        </Link>
      </div>
    </div>
  );
}
