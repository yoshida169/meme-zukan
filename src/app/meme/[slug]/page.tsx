import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllMemes, getMemeBySlug } from "@/lib/notion";
import ViewTracker from "@/components/ViewTracker";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const memes = await getAllMemes();
  return memes.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meme = await getMemeBySlug(slug);
  if (!meme) return {};
  return {
    title: `${meme.name} | ネットミーム博物館`,
    description: meme.description,
    openGraph: {
      title: meme.name,
      description: meme.description,
      images: meme.thumbnailUrl ? [{ url: meme.thumbnailUrl }] : [],
    },
  };
}

export default async function MemePage({ params }: Props) {
  const { slug } = await params;
  const meme = await getMemeBySlug(slug);
  if (!meme) notFound();

  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      {/* パンくず */}
      <div style={{ fontSize: "10px", marginBottom: "6px", color: "#666" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          トップ
        </Link>
        {" > "}
        <span>{meme.name}</span>
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
        ★ {meme.name}
      </div>

      {/* メインコンテンツ */}
      <table className="meme-detail-table" cellPadding={6} cellSpacing={0}>
        <tbody>
          <tr>
            {/* サムネイル */}
            <td className="meme-detail-image-cell">
              <div
                style={{
                  border: "2px inset #cccccc",
                  background: "#f0f0f0",
                  textAlign: "center",
                  minHeight: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {meme.thumbnailUrl ? (
                  <Image
                    src={meme.thumbnailUrl}
                    alt={meme.name}
                    width={200}
                    height={150}
                    style={{ objectFit: "contain", maxWidth: "100%" }}
                    unoptimized
                  />
                ) : (
                  <span style={{ fontSize: "48px" }}>🌐</span>
                )}
              </div>

              {/* メタ情報ボックス */}
              <table
                width="100%"
                cellPadding={2}
                cellSpacing={1}
                style={{
                  marginTop: "6px",
                  fontSize: "11px",
                  background: "#eeeeee",
                  border: "1px solid #cccccc",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        background: "#003399",
                        color: "#fff",
                        fontWeight: "bold",
                        padding: "2px 4px",
                      }}
                    >
                      流行年
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      {meme.year ? `${meme.year}年` : "不明"}
                    </td>
                  </tr>
                  {meme.sourceUrl && (
                    <tr>
                      <td
                        style={{
                          background: "#003399",
                          color: "#fff",
                          fontWeight: "bold",
                          padding: "2px 4px",
                        }}
                      >
                        元ネタ
                      </td>
                      <td style={{ padding: "2px 4px" }}>
                        <a
                          href={meme.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#0000cc" }}
                        >
                          リンク
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>

            {/* 説明 */}
            <td className="meme-detail-desc-cell">
              <div
                style={{
                  background: "#ff6600",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "11px",
                  padding: "2px 4px",
                  marginBottom: "4px",
                }}
              >
                ■ 解説
              </div>
              <div
                style={{
                  fontSize: "12px",
                  lineHeight: "1.7",
                  padding: "4px",
                  background: "#fafafa",
                  border: "1px solid #ddd",
                  minHeight: "80px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {meme.description || "説明が登録されていません。"}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: "12px", fontSize: "11px" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          ◀ 一覧に戻る
        </Link>
      </div>

      <ViewTracker slug={meme.slug} />
    </div>
  );
}
