import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RetroNav from "./RetroNav";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("RetroNav", () => {
  test("メニューリンクが表示される", () => {
    render(<RetroNav tags={[]} />);
    expect(screen.getByText("▶ トップ")).toBeInTheDocument();
    expect(screen.getByText("▶ サイト概要")).toBeInTheDocument();
  });

  test("トップリンクのhrefが/である", () => {
    render(<RetroNav tags={[]} />);
    const link = screen.getByText("▶ トップ").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  test("全発祥元のリンクが表示される", () => {
    render(<RetroNav tags={[]} />);
    const origins = ["Twitter/X", "Reddit", "2ch", "TikTok", "YouTube", "Instagram", "その他"];
    for (const origin of origins) {
      expect(screen.getByText(`[${origin}]`)).toBeInTheDocument();
    }
  });

  test("発祥元リンクに正しいhrefが設定される", () => {
    render(<RetroNav tags={[]} />);
    const link = screen.getByText("[Twitter/X]").closest("a");
    expect(link).toHaveAttribute("href", `/?origin=${encodeURIComponent("Twitter/X")}`);
  });

  test("tagsが空のときタグセクションは表示されない", () => {
    render(<RetroNav tags={[]} />);
    expect(screen.queryByText("■ タグで探す")).toBeNull();
  });

  test("tagsがあるときタグセクションが表示される", () => {
    render(<RetroNav tags={["猫", "犬"]} />);
    expect(screen.getByText("■ タグで探す")).toBeInTheDocument();
    expect(screen.getByText("[猫]")).toBeInTheDocument();
    expect(screen.getByText("[犬]")).toBeInTheDocument();
  });

  test("タグリンクのhrefが/tag/[tag]になっている", () => {
    render(<RetroNav tags={["猫"]} />);
    const link = screen.getByText("[猫]").closest("a");
    expect(link).toHaveAttribute("href", `/tag/${encodeURIComponent("猫")}`);
  });

  test("お知らせ欄が表示される", () => {
    render(<RetroNav tags={[]} />);
    expect(screen.getByText("★お知らせ★")).toBeInTheDocument();
    expect(screen.getByText(/ミームを随時追加中！/)).toBeInTheDocument();
  });
});
