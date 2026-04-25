import type { Metadata } from "next";
import Link from "next/link";
import { getAllMemes } from "@/lib/notion";
import RankingClient from "./RankingClient";

export const metadata: Metadata = {
  title: "人気ランキング | ネットミーム博物館",
  description: "累計閲覧数で並べたネットミームの人気ランキング",
};

export default async function RankingPage() {
  const memes = await getAllMemes();

  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      <div style={{ fontSize: "10px", marginBottom: "6px", color: "#666" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          トップ
        </Link>
        {" > "}
        <span>人気ランキング</span>
      </div>

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
        ★ 人気ランキング
      </div>

      <div
        style={{
          background: "#ffffcc",
          border: "1px solid #cc9900",
          padding: "4px 8px",
          fontSize: "11px",
          marginBottom: "10px",
          lineHeight: "1.5",
        }}
      >
        ◆ 累計閲覧数で並べたトップ100。5分程度のキャッシュで更新されます。
      </div>

      <RankingClient memes={memes} />

      <div style={{ marginTop: "12px", fontSize: "11px" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          ◀ 一覧に戻る
        </Link>
      </div>
    </div>
  );
}
