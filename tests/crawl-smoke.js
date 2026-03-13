import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { crawlSite } from "../src/scrape.js";

const outputDir = path.resolve("tmp/crawl-output");

await fs.rm(outputDir, { recursive: true, force: true });

const server = http.createServer((req, res) => {
  const routes = {
    "/": `<!doctype html><html><head><title>Home</title></head><body><main><a href="/page-a">A</a><a href="https://other.test/offsite">Offsite</a></main></body></html>`,
    "/page-a": `<!doctype html><html><head><title>Page A</title></head><body><main><a href="/page-b">B</a><p>Alpha</p></main></body></html>`,
    "/page-b": `<!doctype html><html><head><title>Page B</title></head><body><main><p>Beta</p></main></body></html>`
  };

  const body = routes[req.url] ?? "<!doctype html><html><head><title>Missing</title></head><body>missing</body></html>";
  res.writeHead(routes[req.url] ? 200 : 404, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

try {
  const address = server.address();
  const startUrl = `http://127.0.0.1:${address.port}/`;

  const result = await crawlSite(startUrl, {
    outputDir,
    formats: ["json", "md"],
    summaryFormats: ["json", "jsonl", "csv"],
    downloadAssets: false,
    browser: false,
    selector: undefined,
    timeoutMs: 20000,
    concurrency: 1,
    userAgent: undefined,
    maxPages: 3,
    includeSubdomains: false
  });

  assert.equal(result.ok, 3);
  assert.equal(result.failed, 0);

  const summary = JSON.parse(await fs.readFile(path.join(outputDir, "run-summary.json"), "utf8"));
  assert.equal(summary.length, 3);
  assert.equal(summary[0].title, "Home");

  const jsonl = await fs.readFile(path.join(outputDir, "run-summary.jsonl"), "utf8");
  assert.match(jsonl, /"title":"Page A"/);

  const csv = await fs.readFile(path.join(outputDir, "run-summary.csv"), "utf8");
  assert.match(csv, /"Page B"/);

  console.log("crawl smoke test passed");
} finally {
  await new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
}
