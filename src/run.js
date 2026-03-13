import fs from "node:fs/promises";
import path from "node:path";
import { scrapeMany, crawlSite } from "./scrape.js";
import { loadProfile } from "./profiles.js";

export async function runScrape(urls, options) {
  const uniqueUrls = [...new Set(urls)].filter(Boolean);

  if (!uniqueUrls.length) {
    throw new Error("Provide at least one URL.");
  }

  const profile = await loadProfile(options.profile, options.profileFile);
  const outputDir = path.resolve(options.outputDir ?? "scrapes");

  await fs.mkdir(outputDir, { recursive: true });

  const sharedOptions = {
    outputDir,
    formats: options.formats ?? ["json", "md"],
    summaryFormats: options.summaryFormats ?? ["json", "jsonl", "csv"],
    downloadAssets: options.downloadAssets || profile.downloadAssets || false,
    browser: options.browser || profile.browser || false,
    selector: options.selector || profile.selector,
    timeoutMs: options.timeoutMs ?? 20000,
    concurrency: options.concurrency ?? 3,
    userAgent: options.userAgent
  };

  const shouldCrawl = options.crawl || profile.crawl || false;
  const result = shouldCrawl
    ? await crawlSite(uniqueUrls[0], {
        ...sharedOptions,
        maxPages: options.maxPages || profile.maxPages || 10,
        includeSubdomains: options.includeSubdomains || false
      })
    : await scrapeMany(uniqueUrls, sharedOptions);

  return {
    ...result,
    outputDir
  };
}
