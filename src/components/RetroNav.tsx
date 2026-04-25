import Link from "next/link";

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        style={{
          background: "#003399",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "bold",
          fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
          padding: "2px 4px",
          borderBottom: "1px solid #000066",
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: "#eeeeff",
          border: "1px solid #9999cc",
          borderTop: "none",
          padding: "3px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function RetroNav() {
  return (
    <div
      style={{
        width: "130px",
        minWidth: "130px",
        fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
        fontSize: "11px",
      }}
    >
      <NavSection title="■ メニュー">
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            lineHeight: "1.8",
          }}
        >
          <li>
            <Link href="/" style={{ color: "#0000cc", textDecoration: "none" }}>
              ▶ トップ
            </Link>
          </li>
          <li>
            <Link
              href="/ranking"
              style={{ color: "#cc0000", textDecoration: "none" }}
            >
              ▶ 人気ランキング
            </Link>
          </li>
        </ul>
      </NavSection>

      <NavSection title="■ このサイトについて">
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            lineHeight: "1.8",
          }}
        >
          <li>
            <Link
              href="/about"
              style={{ color: "#0000cc", textDecoration: "none" }}
            >
              ▶ サイト概要
            </Link>
          </li>
        </ul>
      </NavSection>

      <div
        style={{
          background: "#ffffcc",
          border: "1px solid #cc9900",
          padding: "4px",
          fontSize: "10px",
          color: "#333",
          marginTop: "8px",
          lineHeight: "1.5",
        }}
      >
        <strong>★お知らせ★</strong>
        <br />
        ミームを随時追加中！
        <br />
        情報提供お待ちしてます
      </div>
    </div>
  );
}
