export interface Meme {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  year: number | null;
  status: "draft" | "published";
  sourceUrl: string | null;
  createdAt: string;
}
