export default function RetroFooter() {
  return (
    <div
      style={{
        background: "#003399",
        borderTop: "3px solid #000066",
        marginTop: "12px",
        padding: "6px",
        textAlign: "center",
        fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
        fontSize: "10px",
        color: "#ffffff",
      }}
    >
      <div style={{ marginBottom: "4px" }}>
        <span style={{ color: "#ffff00", fontWeight: "bold" }}>
          ★ネットミーム図鑑★
        </span>
        &nbsp;―&nbsp;インターネットの歴史を後世に残す
      </div>
      <div style={{ marginTop: "4px", color: "#88aaff", fontSize: "9px" }}>
        ブラウザはInternet Explorer 6.0以上推奨（嘘）
      </div>
    </div>
  );
}
