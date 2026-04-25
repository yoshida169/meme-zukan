import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MemeCard from "./MemeCard";
import type { Meme } from "@/types/meme";

// next/link・next/image はテスト環境ではシンプルな要素に差し替える
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

const baseMeme: Meme = {
  id: "1",
  name: "テストミーム",
  slug: "test-meme",
  description: "これはテスト用の説明文です。",
  thumbnailUrl: "https://example.com/img.png",
  tags: ["猫", "音楽", "2ch"],
  year: 2020,
  status: "published",
  sourceUrl: "https://example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("MemeCard", () => {
  test("ミーム名が表示される", () => {
    render(<MemeCard meme={baseMeme} />);
    expect(screen.getByText("テストミーム")).toBeInTheDocument();
  });

  test("スラグへのリンクが設定される", () => {
    render(<MemeCard meme={baseMeme} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/meme/test-meme");
  });

  test("サムネイル画像が表示される", () => {
    render(<MemeCard meme={baseMeme} />);
    const img = screen.getByRole("img", { name: "テストミーム" });
    expect(img).toHaveAttribute("src", "https://example.com/img.png");
  });

  test("thumbnailUrl が null のとき絵文字プレースホルダーが表示される", () => {
    render(<MemeCard meme={{ ...baseMeme, thumbnailUrl: null }} />);
    expect(screen.getByText("🌐")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  test("説明文が40文字以内なら全文表示される", () => {
    const short = "短い説明";
    render(<MemeCard meme={{ ...baseMeme, description: short }} />);
    expect(screen.getByText(short)).toBeInTheDocument();
  });

  test("説明文が41文字以上なら40文字で切り詰めて「…」を付ける", () => {
    const long = "あ".repeat(41);
    render(<MemeCard meme={{ ...baseMeme, description: long }} />);
    expect(screen.getByText("あ".repeat(40) + "…")).toBeInTheDocument();
  });

  test("description が空のとき「説明なし」が表示される", () => {
    render(<MemeCard meme={{ ...baseMeme, description: "" }} />);
    expect(screen.getByText("説明なし")).toBeInTheDocument();
  });

  test("タグが最大3件表示される", () => {
    render(<MemeCard meme={baseMeme} />);
    expect(screen.getByText("猫")).toBeInTheDocument();
    expect(screen.getByText("音楽")).toBeInTheDocument();
    expect(screen.getByText("2ch")).toBeInTheDocument();
  });

  test("タグが4件以上でも先頭3件だけ表示される", () => {
    const meme = {
      ...baseMeme,
      tags: ["猫", "音楽", "2ch", "4つ目"],
    };
    render(<MemeCard meme={meme} />);
    expect(screen.queryByText("4つ目")).toBeNull();
  });

  test("year が設定されていると「XXXX年」が表示される", () => {
    render(<MemeCard meme={baseMeme} />);
    expect(screen.getByText("2020年")).toBeInTheDocument();
  });

  test("year が null のとき年表示は無い", () => {
    render(<MemeCard meme={{ ...baseMeme, year: null }} />);
    expect(screen.queryByText(/年/)).toBeNull();
  });

});
