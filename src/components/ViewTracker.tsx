"use client";

import { useEffect } from "react";

interface Props {
  slug: string;
}

export default function ViewTracker({ slug }: Props) {
  useEffect(() => {
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl || !slug) return;

    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage が無効な環境（プライベートモード等）では dedup 無しで継続
    }

    fetch(`${workerUrl}/api/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // 計測失敗はユーザー体験に影響させない
    });
  }, [slug]);

  return null;
}
