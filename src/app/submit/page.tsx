import type { Metadata } from "next";
import Link from "next/link";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "ミーム情報を提供する | ネットミーム博物館",
  description:
    "サイトに掲載してほしいミーム情報を提供できるフォームです。GitHub Issue として運営者に届きます。",
};

export default function SubmitPage() {
  return (
    <div style={{ fontFamily: "'MS PGothic', 'MS Gothic', sans-serif" }}>
      <div style={{ fontSize: "10px", marginBottom: "6px", color: "#666" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          トップ
        </Link>
        {" > "}ミーム情報を提供する
      </div>

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
        ★ ミーム情報を提供する
      </div>

      <div
        style={{
          background: "#fafafa",
          border: "1px solid #ddd",
          padding: "8px",
          fontSize: "12px",
          lineHeight: "1.7",
          marginBottom: "12px",
        }}
      >
        <p style={{ margin: "0 0 6px" }}>
          サイトに掲載してほしいミーム情報を募集しています！
        </p>
        <p style={{ margin: 0, color: "#666", fontSize: "11px" }}>
          「あのミームが載ってない」「これも追加してほしい」など、お気軽にどうぞ。
          内容を確認の上、サイトに反映いたします。
        </p>
      </div>

      <SubmitForm />

      <div style={{ marginTop: "12px", fontSize: "11px" }}>
        <Link href="/" style={{ color: "#0000cc" }}>
          ◀ 一覧に戻る
        </Link>
      </div>
    </div>
  );
}
