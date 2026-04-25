import Link from "next/link";
import Image from "next/image";
import type { Meme } from "@/types/meme";

interface MemeCardProps {
  meme: Meme;
}


export default function MemeCard({ meme }: MemeCardProps) {
  return (
    <Link
      href={`/meme/${meme.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <table
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{
          border: "2px outset #cccccc",
          background: "#ffffff",
          cursor: "pointer",
          fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLTableElement).style.background = "#fffde0";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLTableElement).style.background = "#ffffff";
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                background: "#ff6600",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "bold",
                padding: "2px 4px",
                borderBottom: "1px solid #cc4400",
              }}
              colSpan={2}
            >
              {meme.name}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                padding: "0",
                textAlign: "center",
                background: "#f0f0f0",
                height: "100px",
                overflow: "hidden",
              }}
            >
              {meme.thumbnailUrl ? (
                <Image
                  src={meme.thumbnailUrl}
                  alt={meme.name}
                  width={160}
                  height={100}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100px",
                    display: "block",
                  }}
                  unoptimized
                />
              ) : (
                <div
                  style={{
                    height: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    background: "#dddddd",
                  }}
                >
                  🌐
                </div>
              )}
            </td>
          </tr>
          <tr>
            <td
              style={{
                fontSize: "10px",
                padding: "2px 4px",
                color: "#333",
                verticalAlign: "top",
                borderTop: "1px solid #ddd",
              }}
            >
              {meme.description ? (
                <span>
                  {meme.description.length > 40
                    ? meme.description.slice(0, 40) + "…"
                    : meme.description}
                </span>
              ) : (
                <span style={{ color: "#999" }}>説明なし</span>
              )}
            </td>
          </tr>
          {meme.year && (
            <tr>
              <td
                style={{
                  background: "#f5f5f5",
                  borderTop: "1px solid #ddd",
                  padding: "2px 4px",
                  fontSize: "10px",
                  color: "#666",
                }}
              >
                {meme.year}年
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Link>
  );
}
