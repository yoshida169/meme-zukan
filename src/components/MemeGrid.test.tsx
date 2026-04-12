import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeGrid from "./MemeGrid";
import type { Meme } from "@/types/meme";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

function makeMeme(overrides: Partial<Meme> = {}): Meme {
  return {
    id: "1",
    name: "テストミーム",
    slug: "test-meme",
    description: "説明文",
    thumbnailUrl: null,
    origin: "Twitter/X",
    tags: ["猫"],
    year: 2020,
    status: "published",
    popularity: "🔥大流行",
    sourceUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("MemeGrid", () => {
  describe("表示", () => {
    test("ミームが一覧表示される", () => {
      const memes = [
        makeMeme({ id: "1", name: "ミームA" }),
        makeMeme({ id: "2", name: "ミームB" }),
      ];
      render(<MemeGrid memes={memes} />);
      expect(screen.getByText("ミームA")).toBeInTheDocument();
      expect(screen.getByText("ミームB")).toBeInTheDocument();
    });

    test("ミームが0件のとき「該当するミームが見つかりませんでした」が表示される", () => {
      render(<MemeGrid memes={[]} />);
      expect(
        screen.getByText("該当するミームが見つかりませんでした")
      ).toBeInTheDocument();
    });

    test("件数が表示される", () => {
      const memes = [makeMeme({ id: "1" }), makeMeme({ id: "2" })];
      render(<MemeGrid memes={memes} />);
      expect(screen.getByText("2件")).toBeInTheDocument();
    });

    test("タグがフィルター選択肢に表示される", () => {
      const memes = [
        makeMeme({ id: "1", tags: ["猫"] }),
        makeMeme({ id: "2", tags: ["犬"] }),
      ];
      render(<MemeGrid memes={memes} />);
      const select = screen.getByDisplayValue("タグ: すべて");
      expect(select).toBeInTheDocument();
      // option要素として猫と犬が存在する
      expect(screen.getByRole("option", { name: "猫" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "犬" })).toBeInTheDocument();
    });

    test("発祥元がフィルター選択肢に表示される", () => {
      const memes = [
        makeMeme({ id: "1", origin: "Twitter/X" }),
        makeMeme({ id: "2", origin: "Reddit" }),
      ];
      render(<MemeGrid memes={memes} />);
      expect(
        screen.getByRole("option", { name: "Twitter/X" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Reddit" })
      ).toBeInTheDocument();
    });
  });

  describe("テキスト検索", () => {
    test("クエリに一致するミームだけ表示される", async () => {
      const memes = [
        makeMeme({ id: "1", name: "ネコミーム" }),
        makeMeme({ id: "2", name: "イヌミーム" }),
      ];
      render(<MemeGrid memes={memes} />);
      const input = screen.getByPlaceholderText("ミーム名で検索");
      await userEvent.type(input, "ネコ");

      expect(screen.getByText("ネコミーム")).toBeInTheDocument();
      expect(screen.queryByText("イヌミーム")).toBeNull();
      expect(screen.getByText("1件")).toBeInTheDocument();
    });

    test("大文字小文字を区別しない", async () => {
      const memes = [makeMeme({ id: "1", name: "Doge" })];
      render(<MemeGrid memes={memes} />);
      const input = screen.getByPlaceholderText("ミーム名で検索");
      await userEvent.type(input, "doge");
      expect(screen.getByText("Doge")).toBeInTheDocument();
    });

    test("一致しない検索をすると「見つかりませんでした」が表示される", async () => {
      const memes = [makeMeme({ id: "1", name: "ミームA" })];
      render(<MemeGrid memes={memes} />);
      const input = screen.getByPlaceholderText("ミーム名で検索");
      await userEvent.type(input, "存在しない");
      expect(
        screen.getByText("該当するミームが見つかりませんでした")
      ).toBeInTheDocument();
    });
  });

  describe("発祥元フィルター", () => {
    test("発祥元を選択するとそのミームだけ表示される", async () => {
      const memes = [
        makeMeme({ id: "1", name: "ツイッタームーム", origin: "Twitter/X" }),
        makeMeme({ id: "2", name: "レディットミーム", origin: "Reddit" }),
      ];
      render(<MemeGrid memes={memes} />);
      const select = screen.getByDisplayValue("発祥元: すべて");
      await userEvent.selectOptions(select, "Twitter/X");

      expect(screen.getByText("ツイッタームーム")).toBeInTheDocument();
      expect(screen.queryByText("レディットミーム")).toBeNull();
    });
  });

  describe("タグフィルター", () => {
    test("タグを選択するとそのタグを持つミームだけ表示される", async () => {
      const memes = [
        makeMeme({ id: "1", name: "ネコミーム", tags: ["猫"] }),
        makeMeme({ id: "2", name: "イヌミーム", tags: ["犬"] }),
      ];
      render(<MemeGrid memes={memes} />);
      const select = screen.getByDisplayValue("タグ: すべて");
      await userEvent.selectOptions(select, "猫");

      expect(screen.getByText("ネコミーム")).toBeInTheDocument();
      expect(screen.queryByText("イヌミーム")).toBeNull();
    });
  });

  describe("ソート", () => {
    test("年代順ソートで年が新しいものが上に来る", async () => {
      const memes = [
        makeMeme({ id: "1", name: "古いミーム", year: 2000, createdAt: "2024-01-02T00:00:00.000Z" }),
        makeMeme({ id: "2", name: "新しいミーム", year: 2023, createdAt: "2024-01-01T00:00:00.000Z" }),
      ];
      render(<MemeGrid memes={memes} />);
      const select = screen.getByDisplayValue("新着順");
      await userEvent.selectOptions(select, "year");

      const items = screen.getAllByText(/ミーム/);
      // 最初に表示されるのが新しいミームであること
      expect(items[0].textContent).toBe("新しいミーム");
    });

    test("人気順ソートで🔥大流行が最初に来る", async () => {
      const memes = [
        makeMeme({ id: "1", name: "ニッチミーム", popularity: "🌱ニッチ", createdAt: "2024-01-02T00:00:00.000Z" }),
        makeMeme({ id: "2", name: "大流行ミーム", popularity: "🔥大流行", createdAt: "2024-01-01T00:00:00.000Z" }),
      ];
      render(<MemeGrid memes={memes} />);
      const select = screen.getByDisplayValue("新着順");
      await userEvent.selectOptions(select, "popular");

      const items = screen.getAllByText(/ミーム/);
      expect(items[0].textContent).toBe("大流行ミーム");
    });

    test("新着順ソートでcreatedAtが新しいものが上に来る", async () => {
      const memes = [
        makeMeme({ id: "1", name: "旧ミーム", createdAt: "2023-01-01T00:00:00.000Z" }),
        makeMeme({ id: "2", name: "新ミーム", createdAt: "2024-06-01T00:00:00.000Z" }),
      ];
      render(<MemeGrid memes={memes} />);
      // デフォルトが新着順なので操作不要
      const items = screen.getAllByText(/ミーム/);
      expect(items[0].textContent).toBe("新ミーム");
    });
  });

  describe("複合フィルター", () => {
    test("テキスト検索とタグフィルターを同時に適用できる", async () => {
      const memes = [
        makeMeme({ id: "1", name: "ネコ動画", tags: ["猫", "動画"] }),
        makeMeme({ id: "2", name: "ネコ画像", tags: ["猫", "画像"] }),
        makeMeme({ id: "3", name: "イヌ動画", tags: ["犬", "動画"] }),
      ];
      render(<MemeGrid memes={memes} />);

      const textInput = screen.getByPlaceholderText("ミーム名で検索");
      await userEvent.type(textInput, "ネコ");

      const tagSelect = screen.getByDisplayValue("タグ: すべて");
      await userEvent.selectOptions(tagSelect, "動画");

      expect(screen.getByText("ネコ動画")).toBeInTheDocument();
      expect(screen.queryByText("ネコ画像")).toBeNull();
      expect(screen.queryByText("イヌ動画")).toBeNull();
      expect(screen.getByText("1件")).toBeInTheDocument();
    });
  });
});
