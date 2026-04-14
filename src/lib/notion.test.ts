import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";


const { retrieveMock, queryMock } = vi.hoisted(() => ({
  retrieveMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock("@notionhq/client", () => ({
  Client: class {
    databases = { retrieve: retrieveMock };
    dataSources = { query: queryMock };
  },
}));

// fixtures ----------------------------------------------------
type FakePage = {
  object: "page";
  id: string;
  created_time: string;
  cover: any;
  properties: Record<string, any>;
};

function makePage(overrides: Partial<FakePage> = {}): FakePage {
  return {
    object: "page",
    id: "page-id-1",
    created_time: "2024-01-01T00:00:00.000Z",
    cover: null,
    properties: {
      name: {
        type: "title",
        title: [{ plain_text: "テストミーム" }],
      },
      slug: {
        type: "rich_text",
        rich_text: [{ plain_text: "test-meme" }],
      },
      description: {
        type: "rich_text",
        rich_text: [{ plain_text: "説明文" }],
      },
      thumbnail: {
        type: "files",
        files: [
          {
            type: "external",
            external: { url: "https://example.com/img.png" },
          },
        ],
      },
      origin: {
        type: "select",
        select: { name: "Twitter/X" },
      },
      tags: {
        type: "multi_select",
        multi_select: [{ name: "猫" }, { name: "音楽" }],
      },
      year: { type: "number", number: 2020 },
      status: { type: "select", select: { name: "published" } },
      popularity: { type: "select", select: { name: "🔥大流行" } },
      sourceUrl: { type: "url", url: "https://example.com" },
      createdAt: {
        type: "created_time",
        created_time: "2024-01-02T00:00:00.000Z",
      },
    },
    ...overrides,
  };
}

// helper: モジュールキャッシュ(_dataSourceId)を毎回リセット
async function loadNotion() {
  vi.resetModules();
  retrieveMock.mockResolvedValue({
    data_sources: [{ id: "ds-1" }],
  });
  return await import("./notion");
}

beforeEach(() => {
  process.env.NOTION_DATABASE_ID = "test-db-id";
  retrieveMock.mockReset();
  queryMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

// -------------------------------------------------------------

describe("getAllMemes", () => {
  test("published のミームを Meme 配列にマッピングする", async () => {
    queryMock.mockResolvedValueOnce({
      results: [makePage()],
      has_more: false,
      next_cursor: null,
    });
    const { getAllMemes } = await loadNotion();

    const memes = await getAllMemes();

    expect(memes).toHaveLength(1);
    expect(memes[0]).toEqual({
      id: "page-id-1",
      name: "テストミーム",
      slug: "test-meme",
      description: "説明文",
      thumbnailUrl: "https://example.com/img.png",
      origin: "Twitter/X",
      tags: ["猫", "音楽"],
      year: 2020,
      status: "published",
      popularity: "🔥大流行",
      sourceUrl: "https://example.com",
      createdAt: "2024-01-02T00:00:00.000Z",
    });

    // データソースID解決 → クエリの順で呼ばれる
    expect(retrieveMock).toHaveBeenCalledWith({
      database_id: expect.any(String),
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data_source_id: "ds-1",
        filter: {
          property: "status",
          select: { equals: "published" },
        },
      })
    );
  });

  test("ページネーションを辿って全件取得する", async () => {
    queryMock
      .mockResolvedValueOnce({
        results: [makePage({ id: "p1" })],
        has_more: true,
        next_cursor: "cursor-2",
      })
      .mockResolvedValueOnce({
        results: [makePage({ id: "p2" })],
        has_more: false,
        next_cursor: null,
      });
    const { getAllMemes } = await loadNotion();

    const memes = await getAllMemes();

    expect(memes.map((m) => m.id)).toEqual(["p1", "p2"]);
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(queryMock.mock.calls[1][0].start_cursor).toBe("cursor-2");
  });

  test("page 以外のオブジェクトは無視する", async () => {
    queryMock.mockResolvedValueOnce({
      results: [
        { object: "database", id: "db-x" },
        makePage(),
      ],
      has_more: false,
      next_cursor: null,
    });
    const { getAllMemes } = await loadNotion();

    const memes = await getAllMemes();
    expect(memes).toHaveLength(1);
  });

  test("プロパティが欠落していてもデフォルト値で埋める", async () => {
    const minimalPage: FakePage = {
      object: "page",
      id: "minimal-1",
      created_time: "2023-12-31T00:00:00.000Z",
      cover: null,
      properties: {
        name: { type: "title", title: [] },
        // slug なし → id にフォールバック
        // status なし → "draft"
      },
    };
    queryMock.mockResolvedValueOnce({
      results: [minimalPage],
      has_more: false,
      next_cursor: null,
    });
    const { getAllMemes } = await loadNotion();

    const [meme] = await getAllMemes();
    expect(meme.name).toBe("");
    expect(meme.slug).toBe("minimal-1"); // id にフォールバック
    expect(meme.description).toBe("");
    expect(meme.thumbnailUrl).toBeNull();
    expect(meme.origin).toBeNull();
    expect(meme.tags).toEqual([]);
    expect(meme.year).toBeNull();
    expect(meme.status).toBe("draft");
    expect(meme.popularity).toBeNull();
    expect(meme.sourceUrl).toBeNull();
    expect(meme.createdAt).toBe("2023-12-31T00:00:00.000Z");
  });

  test("thumbnail プロパティが空のときは cover にフォールバックする", async () => {
    const page = makePage({
      properties: {
        ...makePage().properties,
        thumbnail: { type: "files", files: [] },
      },
      cover: {
        type: "file",
        file: { url: "https://example.com/cover.png" },
      },
    });
    queryMock.mockResolvedValueOnce({
      results: [page],
      has_more: false,
      next_cursor: null,
    });
    const { getAllMemes } = await loadNotion();

    const [meme] = await getAllMemes();
    expect(meme.thumbnailUrl).toBe("https://example.com/cover.png");
  });
});

describe("getMemeBySlug", () => {
  test("該当する slug のミームを返す", async () => {
    queryMock.mockResolvedValueOnce({
      results: [makePage({ id: "found" })],
      has_more: false,
      next_cursor: null,
    });
    const { getMemeBySlug } = await loadNotion();

    const meme = await getMemeBySlug("test-meme");
    expect(meme?.id).toBe("found");
    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          property: "slug",
          rich_text: { equals: "test-meme" },
        },
      })
    );
  });

  test("該当ページが無ければ null を返す", async () => {
    queryMock.mockResolvedValueOnce({
      results: [],
      has_more: false,
      next_cursor: null,
    });
    const { getMemeBySlug } = await loadNotion();

    expect(await getMemeBySlug("missing")).toBeNull();
  });
});

describe("getAllTags", () => {
  test("全ミームのタグをユニーク化してソートして返す", async () => {
    queryMock.mockResolvedValueOnce({
      results: [
        makePage({
          id: "a",
          properties: {
            ...makePage().properties,
            tags: {
              type: "multi_select",
              multi_select: [{ name: "犬" }, { name: "猫" }],
            },
          },
        }),
        makePage({
          id: "b",
          properties: {
            ...makePage().properties,
            tags: {
              type: "multi_select",
              multi_select: [{ name: "猫" }, { name: "音楽" }],
            },
          },
        }),
      ],
      has_more: false,
      next_cursor: null,
    });
    const { getAllTags } = await loadNotion();

    const tags = await getAllTags();
    expect(tags).toEqual(["犬", "猫", "音楽"].sort());
  });
});

describe("getDataSourceId のキャッシュ", () => {
  test("同一モジュール内では databases.retrieve を1度しか呼ばない", async () => {
    queryMock.mockResolvedValue({
      results: [],
      has_more: false,
      next_cursor: null,
    });
    const { getAllMemes, getMemeBySlug } = await loadNotion();

    await getAllMemes();
    await getMemeBySlug("foo");

    expect(retrieveMock).toHaveBeenCalledTimes(1);
  });

  test("data_sources が無い場合はエラーを投げる", async () => {
    vi.resetModules();
    retrieveMock.mockResolvedValueOnce({ data_sources: [] });
    const { getAllMemes } = await import("./notion");

    await expect(getAllMemes()).rejects.toThrow("Database has no data sources");
  });
});
