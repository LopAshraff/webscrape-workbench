import pLimit from "p-limit";
import { scrapeUrl } from "./scrape-url.js";
import { writeRunSummary } from "./summary.js";
import { isCrawlableUrl, normalizeUrl } from "./util.js";

export async function scrapeMany(urls, options) {
  const limit = pLimit(Math.max(1, options.concurrency ?? 3));
  const results = await Promise.allSettled(
    urls.map(url =>
      limit(async () => {
        return scrapeUrl(url, options);
      })
    )
  );

  const failed = results.filter(item => item.status === "rejected").length;
  const succeeded = results
    .filter(item => item.status === "fulfilled")
    .map(item => item.value);

  await writeRunSummary({
    outputDir: options.outputDir,
    summaryFormats: options.summaryFormats,
    pages: succeeded
  });

  return {
    ok: urls.length - failed,
    failed,
    total: urls.length,
    pages: succeeded
  };
}

export async function crawlSite(startUrl, options) {
  const queue = [normalizeUrl(startUrl)];
  const seen = new Set(queue);
  const pages = [];
  let failed = 0;

  while (queue.length && pages.length < options.maxPages) {
    const url = queue.shift();

    try {
      const page = await scrapeUrl(url, options);
      pages.push(page);

      for (const link of page.links) {
        const candidate = normalizeUrl(link.url);
        if (!candidate || seen.has(candidate)) continue;
        if (!isCrawlableUrl(startUrl, candidate, options.includeSubdomains)) continue;

        seen.add(candidate);
        if (pages.length + queue.length < options.maxPages) {
          queue.push(candidate);
        }
      }
    } catch {
      failed += 1;
    }
  }

  await writeRunSummary({
    outputDir: options.outputDir,
    summaryFormats: options.summaryFormats,
    pages
  });

  return {
    ok: pages.length,
    failed,
    total: pages.length + failed,
    pages
  };
}
