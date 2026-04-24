# 閲覧数ランキング機能 セットアップ手順

`/ranking` ページで累計閲覧数ランキングを表示するための Cloudflare 側の準備手順。D1 データベースの作成と既存 Worker へのバインドが必要。

## 必要なもの

- Cloudflare アカウント（Workers/D1 が使える）
- `wrangler` CLI（`npx wrangler` で OK）
- GitHub リポジトリへの Secrets 書き込み権限

## 1. D1 データベースを作成

```bash
cd worker
npx wrangler d1 create meme-zukan-views
```

出力例:

```
[[d1_databases]]
binding = "DB"
database_name = "meme-zukan-views"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

表示された `database_id` を `worker/wrangler.jsonc` の `d1_databases[0].database_id` に貼り付ける（`REPLACE_WITH_DATABASE_ID` を置き換える）。

## 2. マイグレーション適用

```bash
# ローカル (wrangler dev 用)
npx wrangler d1 migrations apply meme-zukan-views --local

# 本番
npx wrangler d1 migrations apply meme-zukan-views --remote
```

`meme_views` テーブルと `idx_meme_views_count` インデックスが作成される。

## 3. Worker Secrets を設定

CORS 許可元として Pages ドメインを Worker に登録する。

```bash
npx wrangler secret put ALLOWED_ORIGIN
# プロンプトで https://meme-zukan.pages.dev などを入力
```

既存の Notion Webhook 用 secret (`GITHUB_REPO`, `GITHUB_TOKEN`, `NOTION_WEBHOOK_SECRET`) が未設定の場合は同様に `wrangler secret put` する。

## 4. Worker をデプロイ

```bash
npx wrangler deploy
```

デプロイ後に表示される URL（例: `https://meme-zukan-worker.<subdomain>.workers.dev`）をメモする。これが `NEXT_PUBLIC_WORKER_URL` になる。

## 5. GitHub Secrets に Worker URL を追加

リポジトリの Settings → Secrets and variables → Actions で:

- `NEXT_PUBLIC_WORKER_URL` = `https://meme-zukan-worker.<subdomain>.workers.dev`

これで本番ビルド時に Next.js のクライアントコードに Worker URL が埋め込まれる。

## 6. ローカル開発用の設定

リポジトリルートに `.env.local` を作成:

```
NOTION_API_KEY=...
NOTION_DATABASE_ID=...
NEXT_PUBLIC_WORKER_URL=https://meme-zukan-worker.<subdomain>.workers.dev
```

`NEXT_PUBLIC_WORKER_URL` が未設定だと `/ranking` は「ランキング機能は未設定です」と表示され、`<ViewTracker>` は何もしない（ビルドは壊れない）。

## 7. 動作確認

### 計測

`/meme/<slug>` を開いたあと:

```bash
npx wrangler tail
# POST /api/view のログが流れるはず
```

DevTools の Network で `POST /api/view` が 204 を返し、sessionStorage に `viewed:<slug>` が入ることを確認する。

### D1 の中身

```bash
npx wrangler d1 execute meme-zukan-views --remote \
  --command "SELECT slug, count, updated_at FROM meme_views ORDER BY count DESC LIMIT 10"
```

### ランキングページ

`/ranking` にアクセスしてランキングが表示されることを確認。Cloudflare edge cache により最大 5 分遅れる。

## トラブルシュート

- **`/api/view` が CORS エラーになる**: `ALLOWED_ORIGIN` が実際の Pages ドメインと完全一致しているか確認（末尾スラッシュなし、スキーム込み）
- **404 が返る**: デプロイされた Worker の URL があっているか、`wrangler.jsonc` の `name` と一致しているか確認
- **計測されない**:
  - User-Agent が bot 扱いになっていないか（DevTools の Network → Request Headers）
  - sessionStorage にすでに `viewed:<slug>` が入っていて重複排除されていないか
- **既存の Notion Webhook が壊れた**: `POST /` は引き続き Webhook として動くはず。壊れた場合は Worker のログを `wrangler tail` で確認

## 再適用・巻き戻し

- D1 の中身だけリセット: `npx wrangler d1 execute meme-zukan-views --remote --command "DELETE FROM meme_views"`
- テーブル削除: `npx wrangler d1 execute meme-zukan-views --remote --command "DROP TABLE meme_views"` → 再度 migrations apply
