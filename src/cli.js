#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { scrapeMany, crawlSite } from "./scrape.js";
import { loadUrlsFromFile } from "./input.js";

const program = new Command();

program
  .name("webscrape")
  .description("Scrape one or more URLs into clean JSON and Markdown outputs.")
  .argument("[url]", "single URL to scrape")
  .option("-i, --input <file>", "text file with one URL per line")
  .option("-o, --output <dir>", "output directory", "scrapes")
  .option("-f, --format <formats>", "comma-separated output formats", "json,md")
  .option("--assets", "download page images into an assets folder", false)
  .option("--browser", "render the page in a headless browser before extraction", false)
  .option("--selector <css>", "extract only content within a CSS selector")
  .option("--crawl", "follow same-domain links starting from the provided URL", false)
  .option("--max-pages <number>", "maximum pages to crawl when --crawl is enabled", value => Number(value), 10)
  .option("--include-subdomains", "allow crawling subdomains of the start URL", false)
  .option("--summary-formats <formats>", "comma-separated run summary formats", "json,jsonl,csv")
  .option("--concurrency <number>", "number of concurrent jobs", value => Number(value), 3)
  .option("--timeout <ms>", "request timeout in milliseconds", value => Number(value), 20000)
  .option("--user-agent <value>", "custom user agent")
  .action(async (url, options) => {
    const urls = [];

    if (url) urls.push(url);
    if (options.input) {
      const fileUrls = await loadUrlsFromFile(options.input);
      urls.push(...fileUrls);
    }

    const uniqueUrls = [...new Set(urls)].filter(Boolean);

    if (!uniqueUrls.length) {
      program.error("Provide a URL or use --input with a file of URLs.");
    }

    await fs.mkdir(path.resolve(options.output), { recursive: true });

    const sharedOptions = {
      outputDir: path.resolve(options.output),
      formats: options.format.split(",").map(item => item.trim()).filter(Boolean),
      summaryFormats: options.summaryFormats.split(",").map(item => item.trim()).filter(Boolean),
      downloadAssets: options.assets,
      browser: options.browser,
      selector: options.selector,
      timeoutMs: options.timeout,
      concurrency: options.concurrency,
      userAgent: options.userAgent
    };

    const result = options.crawl
      ? await crawlSite(uniqueUrls[0], {
          ...sharedOptions,
          maxPages: options.maxPages,
          includeSubdomains: options.includeSubdomains
        })
      : await scrapeMany(uniqueUrls, sharedOptions);

    const summary = {
      ok: result.ok,
      failed: result.failed,
      total: result.total,
      outputDir: path.resolve(options.output)
    };

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (result.failed) process.exitCode = 1;
  });

await program.parseAsync(process.argv);
