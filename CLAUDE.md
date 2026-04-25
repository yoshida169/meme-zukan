# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

ネットミーム博物館 — インターネットミームを収集・記録する静的Webサイト。NotionデータベースをCMSとして使い、Next.js 16のSSG (`output: 'export'`) で静的HTMLを生成し、Cloudflare Pagesにデプロイする。

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
- `NEXT_PUBLIC_WORKER_URL` — 閲覧数ランキング用 Worker の URL（未設定時は ViewTracker/RankingClient が no-op になりビルドは壊れない）

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
- `/meme/[slug]` — ミーム詳細（`generateStaticParams` で全slug事前生成、`ViewTracker` で閲覧数計測）
- `/tag/[tag]` — タグ別一覧
- `/timeline` — 年代別ミーム年表（年で降順グルーピング、年内はpopularity順、デケード・ジャンプリンクあり）
- `/ranking` — 累計閲覧数ランキング（SSG外郭 + Client Component で Worker からランキング取得）
- `/about` — サイト概要

### Notion DB Properties

`src/types/meme.ts` の `Meme` 型を参照。主要プロパティ: name (title), slug (rich_text), description, thumbnail (files), origin (select), tags (multi_select), year (number), status (select: draft/published), popularity (select), sourceUrl (url), createdAt (created_time)

### Testing

- Vitest + jsdom、`@testing-library/react` / `@testing-library/jest-dom` / `@testing-library/user-event` を使用
- テストは実装と同階層に `*.test.ts(x)` を colocate する（例: `MemeCard.tsx` ↔ `MemeCard.test.tsx`）
- セットアップは `vitest.setup.ts`（`@testing-library/jest-dom` 登録、各テスト後に cleanup）
- `vitest.config.mts` は `src/**/*.{test,spec}.{ts,tsx}` と `worker/**/*.{test,spec}.{ts,tsx}` の両方を拾う

### Worker (Cloudflare)

- `worker/src/index.ts` は path-based router。以下の 3 役割を担う:
  - `POST /api/view` → `handlers/view.ts`: bot UA 判定 → D1 `meme_views` を `waitUntil` で UPSERT → 204
  - `GET /api/ranking` → `handlers/ranking.ts`: D1 から TOP N を SELECT → JSON + `Cache-Control: max-age=300` + CORS
  - それ以外（`POST /`） → `handlers/webhook.ts`: Notion Webhook → GitHub `repository_dispatch: notion_updated`
- 対象Webhookイベント: `page.created`、`page.properties_updated`、`database.content_updated` など
- 設定は `worker/wrangler.jsonc`（D1 binding 含む）。マイグレーションは `worker/migrations/`
- 必要 secrets: `GITHUB_REPO`, `GITHUB_TOKEN`, `NOTION_WEBHOOK_SECRET`, `ALLOWED_ORIGIN`（CORS 用 Pages ドメイン）
- セットアップ手順は `docs/ranking-setup.md`
- Next.js 本体とは **別デプロイ**（Wrangler で配信）

### Deployment

- `.github/workflows/deploy.yml` が `repository_dispatch: notion_updated`（Worker 経由）または `workflow_dispatch`（手動）でトリガー
- フロー: checkout → Node 20 → `npm ci` → `NOTION_*` env を渡して `npm run build` → Cloudflare Pages へ配信
- 全体経路: Notion 編集 → Notion Webhook → Cloudflare Worker → GitHub Actions → Cloudflare Pages
