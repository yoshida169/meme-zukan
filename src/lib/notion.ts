import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDataSourceResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Meme } from "@/types/meme";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

let _dataSourceId: string | null = null;

async function getDataSourceId(): Promise<string> {
  if (_dataSourceId) return _dataSourceId;
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  const dataSources = (db as any).data_sources;
  if (!dataSources || dataSources.length === 0) {
    throw new Error("Database has no data sources");
  }
  const id = dataSources[0].id;
  if (typeof id !== "string") {
    throw new Error("Data source id is missing");
  }
  _dataSourceId = id;
  return id;
}

function extractTitle(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  if (p?.type === "title") {
    return p.title.map((t) => t.plain_text).join("");
  }
  return "";
}

function extractRichText(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop];
  if (p?.type === "rich_text") {
    return p.rich_text.map((t) => t.plain_text).join("");
  }
  return "";
}

function extractSelect(
  page: PageObjectResponse,
  prop: string
): string | null {
  const p = page.properties[prop];
  if (p?.type === "select") return p.select?.name ?? null;
  return null;
}

function extractMultiSelect(
  page: PageObjectResponse,
  prop: string
): string[] {
  const p = page.properties[prop];
  if (p?.type === "multi_select") return p.multi_select.map((s) => s.name);
  return [];
}

function extractNumber(
  page: PageObjectResponse,
  prop: string
): number | null {
  const p = page.properties[prop];
  if (p?.type === "number") return p.number;
  return null;
}

function extractUrl(page: PageObjectResponse, prop: string): string | null {
  const p = page.properties[prop];
  if (p?.type === "url") return p.url;
  return null;
}

function extractThumbnail(page: PageObjectResponse): string | null {
  const p = page.properties["thumbnail"];
  if (p?.type === "files" && p.files.length > 0) {
    const file = p.files[0];
    if (file.type === "external") return file.external.url;
    if (file.type === "file") return file.file.url;
  }
  if (page.cover) {
    if (page.cover.type === "external") return page.cover.external.url;
    if (page.cover.type === "file") return page.cover.file.url;
  }
  return null;
}

function pageToMeme(page: PageObjectResponse): Meme {
  return {
    id: page.id,
    name: extractTitle(page, "name"),
    slug: extractRichText(page, "slug") || page.id,
    description: extractRichText(page, "description"),
    thumbnailUrl: extractThumbnail(page),
    tags: extractMultiSelect(page, "tags"),
    year: extractNumber(page, "year"),
    status: (extractSelect(page, "status") ?? "draft") as "draft" | "published",
    sourceUrl: extractUrl(page, "sourceUrl"),
    createdAt:
      page.properties["createdAt"]?.type === "created_time"
        ? page.properties["createdAt"].created_time
        : page.created_time,
  };
}

export async function getAllMemes(): Promise<Meme[]> {
  const dataSourceId = await getDataSourceId();
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res: QueryDataSourceResponse = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "status",
        select: { equals: "published" },
      },
      sorts: [{ property: "createdAt", direction: "descending" }],
      start_cursor: cursor,
      page_size: 100,
    });

    results.push(
      ...(res.results.filter(
        (r): r is PageObjectResponse =>
          r.object === "page" && "properties" in r
      ))
    );
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return results.map(pageToMeme);
}

export async function getMemeBySlug(slug: string): Promise<Meme | null> {
  const dataSourceId = await getDataSourceId();
  const res: QueryDataSourceResponse = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: "slug",
      rich_text: { equals: slug },
    },
  });

  const page = res.results.find(
    (r): r is PageObjectResponse => r.object === "page" && "properties" in r
  );
  if (!page) return null;
  return pageToMeme(page);
}

export async function getAllTags(): Promise<string[]> {
  const memes = await getAllMemes();
  const tagSet = new Set<string>();
  memes.forEach((m) => m.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
