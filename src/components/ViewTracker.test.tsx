import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ViewTracker from "./ViewTracker";

const WORKER_URL = "https://worker.example.com";

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  vi.stubEnv("NEXT_PUBLIC_WORKER_URL", WORKER_URL);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ViewTracker", () => {
  test("マウント時に /api/view へ POST する", () => {
    render(<ViewTracker slug="neko-meme" />);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe(`${WORKER_URL}/api/view`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ slug: "neko-meme" });
  });

  test("sessionStorage に viewed フラグを立て、同じ slug では再送しない", () => {
    const { unmount } = render(<ViewTracker slug="neko-meme" />);
    expect(sessionStorage.getItem("viewed:neko-meme")).toBe("1");
    unmount();

    render(<ViewTracker slug="neko-meme" />);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("別 slug なら別フラグで送信される", () => {
    render(<ViewTracker slug="a" />);
    cleanup();
    render(<ViewTracker slug="b" />);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("NEXT_PUBLIC_WORKER_URL が未設定なら何もしない", () => {
    vi.stubEnv("NEXT_PUBLIC_WORKER_URL", "");
    render(<ViewTracker slug="x" />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("slug が空文字なら何もしない", () => {
    render(<ViewTracker slug="" />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("fetch が reject しても例外を投げない", () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("network"));
    expect(() => render(<ViewTracker slug="x" />)).not.toThrow();
  });
});
