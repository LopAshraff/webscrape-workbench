import fs from "node:fs/promises";
import path from "node:path";
import { fetchPage } from "./transport.js";
import { extractPageContent } from "./extract.js";
import { saveOutputs } from "./save.js";
import { slugFromUrl } from "./util.js";

export async function scrapeUrl(url, options) {
  const page = await fetchPage(url, options);
  const extracted = extractPageContent(page, options);
  const slug = slugFromUrl(url, extracted.title);
  const targetDir = path.join(options.outputDir, slug);

  await fs.mkdir(targetDir, { recursive: true });
  await saveOutputs({
    targetDir,
    page,
    extracted,
    formats: options.formats,
    downloadAssets: options.downloadAssets,
    timeoutMs: options.timeoutMs,
    userAgent: options.userAgent
  });

  return {
    ...extracted,
    slug,
    targetDir
  };
}
