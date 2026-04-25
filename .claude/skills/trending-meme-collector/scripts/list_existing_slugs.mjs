#!/usr/bin/env node
// list_existing_slugs.mjs
//
// meme-zukan プロジェクトの Notion DB から、登録済みの全 slug と全 tags を抽出する。
// trending-meme-collector スキルが新規収集ミームの slug 重複チェックと
// tags 揃え込みに使う前提のヘルパー。
//
// 実行前提:
//   - cwd が meme-zukan プロジェクトルート(@notionhq/client を node_modules から解決するため)
//   - 環境変数 NOTION_API_KEY と NOTION_DATABASE_ID が設定済み
//
// 使い方:
//   cd /path/to/meme-zukan
//   node ~/.claude/skills/trending-meme-collector/scripts/list_existing_slugs.mjs > tmp/memes/existing.json
//
// 出力(stdout, JSON pretty):
//   { "slugs": ["nurupo", "arigato-nasu", ...], "tags": ["画像ミーム", "構文", ...] }
//
// 終了コード:
//   0 — 正常終了
//   1 — 環境変数不足
//   2 — Notion API またはその他の実行時エラー(stderr に詳細)

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));

let Client;
try {
  ({ Client } = require("@notionhq/client"));
} catch (err) {
  console.error(
    "Failed to load @notionhq/client from " +
      process.cwd() +
      "/node_modules. Run this script from the meme-zukan project root after `npm install`."
  );
  console.error(err?.message || String(err));
  process.exit(2);
}

const apiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;
if (!apiKey || !databaseId) {
  console.error("NOTION_API_KEY and NOTION_DATABASE_ID must be set");
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

try {
  // Notion API v2025-09-03: databases.retrieve で data_sources[0].id を引いてから
  // dataSources.query に投げる必要がある(src/lib/notion.ts と同じパターン)。
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const dataSourceId = db?.data_sources?.[0]?.id;
  if (!dataSourceId) {
    throw new Error("Database has no data sources");
  }

  const slugs = [];
  const tagSet = new Set();
  let cursor;

  // フィルタを掛けないため draft も published も両方拾う。
  // 重複チェックの観点ではどちらも同じ slug 空間を共有しているので両方必要。
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const page of res.results) {
      if (page.object !== "page" || !("properties" in page)) continue;

      const slugProp = page.properties.slug;
      if (slugProp?.type === "rich_text") {
        const s = slugProp.rich_text.map((t) => t.plain_text).join("");
        if (s) slugs.push(s);
      }

      const tagsProp = page.properties.tags;
      if (tagsProp?.type === "multi_select") {
        for (const t of tagsProp.multi_select) tagSet.add(t.name);
      }
    }

    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);

  process.stdout.write(
    JSON.stringify({ slugs, tags: [...tagSet].sort() }, null, 2) + "\n"
  );
} catch (err) {
  console.error(err?.message || String(err));
  process.exit(2);
}
