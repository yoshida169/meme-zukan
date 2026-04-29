import type { Metadata } from "next";
import RetroHeader from "@/components/RetroHeader";
import RetroFooter from "@/components/RetroFooter";
import RetroNav from "@/components/RetroNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ネットミーム博物館",
  description: "インターネットの歴史に残るネットミームを総まとめ！",
  openGraph: {
    title: "ネットミーム博物館",
    description: "インターネットの歴史に残るネットミームを総まとめ！",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#cccccc",
          fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
        }}
      >
        <div
          style={{
            width: "95%",
            maxWidth: "1200px",
            margin: "0 auto",
            background: "#ffffff",
            border: "1px solid #999999",
          }}
        >
          <RetroHeader />

          {/* メインレイアウト: サイドバー + コンテンツ */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            className="layout-table"
          >
            <tbody>
              <tr>
                <td className="layout-sidebar-cell">
                  <RetroNav />
                </td>
                <td className="layout-content-cell">
                  {children}
                </td>
              </tr>
            </tbody>
          </table>

          <RetroFooter />
        </div>
      </body>
    </html>
  );
}
