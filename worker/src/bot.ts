const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|pinterest|applebot|discordbot|slackbot|telegrambot|whatsapp|headless|phantomjs|puppeteer|playwright|lighthouse/i;

export function isBotUA(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return BOT_UA_PATTERN.test(ua);
}
