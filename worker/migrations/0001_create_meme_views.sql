-- 累計閲覧数テーブル
CREATE TABLE IF NOT EXISTS meme_views (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meme_views_count ON meme_views(count DESC);
