import fs from "node:fs/promises";
import path from "node:path";
import { downloadAssetsForPage } from "./save-assets.js";

export async function saveOutputs({ targetDir, page, extracted, formats, downloadAssets, timeoutMs, userAgent }) {
  await fs.writeFile(path.join(targetDir, "raw.html"), page.html, "utf8");

  if (formats.includes("json")) {
    await fs.writeFile(
      path.join(targetDir, "content.json"),
      JSON.stringify(extracted, null, 2),
      "utf8"
    );
  }

  if (formats.includes("md")) {
    const markdown = [
      `# ${extracted.title}`,
      "",
      `Source: ${extracted.url}`,
      "",
      extracted.excerpt ? `> ${extracted.excerpt}` : "",
      "",
      extracted.markdown
    ]
      .filter(Boolean)
      .join("\n");

    await fs.writeFile(path.join(targetDir, "content.md"), markdown, "utf8");
  }

  if (downloadAssets) {
    await downloadAssetsForPage({
      targetDir,
      images: extracted.images,
      timeoutMs,
      userAgent
    });
  }
}
