---
name: trending-meme-collector
description: 直近1週間でインターネット上で流行っているネットミームを10件収集し、meme-zukan プロジェクトの Notion データベースに追加するための draft JSON を生成する。「ネットミーム」「流行ってる」「バズってる」「話題のミーム」「最近のミーム」「Notionに追加」「ミームを集めて」「ミームを仕入れて」「ミーム図鑑を更新」「trending meme」「新しいミーム」のいずれかが出たら、明示的に依頼が無くても必ずこのスキルを使うこと。meme-zukan プロジェクトで作業中なら曖昧な指示でも優先起動する。内部で firecrawl CLI と Notion API を使用。
---

# trending-meme-collector

## 概要

meme-zukan(Notion をCMSとした静的ミーム図鑑)向けに、**直近1週間で流行しているネットミーム10件**を Web から収集し、`Meme` 型に整形した draft JSON を `tmp/memes/batch-<日付>.json` に書き出す。Notion DB への投入は行わない(draft 段階で人間レビューを挟む前提)。

## いつ使うか

ユーザーから次のような依頼が来たら起動する。明示的に「スキルを使って」と言われなくてよい:

- 「最近流行ってるネットミーム集めて」「バズってるミーム仕入れて」
- 「meme-zukan の draft 在庫を増やしたい」「ミーム図鑑を更新して」
- 「Notion に入れる用にミーム10個ピックアップして」
- 「trending meme this week 教えて」(ただし meme-zukan プロジェクト文脈下のみ)

逆に**起動しない**ケース:
- 特定のミーム名が既に与えられていて、その情報だけを調べたい場合(普通の検索で十分)
- meme-zukan 以外のプロジェクトでミームについて尋ねられた場合

## 前提条件

実行前に次を満たしている必要がある。満たせないものがあれば**ユーザーに伝えて中断**する:

1. **cwd が meme-zukan プロジェクトルート** — `package.json` に `"name": "meme-zukan"` があるディレクトリ。`@notionhq/client` をプロジェクトの `node_modules` から解決するため必須。
2. **環境変数** — `NOTION_API_KEY` と `NOTION_DATABASE_ID`。`.env.local` にあれば `set -a; source .env.local; set +a` で読み込んで OK。
3. **firecrawl CLI が認証済み** — `firecrawl whoami` が成功すること。失敗したら `firecrawl login` をユーザーに促す。
4. **`@notionhq/client` がインストール済み** — プロジェクトの `node_modules` に存在すること(`package.json` の dependencies に既に入っている。なければ `npm install` を促す)。

## 実行手順

### Step 1: 環境チェックと準備

```bash
# プロジェクトルート確認
test -f package.json && grep -q '"meme-zukan"' package.json \
  || { echo "Run from meme-zukan project root"; exit 1; }

# 環境変数の読み込み(必要なら)
if [ -z "$NOTION_API_KEY" ] && [ -f .env.local ]; then
  set -a; source .env.local; set +a
fi
test -n "$NOTION_API_KEY" -a -n "$NOTION_DATABASE_ID" \
  || { echo "NOTION_API_KEY and NOTION_DATABASE_ID required"; exit 1; }

# firecrawl 認証確認
firecrawl whoami >/dev/null 2>&1 \
  || { echo "Run: firecrawl login"; exit 1; }

# 出力先ディレクトリ
mkdir -p tmp/memes/raw

# 今日の日付(出力ファイル名に使う)
DATE=$(date +%F)
```

### Step 2: 既存 slug + tags の取得

重複チェックと既存タグ揃え込みのため、Notion DB の現状を吸い出す。`getAllMemes()`(`src/lib/notion.ts`)は status=published のみを返すので、ここでは draft も含めて全件を引く同梱スクリプトを使う:

```bash
node .claude/skills/trending-meme-collector/scripts/list_existing_slugs.mjs > tmp/memes/existing.json
```

このファイルを Read で読み込んで、`existingSlugs = new Set(json.slugs)` と `existingTags = json.tags` をメモリに持つ。**この取得が失敗したら絶対に先に進まないこと**。重複チェックなしで生成すると Notion に二重登録するリスクがある。

### Step 3: 候補発見(firecrawl search)

3〜5本のクエリで広く拾う。クエリは「日本語まとめ系」「日本語コミュニティ系」「英語 trending 系」を**最低1本ずつ**含めること。一例:

```bash
firecrawl search "ネットミーム 流行 $(date +%Y)" --tbs qdr:w --limit 20 \
  --sources web,news -o tmp/memes/raw/search-jp1.json --json

firecrawl search "話題のミーム 今週 元ネタ" --tbs qdr:w --limit 20 \
  -o tmp/memes/raw/search-jp2.json --json

firecrawl search "バズった画像 今週 Twitter" --tbs qdr:w --limit 20 \
  -o tmp/memes/raw/search-jp3.json --json

firecrawl search "trending meme this week" --tbs qdr:w --limit 20 \
  -o tmp/memes/raw/search-en1.json --json

firecrawl search "Know Your Meme trending" --tbs qdr:w --limit 20 \
  -o tmp/memes/raw/search-en2.json --json
```

ポイント:
- `--tbs qdr:w` は固定(直近1週間という要件)
- この段階では `--scrape` を**付けない**。URL 発見だけが目的でクレジットを節約する
- `--json` を付けて構造化結果を保存

### Step 4: 詳細情報抽出(scrape ハイブリッド方式)

**まずまとめ記事を1〜2本丸ごと markdown 化して、Claude が本文から複数候補を一気に抽出する**。これが一番安く速い:

```bash
# 例: Step 3 の結果から「今週のネットミームまとめ」系の URL を1本選んで scrape
firecrawl scrape "https://example.com/weekly-meme-roundup" \
  --formats markdown -o tmp/memes/raw/roundup-1.json --json
```

それでも `thumbnailUrl` や `sourceUrl` が解像度不足な候補だけ、個別補強する:

```bash
firecrawl search "<ミーム名> 元ネタ" --tbs qdr:m --scrape --limit 3 \
  -o tmp/memes/raw/detail-<slug>.json --json
```

**`firecrawl agent` は使わない**。理由: 10件/週の運用には遅すぎ・高すぎる。将来的にサイト横断の自律抽出が必要になったら検討する。

すべての raw ファイルを Read で読み込み、Claude が候補リスト(仮 name / 仮 sourceUrl / 仮 thumbnail / 本文抜粋)を作る。

### Step 5: Meme 型へのマッピング

候補ごとに、後述の **「Meme 型マッピング規約」** に従って `Meme` オブジェクトを構築する。

### Step 6: 重複除外と不足時補充

- 生成した `slug` が `existingSlugs` に含まれていたら**その候補は捨てる**。
- 残数 < 10 なら Step 3 に戻り、別の角度のクエリ(`"reddit trending meme"`、`"tiktok viral meme"`、`"ニコニコ動画 流行"` など)を追加投入。**最大3ラウンドまで**。
- 3ラウンド経過しても10件に届かない場合は、集まった件数のまま Step 7 へ進み、Step 8 で部分成功であることを報告する。

### Step 7: 出力ファイル書き出し

```
tmp/memes/batch-<YYYY-MM-DD>.json   ← Meme[] 整形 JSON(2スペースインデント、UTF-8)
tmp/memes/raw/<YYYY-MM-DD>.json     ← raw 集約(下記参照)
```

`tmp/memes/raw/<YYYY-MM-DD>.json` には、Step 3 と Step 4 で取得した個別 raw ファイル(`search-*.json`、`roundup-*.json`、`detail-*.json`)を**1ファイルに集約したオブジェクト**を書く。例:

```json
{
  "searches": { "jp1": {...}, "jp2": {...}, "en1": {...} },
  "scrapes":  { "roundup-1": {...} },
  "details":  { "nurupo": {...} }
}
```

個別の `tmp/memes/raw/search-*.json` 等は集約後も**そのまま残してよい**(削除しない)。後でデバッグするときに便利。

### Step 8: サマリ報告

最後にユーザーへ次を1メッセージで簡潔に伝える:

- 何件収集できたか(目標10件に対して)
- 重複除外で何件落ちたか
- `tmp/memes/batch-<日付>.json` のフルパス
- 部分成功の場合は「N件しか集まらなかった。期間を `qdr:m` に拡張するか、含めるソースを広げるか相談したい」と明示
- **Notion 投入は行わない**こと、人間レビュー後に手動で取り込んでほしいこと

---

## Meme 型マッピング規約

`Meme` 型の正本は `src/types/meme.ts`。各フィールドの埋め方を以下に固定する。迷ったら**既存DBのスタイルに合わせる**(`existing.json` の slug と tags を参照)。

### `id`

**空文字 `""` 固定**。Notion ページIDが真の id であり、投入時に Notion 側で発行される。スキル側で UUID を勝手に生成するとズレが生じるのでしない。

### `name`

- 日本語表記を優先する。日本語コミュニティで定着した呼称があればそれ。
- 英語ミームで定訳がない場合は英語のまま(例: `"Distracted Boyfriend"`)。
- 絵文字やカタカナ混在 OK。

### `slug`

URL の一部として使われるので**人が読んで意味が分かること**が最重要。

1. ASCII 小文字 + ハイフン `-` のみ。先頭末尾の `-` は削る、連続 `-` は1つに圧縮。
2. 日本語名は **ヘボン式ローマ字** で kebab-case 化:
   - 「ぬるぽ」→ `nurupo`
   - 「ありがとナス」→ `arigato-nasu`
   - 「真顔ピカチュウ」→ `magao-pikachu`
3. 英語ミームで定着した英語句があればそれを優先(例: `"Distracted Boyfriend"` → `distracted-boyfriend`)。
4. 長文ミーム(30文字超)は意味単位を要約した英語短句に。テンプレ的なローマ字直訳(`xxx-to-ieba-yyy`)は読みづらいので避ける。
5. **`existing.json` の `slugs` を参照して命名スタイルを揃える**。既存DBが英訳優先なら英訳寄りに、ローマ字優先ならローマ字寄りに倒す。
6. 既存 slug と完全一致する場合は重複除外で**捨てる**(サフィックス `-2` 付けでの強引な追加はしない)。

### `description`

- 150〜400 字程度の日本語散文。
- 「何のミームか」「どこで発祥したか(分かれば)」「現在どう使われているか」の3点を含める。
- raw データの本文を**そのままコピペしない**。Claude が要約しなおす。著作権配慮と、説明の一貫性のため。

### `thumbnailUrl`

- raw データから `og:image` / 本文先頭の有意な画像 URL / `<img src>` を1つ採用。
- **ダウンロードはしない**。URL のみ。
- 取れなければ `null`。

### `origin`

許容値は `"Twitter/X" | "Reddit" | "2ch" | "TikTok" | "YouTube" | "Instagram" | "その他"`。判定優先度:

1. 元ネタのプラットフォームが明記されていればそれ
2. 複数で拡散したが**発祥**が明確ならそれ
3. ニコニコ動画 / Pixiv / Discord / LINE / まとめサイト / 発祥不明 → **`"その他"`**
4. **`null` は使わず必ず7択のいずれかに倒す**(7択型に対して draft 段階での null は弱いシグナル)

判定不能で「その他」に倒した場合でも、本当の発祥プラットフォーム情報は raw データに残しておけば後で復元できる。

### `tags`

- 2〜5個。
- カテゴリ系(`画像ミーム` / `動画ミーム` / `音MAD` / `構文`)+ 雰囲気系(`ほのぼの` / `煽り` / `シュール`)+ プラットフォーム系を組み合わせる。
- **`existing.json` の `tags` に既に存在するものを優先採用**して、既存タグと揃える。新規タグは必要最小限。

### `year`

- 元ネタの**発生年**が分かれば採用(2024年生まれで2026年再燃なら `2024`)。
- 不明なら `null`。
- 実行年(`new Date().getFullYear()`)を自動補完しないこと。

### `status`

**常に `"draft"` 固定**。published化は人間レビュー後に手動で行う。

### `popularity`

- 複数まとめ記事に出現 / 大手で言及 → `"🔥大流行"`
- 1〜2 ソースのみ言及 → `"😊中規模"`
- 特定コミュニティ内のみ → `"🌱ニッチ"`
- 判断つかない → `null`

### `sourceUrl`

- 元ネタに**最も近い**URL(発祥ツイート / YouTube動画 / Reddit原スレ等)。
- 元ネタURLが取れなければ、まとめ記事URLで代用してよい。
- それも無ければ `null`。

### `createdAt`

- Notion 側の `createdAt` プロパティは `created_time` 型で、ページ作成時に Notion が自動付与する。スキルが書き出す draft JSON の `createdAt` は**投入時に無視される**。
- ただし `Meme` 型の必須フィールドなので、出力 JSON には便宜上 `new Date().toISOString()` を入れておく(投入時に上書きされる前提)。

---

## 出力フォーマット

### `tmp/memes/batch-<YYYY-MM-DD>.json`

```json
[
  {
    "id": "",
    "name": "真顔ピカチュウ",
    "slug": "magao-pikachu",
    "description": "ピカチュウが無表情で正面を見つめるリアクション画像。2024年に Twitter/X 上で広まり、皮肉や呆れを表現する文脈で使われる。海外コミュニティでも 'Surprised Pikachu' とは別系統のリアクション素材として定着している。",
    "thumbnailUrl": "https://pbs.twimg.com/media/example.jpg",
    "origin": "Twitter/X",
    "tags": ["画像ミーム", "リアクション", "ポケモン"],
    "year": 2024,
    "status": "draft",
    "popularity": "🔥大流行",
    "sourceUrl": "https://twitter.com/example/status/123456789",
    "createdAt": "2026-04-11T14:30:00.000Z"
  }
]
```

要件:
- UTF-8 / 2スペースインデント / 配列のトップレベル
- 全要素が `Meme` 型として valid(TypeScript 上で `JSON.parse(...) as Meme[]` できる形)
- `status === "draft"`、`origin` は 7択のいずれか、`slug` は ASCII 範囲

### `tmp/memes/raw/<YYYY-MM-DD>.json`

Step 7 参照。firecrawl の生レスポンスを `searches` / `scrapes` / `details` のキーで集約したオブジェクト。サイズ気にせず素直に入れて OK。

---

## エラー処理

| 状況 | 対処 |
|---|---|
| `firecrawl whoami` 失敗 | `firecrawl login` をユーザーに促して**中断** |
| `list_existing_slugs.mjs` が exit 1(env 不足) | 環境変数を確認させて**中断** |
| `list_existing_slugs.mjs` が exit 2(API エラー) | stderr を表示して**中断**(重複チェックなしで進めない) |
| 個別 `firecrawl search` 失敗 | 1回だけリトライ。それでも失敗ならそのクエリだけスキップして続行 |
| `firecrawl scrape` 失敗 | 当該候補は捨てて次へ。description が組み立てられないため |
| 候補が10件集まらない(3ラウンド試行後) | 集まった件数で出力し、Step 8 で「N件しか集まらなかった、期間拡張を相談したい」と明示 |
| 全候補が既存 slug と衝突 | 空配列 `[]` を出力し「今週の主要ミームは既にDBに登録済み」と報告 |
| `tmp/` への書き込み失敗 | パーミッションを確認させて中断 |

---

## 付録: firecrawl コマンド早見表

```bash
# 認証確認
firecrawl whoami

# 検索のみ(URL発見、scrape なし)
firecrawl search "<query>" --tbs qdr:w --limit 20 --json -o <out.json>

# 検索 + 結果ページの scrape まで一気に
firecrawl search "<query>" --tbs qdr:w --scrape --limit 5 --json -o <out.json>

# 単一URLの scrape(markdown 形式)
firecrawl scrape "<url>" --formats markdown --json -o <out.json>

# 時間範囲オプション
# qdr:h=直近1時間 / qdr:d=1日 / qdr:w=1週間 / qdr:m=1ヶ月 / qdr:y=1年
```

`firecrawl` の詳しい使い方は `firecrawl --help` または `firecrawl <subcommand> --help` で確認できる。
