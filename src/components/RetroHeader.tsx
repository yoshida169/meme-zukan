import Link from "next/link";

export default function RetroHeader() {
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
                ★ネットミーム博物館★
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
          </tr>
        </tbody>
      </table>
    </div>
  );
}
