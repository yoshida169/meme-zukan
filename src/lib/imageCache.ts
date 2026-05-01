import fs from "fs";
import path from "path";

export async function cacheImage(url: string, id: string): Promise<string> {
  try {
    const dir = path.join(process.cwd(), "public", "images", "memes");
    fs.mkdirSync(dir, { recursive: true });

    const existing = fs.readdirSync(dir).find((f) => f.startsWith(id));
    if (existing) return `/images/memes/${existing}`;

    const res = await fetch(url);
    if (!res.ok) return url;

    const contentType = res.headers.get("content-type") ?? "";
    const ext = contentType.includes("png")
      ? ".png"
      : contentType.includes("gif")
      ? ".gif"
      : contentType.includes("webp")
      ? ".webp"
      : ".jpg";

    const filename = `${id}${ext}`;
    fs.writeFileSync(path.join(dir, filename), Buffer.from(await res.arrayBuffer()));
    return `/images/memes/${filename}`;
  } catch {
    return url;
  }
}
