"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const ORIGIN_OPTIONS = [
  "",
  "2ch / 5ch",
  "Twitter / X",
  "ニコニコ動画",
  "YouTube",
  "TikTok",
  "Reddit",
  "Instagram",
  "掲示板",
  "その他",
];

export default function SubmitForm() {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [origin, setOrigin] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) {
      setStatus("error");
      setErrorMsg("送信先が設定されていません。サイト管理者にご連絡ください。");
      return;
    }
    if (!name.trim() || !description.trim()) {
      setStatus("error");
      setErrorMsg("ミーム名と説明は必須です。");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`${workerUrl}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          year: year.trim() ? Number(year.trim()) : null,
          origin: origin.trim(),
          sourceUrl: sourceUrl.trim(),
          submitter: submitter.trim(),
          website,
        }),
      });

      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setStatus("success");
      setName("");
      setYear("");
      setOrigin("");
      setSourceUrl("");
      setSubmitter("");
      setDescription("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "送信に失敗しました。"
      );
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          background: "#ffffcc",
          border: "2px solid #cc9900",
          padding: "12px",
          fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
          fontSize: "12px",
          lineHeight: "1.8",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            color: "#cc0000",
            fontSize: "13px",
            marginBottom: "6px",
          }}
        >
          ★ 送信完了！ ★
        </div>
        <div>
          ご提供ありがとうございます！内容を確認の上、サイトに反映いたします。
        </div>
        <div style={{ marginTop: "8px" }}>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            style={btnStyle}
          >
            続けて提供する
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
        fontSize: "12px",
      }}
    >
      {/* honeypot: 見えないけど bot は埋めがち */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label>
          Website (do not fill)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <table
        width="100%"
        cellPadding={4}
        cellSpacing={0}
        style={{ borderCollapse: "collapse", lineHeight: "1.8" }}
      >
        <tbody>
          <Row label="ミーム名" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              style={inputStyle}
              placeholder="例: 〇〇すぎる △△"
            />
          </Row>
          <Row label="発祥年">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={1900}
              max={2100}
              style={{ ...inputStyle, width: "100px" }}
              placeholder="例: 2008"
            />
          </Row>
          <Row label="発祥">
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              style={inputStyle}
            >
              {ORIGIN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o || "(選択しない)"}
                </option>
              ))}
            </select>
          </Row>
          <Row label="ソースURL">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              maxLength={500}
              style={inputStyle}
              placeholder="https://..."
            />
          </Row>
          <Row label="提供者名">
            <input
              type="text"
              value={submitter}
              onChange={(e) => setSubmitter(e.target.value)}
              maxLength={50}
              style={inputStyle}
              placeholder="(任意・ハンドル名など)"
            />
          </Row>
          <Row label="説明" required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
              rows={6}
              style={{ ...inputStyle, width: "100%", fontFamily: "inherit" }}
              placeholder="どんなミームか・由来・元ネタなどを自由に記入してください"
            />
          </Row>
        </tbody>
      </table>

      {status === "error" && (
        <div
          role="alert"
          style={{
            background: "#ffeeee",
            border: "1px solid #cc0000",
            padding: "6px",
            margin: "8px 0",
            color: "#cc0000",
            fontSize: "11px",
          }}
        >
          ✕ {errorMsg}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            ...btnStyle,
            opacity: status === "submitting" ? 0.6 : 1,
            cursor: status === "submitting" ? "wait" : "pointer",
          }}
        >
          {status === "submitting" ? "送信中..." : "▶ 情報を提供する"}
        </button>
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "10px",
          color: "#666",
          lineHeight: "1.6",
        }}
      >
        ※ 送信された内容は GitHub Issue として記録され、運営者が確認の上サイトに反映します。
        <br />※ 名誉毀損・著作権侵害の恐れがある内容はご遠慮ください。
      </div>
    </form>
  );
}

function Row({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        style={{
          width: "100px",
          background: "#eeeeff",
          border: "1px solid #9999cc",
          fontWeight: "bold",
          verticalAlign: "top",
          fontSize: "11px",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#cc0000", marginLeft: "4px" }}>*</span>
        )}
      </td>
      <td
        style={{
          background: "#ffffff",
          border: "1px solid #9999cc",
          verticalAlign: "top",
        }}
      >
        {children}
      </td>
    </tr>
  );
}

const inputStyle: React.CSSProperties = {
  fontSize: "12px",
  fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
  border: "1px solid #999",
  padding: "2px 4px",
  background: "#ffffff",
  minWidth: "200px",
};

const btnStyle: React.CSSProperties = {
  background: "#003399",
  color: "#ffffff",
  fontFamily: "'MS PGothic', 'MS Gothic', sans-serif",
  fontWeight: "bold",
  fontSize: "12px",
  padding: "6px 16px",
  border: "2px outset #6699ff",
  cursor: "pointer",
};
