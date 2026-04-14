import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RetroHeader from "./RetroHeader";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("RetroHeader", () => {
  test("サイトタイトルが表示される", () => {
    render(<RetroHeader />);
    expect(screen.getByText("★ネットミーム図鑑★")).toBeInTheDocument();
  });

  test("タイトルのリンクが/に設定されている", () => {
    render(<RetroHeader />);
    const link = screen.getByText("★ネットミーム図鑑★").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  test("サブタイトルが表示される", () => {
    render(<RetroHeader />);
    expect(
      screen.getByText("インターネットの歴史を振り返れ！！")
    ).toBeInTheDocument();
  });

  test("検索フォームが表示される", () => {
    render(<RetroHeader />);
    expect(
      screen.getByPlaceholderText("ミームを検索...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "検索" })).toBeInTheDocument();
  });

  test("検索フォームに入力して送信するとrouter.pushが呼ばれる", async () => {
    render(<RetroHeader />);
    const input = screen.getByPlaceholderText("ミームを検索...");
    await userEvent.type(input, "ドージ");
    await userEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(mockPush).toHaveBeenCalledWith(
      `/?q=${encodeURIComponent("ドージ")}`
    );
  });

  test("空白のみの検索は送信しない", async () => {
    mockPush.mockClear();
    render(<RetroHeader />);
    const input = screen.getByPlaceholderText("ミームを検索...");
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByRole("button", { name: "検索" }));

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("何も入力せずに送信しない", async () => {
    mockPush.mockClear();
    render(<RetroHeader />);
    await userEvent.click(screen.getByRole("button", { name: "検索" }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
