import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "このサイトについて | ネットミーム図鑑",
  description: "ネットミーム図鑑のサイト概要です。",
};

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      {/* パンくず */}
      <div style={{ fontSize: "10px", marginBottom: "6px", color: "#666" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          トップ
        </Link>
        {" > "}このサイトについて
      </div>

      {/* タイトル帯 */}
      <div
        style={{
          background: "#cc0000",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "bold",
          padding: "4px 8px",
          borderBottom: "2px solid #990000",
          marginBottom: "10px",
        }}
      >
        ★ このサイトについて
      </div>

      <table
        width="100%"
        cellPadding={0}
        cellSpacing={4}
        style={{ fontSize: "12px", lineHeight: "1.8" }}
      >
        <tbody>
          <tr>
            <td>
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
                ■ サイト概要
              </div>
              <div
                style={{
                  padding: "8px",
                  background: "#fafafa",
                  border: "1px solid #ddd",
                  marginBottom: "10px",
                }}
              >
                <p style={{ margin: "0 0 8px" }}>
                  <strong>ネットミーム図鑑</strong>
                  は、インターネット上で流行したミームを収集・記録するサイトです。
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  2ch、Twitter/X、Reddit、TikTokなど様々なプラットフォームから生まれたミームを、後世に残すことを目的としています。
                </p>
                <p style={{ margin: 0 }}>
                  情報は随時追加しています。懐かしいミームから最新のミームまで、幅広く掲載予定です。
                </p>
              </div>

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
                ■ 技術情報
              </div>
              <div
                style={{
                  padding: "8px",
                  background: "#fafafa",
                  border: "1px solid #ddd",
                  marginBottom: "10px",
                }}
              >
                <table cellPadding={3} cellSpacing={1} style={{ fontSize: "11px" }}>
                  <tbody>
                    <tr>
                      <td style={{ background: "#003399", color: "#fff", padding: "2px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>フレームワーク</td>
                      <td>Next.js (SSG)</td>
                    </tr>
                    <tr>
                      <td style={{ background: "#003399", color: "#fff", padding: "2px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>データ管理</td>
                      <td>Notion</td>
                    </tr>
                    <tr>
                      <td style={{ background: "#003399", color: "#fff", padding: "2px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>ホスティング</td>
                      <td>Cloudflare Pages</td>
                    </tr>
                    <tr>
                      <td style={{ background: "#003399", color: "#fff", padding: "2px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>デプロイ</td>
                      <td>GitHub Actions (6時間ごと自動更新)</td>
                    </tr>
                  </tbody>
                </table>
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
    </div>
  );
}
