import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { execFile, exec } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getBuiltInProfiles } from "./profiles.js";
import { runScrape } from "./run.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const defaultWebDir = path.join(__dirname, "..", "web");
export const defaultOutputRoot = path.resolve(process.env.WEBSCRAPE_OUTPUT_ROOT ?? "scrapes-ui");

export async function startAppServer({
  port = 4173,
  webDir = defaultWebDir,
  outputRoot = defaultOutputRoot,
  fallbackToRandomPort = false
} = {}) {
  await fs.mkdir(outputRoot, { recursive: true });

  const server = createAppServer({ webDir, outputRoot });
  const actualPort = await listenWithFallback(server, port, fallbackToRandomPort);

  return { server, port: actualPort, outputRoot };
}

export function createAppServer({ webDir = defaultWebDir, outputRoot = defaultOutputRoot } = {}) {
  return http.createServer((req, res) => {
    void handleRequest(req, res, { webDir, outputRoot }).catch(error => {
      if (res.headersSent) {
        res.end();
        return;
      }

      const statusCode = error?.code === "ENOENT" ? 404 : 500;
      sendJson(res, statusCode, {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error"
      });
    });
  });
}

async function handleRequest(req, res, { webDir, outputRoot }) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

  if (req.method === "GET" && url.pathname === "/") {
    return sendFile(res, path.join(webDir, "index.html"), "text/html; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/styles.css") {
    return sendFile(res, path.join(webDir, "styles.css"), "text/css; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/app.js") {
    return sendFile(res, path.join(webDir, "app.js"), "application/javascript; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/profiles") {
    return sendJson(res, 200, { profiles: getBuiltInProfiles() });
  }

  if (req.method === "GET" && url.pathname === "/api/runs") {
    const runs = await listRecentRuns(outputRoot);
    return sendJson(res, 200, { runs });
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

  if (req.method === "POST" && url.pathname === "/api/open-output") {
    try {
      const body = await readJson(req);
      const requested = path.resolve(String(body.outputDir ?? ""));

      if (!isWithinRoot(outputRoot, requested)) {
        return sendJson(res, 400, { ok: false, error: "Invalid output directory" });
      }

      await fs.access(requested);
      const opened = await openFolder(requested);
      return sendJson(res, 200, { ok: true, opened });
    } catch (error) {
      return sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Could not open folder"
      });
    }
  }

  if (req.method === "GET" && url.pathname.startsWith("/outputs/")) {
    const relativePath = decodeURIComponent(url.pathname.replace("/outputs/", ""));
    const filePath = path.resolve(outputRoot, relativePath);

    if (!isWithinRoot(outputRoot, filePath)) {
      return sendJson(res, 400, { ok: false, error: "Invalid path" });
    }

    const contentType = filePath.endsWith(".json")
      ? "application/json; charset=utf-8"
      : filePath.endsWith(".md")
        ? "text/markdown; charset=utf-8"
        : "text/plain; charset=utf-8";

    return sendFile(res, filePath, contentType);
  }

  return sendJson(res, 404, { ok: false, error: "Not found" });
}

async function listRecentRuns(outputRoot) {
  const entries = await fs.readdir(outputRoot, { withFileTypes: true });
  const directories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  const runs = [];

  for (const name of directories.sort().reverse().slice(0, 8)) {
    const runDir = path.join(outputRoot, name);
    const summaryPath = path.join(runDir, "run-summary.json");

    try {
      const summary = JSON.parse(await fs.readFile(summaryPath, "utf8"));
      runs.push({
        name,
        outputDir: runDir,
        pages: summary.length,
        firstTitle: summary[0]?.title ?? "Untitled run"
      });
    } catch {}
  }

  return runs;
}

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

function openFolder(folderPath) {
  return new Promise(resolve => {
    execFile("explorer.exe", [folderPath], error => {
      if (!error) {
        resolve(true);
        return;
      }

      exec(`start "" "${folderPath}"`, { shell: "cmd.exe" }, fallbackError => {
        resolve(!fallbackError);
      });
    });
  });
}

function isWithinRoot(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function listenWithFallback(server, port, fallbackToRandomPort) {
  try {
    return await listen(server, port);
  } catch (error) {
    if (fallbackToRandomPort && error?.code === "EADDRINUSE") {
      return listen(server, 0);
    }

    throw error;
  }
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = error => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      const address = server.address();
      resolve(typeof address === "object" && address ? address.port : port);
    };
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}
