export type Popularity = "🔥大流行" | "😊中規模" | "🌱ニッチ";

export type Origin =
  | "Twitter/X"
  | "Reddit"
  | "2ch"
  | "TikTok"
  | "YouTube"
  | "Instagram"
  | "その他";

export interface Meme {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  origin: Origin | null;
  tags: string[];
  year: number | null;
  status: "draft" | "published";
  popularity: Popularity | null;
  sourceUrl: string | null;
  createdAt: string;
}
