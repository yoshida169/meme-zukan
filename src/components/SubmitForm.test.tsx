import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubmitForm from "./SubmitForm";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "https://worker.example.com");
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("SubmitForm", () => {
  test("必須項目が空のまま送信するとエラー表示 (ブラウザネイティブ検証で fetch されない)", async () => {
    render(<SubmitForm />);
    const submit = screen.getByRole("button", { name: /情報を提供する/ });
    await userEvent.click(submit);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("正常入力で Worker に POST し、成功表示に切り替わる", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 201 })
    );

    render(<SubmitForm />);
    await userEvent.type(screen.getByPlaceholderText(/〇〇すぎる/), "草");
    await userEvent.type(
      screen.getByPlaceholderText(/どんなミームか/),
      "笑いを表す表現"
    );
    await userEvent.type(screen.getByPlaceholderText(/例: 2008/), "2010");

    await userEvent.click(
      screen.getByRole("button", { name: /情報を提供する/ })
    );

    await waitFor(() => {
      expect(screen.getByText(/送信完了/)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://worker.example.com/api/submit");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      name: "草",
      description: "笑いを表す表現",
      year: 2010,
    });
  });

  test("Worker がエラーを返すとエラーメッセージを表示", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      new Response("Boom", { status: 502 })
    );

    render(<SubmitForm />);
    await userEvent.type(screen.getByPlaceholderText(/〇〇すぎる/), "x");
    await userEvent.type(screen.getByPlaceholderText(/どんなミームか/), "y");

    await userEvent.click(
      screen.getByRole("button", { name: /情報を提供する/ })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
