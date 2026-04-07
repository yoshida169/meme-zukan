"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RetroHeader() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div style={{ background: "#cc0000", borderBottom: "3px solid #990000" }}>
      <table width="100%" cellPadding={4} cellSpacing={0}>
        <tbody>
          <tr>
            <td>
              <Link
                href="/"
                style={{
                  color: "#ffff00",
                  textDecoration: "none",
                  fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
                  fontSize: "20px",
                  fontWeight: "bold",
                  textShadow: "1px 1px 0 #000",
                  letterSpacing: "2px",
                }}
              >
                ★ネットミーム図鑑★
              </Link>
              <span
                style={{
                  color: "#ffffff",
                  fontSize: "10px",
                  marginLeft: "8px",
                  fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
                }}
              >
                インターネットの歴史を振り返れ！！
              </span>
            </td>
            <td align="right">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ミームを検索..."
                  style={{
                    fontSize: "12px",
                    fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
                    border: "2px inset #999",
                    padding: "1px 3px",
                    width: "160px",
                  }}
                />
                <input
                  type="submit"
                  value="検索"
                  style={{
                    fontSize: "11px",
                    fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
                    marginLeft: "2px",
                    cursor: "pointer",
                    background: "#ffff00",
                    border: "2px outset #ccc",
                    padding: "1px 6px",
                    fontWeight: "bold",
                  }}
                />
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
