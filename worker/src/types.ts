export interface Env {
  // Notion Webhook → GitHub Actions ブリッジ用
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
  NOTION_WEBHOOK_SECRET: string;
  // 閲覧数ランキング用
  DB: D1Database;
  ALLOWED_ORIGIN: string;
}

// D1Database の最小型定義（@cloudflare/workers-types を入れずに済ませる）
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
}

export interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: Record<string, unknown>;
}
