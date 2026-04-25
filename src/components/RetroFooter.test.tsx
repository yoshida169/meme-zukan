import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import RetroFooter from "./RetroFooter";

describe("RetroFooter", () => {
  test("サイトタイトルが表示される", () => {
    render(<RetroFooter />);
    expect(screen.getByText("★ネットミーム図鑑★")).toBeInTheDocument();
  });

  test("キャッチコピーが表示される", () => {
    render(<RetroFooter />);
    expect(
      screen.getByText(/インターネットの歴史を後世に残す/)
    ).toBeInTheDocument();
  });
});
