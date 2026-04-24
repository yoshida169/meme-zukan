import { describe, expect, test } from "vitest";
import { isBotUA } from "./bot";

describe("isBotUA", () => {
  test.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Twitterbot/1.0",
    "facebookexternalhit/1.1",
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    "HeadlessChrome/120.0.0.0",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-Bot)",
    "Chrome-Lighthouse",
    "Playwright/1.0",
    "puppeteer",
  ])("bot UA と判定する: %s", (ua) => {
    expect(isBotUA(ua)).toBe(true);
  });

  test.each([
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  ])("人間の UA は bot でないと判定する: %s", (ua) => {
    expect(isBotUA(ua)).toBe(false);
  });

  test("UA が無い場合は bot 扱い", () => {
    expect(isBotUA(null)).toBe(true);
    expect(isBotUA(undefined)).toBe(true);
    expect(isBotUA("")).toBe(true);
  });
});
