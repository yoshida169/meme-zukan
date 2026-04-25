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
    render(<RetroNav />);
    expect(screen.getByText("▶ トップ")).toBeInTheDocument();
    expect(screen.getByText("▶ サイト概要")).toBeInTheDocument();
  });

  test("トップリンクのhrefが/である", () => {
    render(<RetroNav />);
    const link = screen.getByText("▶ トップ").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  test("お知らせ欄が表示される", () => {
    render(<RetroNav />);
    expect(screen.getByText("★お知らせ★")).toBeInTheDocument();
    expect(screen.getByText(/ミームを随時追加中！/)).toBeInTheDocument();
  });
});
