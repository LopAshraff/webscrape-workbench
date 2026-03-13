import fs from "node:fs/promises";
import path from "node:path";
import { assetFilenameFromUrl } from "./util.js";

export async function downloadAssetsForPage({ targetDir, images, timeoutMs, userAgent }) {
  if (!images.length) return;

  const assetsDir = path.join(targetDir, "assets");
  await fs.mkdir(assetsDir, { recursive: true });

  for (const image of images) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs ?? 20000);
      const response = await fetch(image.url, {
        headers: {
          "user-agent": userAgent || "webscrape-workbench/0.1"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = assetFilenameFromUrl(image.url);
      await fs.writeFile(path.join(assetsDir, filename), buffer);
    } catch {}
  }
}
