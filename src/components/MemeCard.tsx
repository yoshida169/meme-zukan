import Link from "next/link";
import Image from "next/image";
import type { Meme } from "@/types/meme";

interface MemeCardProps {
  meme: Meme;
  priority?: boolean;
}

export default function MemeCard({ meme, priority = false }: MemeCardProps) {
  return (
    <Link
      href={`/meme/${meme.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        style={{
          border: "2px outset #cccccc",
          background: "#ffffff",
          cursor: "pointer",
          fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "#fffde0";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "#ffffff";
        }}
      >
        <div
          style={{
            background: "#ff6600",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "2px 4px",
            borderBottom: "1px solid #cc4400",
          }}
        >
          {meme.name}
        </div>
        <div
          style={{
            background: "#f0f0f0",
            height: "100px",
            overflow: "hidden",
          }}
        >
          {meme.thumbnailUrl ? (
            <Image
              src={meme.thumbnailUrl}
              alt={meme.name}
              width={200}
              height={100}
              style={{ objectFit: "cover", width: "100%", height: "100px", display: "block" }}
              {...(priority
                ? { priority: true }
                : { loading: "lazy" as const })}
              unoptimized
            />
          ) : (
            <Image
              src="/noimage.png"
              alt="NO IMAGE"
              width={200}
              height={100}
              style={{ objectFit: "cover", width: "100%", height: "100px", display: "block" }}
              loading="lazy"
              unoptimized
            />
          )}
        </div>
        <div
          style={{
            fontSize: "10px",
            padding: "2px 4px",
            color: "#333",
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
        </div>
        {meme.year && (
          <div
            style={{
              background: "#f5f5f5",
              borderTop: "1px solid #ddd",
              padding: "2px 4px",
              fontSize: "10px",
              color: "#666",
            }}
          >
            {meme.year}年
          </div>
        )}
      </div>
    </Link>
  );
}
