import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getBuiltInProfiles } from "./profiles.js";
import { runScrape } from "./run.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.join(__dirname, "..", "web");
const outputRoot = path.resolve("scrapes-ui");
const port = Number(process.env.PORT ?? 4173);

await fs.mkdir(outputRoot, { recursive: true });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/") {
    return sendFile(res, path.join(webDir, "index.html"), "text/html; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/styles.css") {
    return sendFile(res, path.join(webDir, "styles.css"), "text/css; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/app.js") {
    return sendFile(res, path.join(webDir, "app.js"), "application/javascript; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/api/profiles") {
    return sendJson(res, 200, { profiles: getBuiltInProfiles() });
  }

  if (req.method === "POST" && url.pathname === "/api/scrape") {
    try {
      const body = await readJson(req);
      const timestamp = new Date().toISOString().replaceAll(":", "-");
      const result = await runScrape([String(body.url ?? "").trim()], {
        outputDir: path.join(outputRoot, `run-${timestamp}`),
        formats: ["json", "md"],
        summaryFormats: ["json", "jsonl", "csv"],
        downloadAssets: Boolean(body.downloadAssets),
        browser: Boolean(body.browser),
        selector: String(body.selector ?? "").trim() || undefined,
        profile: String(body.profile ?? "").trim() || undefined,
        crawl: Boolean(body.crawl),
        maxPages: Number(body.maxPages || 10),
        includeSubdomains: Boolean(body.includeSubdomains),
        timeoutMs: 20000,
        concurrency: 2
      });

      return sendJson(res, 200, {
        ok: true,
        summary: {
          ok: result.ok,
          failed: result.failed,
          total: result.total,
          outputDir: result.outputDir
        },
        pages: result.pages.map(page => ({
          title: page.title,
          url: page.url,
          excerpt: page.excerpt,
          slug: page.slug,
          links: page.links.length,
          images: page.images.length,
          markdownPath: `/outputs/${path.basename(result.outputDir)}/${page.slug}/content.md`,
          jsonPath: `/outputs/${path.basename(result.outputDir)}/${page.slug}/content.json`
        }))
      });
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  if (req.method === "GET" && url.pathname.startsWith("/outputs/")) {
    const relativePath = decodeURIComponent(url.pathname.replace("/outputs/", ""));
    const filePath = path.join(outputRoot, relativePath);

    if (!filePath.startsWith(outputRoot)) {
      return sendJson(res, 400, { error: "Invalid path" });
    }

    const contentType = filePath.endsWith(".json")
      ? "application/json; charset=utf-8"
      : filePath.endsWith(".md")
        ? "text/markdown; charset=utf-8"
        : "text/plain; charset=utf-8";

    return sendFile(res, filePath, contentType);
  }

  return sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  process.stdout.write(`webscrape UI on http://localhost:${port}\n`);
});

async function sendFile(res, filePath, contentType) {
  const content = await fs.readFile(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
