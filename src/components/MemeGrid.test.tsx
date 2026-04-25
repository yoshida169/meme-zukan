import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeGrid from "./MemeGrid";
import type { Meme } from "@/types/meme";

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
    year: 2020,
    status: "published",
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

  describe("ソート", () => {
    test("新着順でcreatedAtが新しいものが上に来る", () => {
      const memes = [
        makeMeme({ id: "1", name: "旧ミーム", createdAt: "2023-01-01T00:00:00.000Z" }),
        makeMeme({ id: "2", name: "新ミーム", createdAt: "2024-06-01T00:00:00.000Z" }),
      ];
      render(<MemeGrid memes={memes} />);
      const items = screen.getAllByText(/ミーム/);
      expect(items[0].textContent).toBe("新ミーム");
    });
  });
});
