import type { Metadata } from "next";
import Link from "next/link";
import { getAllMemes, getAllTags } from "@/lib/notion";
import MemeCard from "@/components/MemeCard";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `タグ「${decoded}」のミーム | ネットミーム図鑑`,
    description: `「${decoded}」タグのネットミーム一覧`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const allMemes = await getAllMemes();
  const memes = allMemes.filter((m) => m.tags.includes(decoded));

  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      {/* パンくず */}
      <div style={{ fontSize: "10px", marginBottom: "6px", color: "#666" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          トップ
        </Link>
        {" > "}タグ: {decoded}
      </div>

      {/* タイトル帯 */}
      <div
        style={{
          background: "#ff6600",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "bold",
          padding: "3px 6px",
          marginBottom: "8px",
          borderBottom: "2px solid #cc4400",
        }}
      >
        ■ タグ「{decoded}」のミーム ({memes.length}件)
      </div>

      {memes.length === 0 ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            fontSize: "12px",
            color: "#666",
            background: "#f0f0f0",
            border: "1px solid #ccc",
          }}
        >
          このタグのミームはまだ登録されていません。
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "6px",
          }}
        >
          {memes.map((meme) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>
      )}

      <div style={{ marginTop: "12px", fontSize: "11px" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          ◀ 一覧に戻る
        </Link>
      </div>
    </div>
  );
}
