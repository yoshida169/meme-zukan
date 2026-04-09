# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

ネットミーム図鑑 — インターネットミームを収集・記録する静的Webサイト。NotionデータベースをCMSとして使い、Next.js 16のSSG (`output: 'export'`) で静的HTMLを生成し、Cloudflare Pagesにデプロイする。

## Commands

- `npm run dev` — 開発サーバー起動
- `npm run build` — 静的サイト生成（`out/` に出力）
- `npm run start` — ビルド済みサイトの配信

lint/test/formatの設定はない。

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
- `/about` — サイト概要

### Notion DB Properties

`src/types/meme.ts` の `Meme` 型を参照。主要プロパティ: name (title), slug (rich_text), description, thumbnail (files), origin (select), tags (multi_select), year (number), status (select: draft/published), popularity (select), sourceUrl (url), createdAt (created_time)

### Scripts

`scripts/` にNotion DB初期セットアップ・シードデータ投入スクリプトあり。
