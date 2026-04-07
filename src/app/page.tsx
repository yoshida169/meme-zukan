import { Suspense } from "react";
import { getAllMemes } from "@/lib/notion";
import MemeGrid from "@/components/MemeGrid";

export default async function Home() {
  const memes = await getAllMemes();

  return (
    <div>
      {/* ページタイトル帯 */}
      <div
        style={{
          background: "#ff6600",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "bold",
          fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
          padding: "3px 6px",
          marginBottom: "6px",
          borderBottom: "2px solid #cc4400",
        }}
      >
        ■ ネットミーム一覧 ({memes.length}件)
      </div>

      <Suspense
        fallback={
          <div
            style={{
              fontSize: "12px",
              fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
              color: "#666",
              padding: "20px",
              textAlign: "center",
            }}
          >
            読み込み中...
          </div>
        }
      >
        <MemeGrid memes={memes} />
      </Suspense>
    </div>
  );
}
