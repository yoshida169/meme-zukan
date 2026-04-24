# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

ネットミーム図鑑 — インターネットミームを収集・記録する静的Webサイト。NotionデータベースをCMSとして使い、Next.js 16のSSG (`output: 'export'`) で静的HTMLを生成し、Cloudflare Pagesにデプロイする。

## Commands

- `npm run dev` — 開発サーバー起動
- `npm run build` — 静的サイト生成（`out/` に出力）
- `npm run start` — ビルド済みサイトの配信
- `npm run test` — Vitest 単発実行（`src/**` と `worker/**` の両方を対象）
- `npm run test:watch` — Vitest watch モード
- 単一ファイルのテスト: `npx vitest run <path>`

lint/format の設定はない。

## Environment Variables

ビルド時に以下が必要:
- `NOTION_API_KEY` — Notion APIキー
- `NOTION_DATABASE_ID` — ミームデータベースのID

## Architecture

### Data Flow

Notion DB → `src/lib/notion.ts` (Notion API v2025-09-03, dataSources.query) → Meme型 → Reactコンポーネント → SSG静的HTML

### Key Design Decisions

- **Notion API v2025-09-03**: `dataSources.query()` を使用。database_idではなくdata_source_idが必要（`databases.retrieve` → `data_sources[0].id` で取得）
- **SSG専用**: `output: 'export'` + `trailingSlash: true` + `images.unoptimized: true`。サーバーサイド機能は使えない
- **レトロUIデザイン**: 2000年代の個人サイト風。`<table>` レイアウト、インラインstyle、MS PGothicフォントを意図的に使用（モダン化しないこと）
- **パスエイリアス**: `@/*` → `./src/*`

### Routes

- `/` — ミーム一覧（MemeGrid）
- `/meme/[slug]` — ミーム詳細（`generateStaticParams` で全slug事前生成）
- `/tag/[tag]` — タグ別一覧
- `/timeline` — 年代別ミーム年表（年で降順グルーピング、年内はpopularity順、デケード・ジャンプリンクあり）
- `/about` — サイト概要

### Notion DB Properties

`src/types/meme.ts` の `Meme` 型を参照。主要プロパティ: name (title), slug (rich_text), description, thumbnail (files), origin (select), tags (multi_select), year (number), status (select: draft/published), popularity (select), sourceUrl (url), createdAt (created_time)

### Testing

- Vitest + jsdom、`@testing-library/react` / `@testing-library/jest-dom` / `@testing-library/user-event` を使用
- テストは実装と同階層に `*.test.ts(x)` を colocate する（例: `MemeCard.tsx` ↔ `MemeCard.test.tsx`）
- セットアップは `vitest.setup.ts`（`@testing-library/jest-dom` 登録、各テスト後に cleanup）
- `vitest.config.mts` は `src/**/*.{test,spec}.{ts,tsx}` と `worker/**/*.{test,spec}.{ts,tsx}` の両方を拾う

### Worker (Cloudflare)

- `worker/src/index.ts` は Notion Webhook を受け取り、GitHub API の `repository_dispatch`（event type `notion_updated`）を叩いてデプロイワークフローをキックする Cloudflare Worker
- 対象イベント: `page.created`、`page.properties_updated`、`database.content_updated` など
- Next.js 本体とは **別デプロイ**（Wrangler で配信）

### Deployment

- `.github/workflows/deploy.yml` が `repository_dispatch: notion_updated`（Worker 経由）または `workflow_dispatch`（手動）でトリガー
- フロー: checkout → Node 20 → `npm ci` → `NOTION_*` env を渡して `npm run build` → Cloudflare Pages へ配信
- 全体経路: Notion 編集 → Notion Webhook → Cloudflare Worker → GitHub Actions → Cloudflare Pages
