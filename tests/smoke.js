import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { extractPageContent } from "../src/extract.js";
import { saveOutputs } from "../src/save.js";

const fixturePath = path.resolve("tests/fixtures/article.html");
const html = await fs.readFile(fixturePath, "utf8");
const targetDir = path.resolve("tmp/smoke-output");

await fs.rm(targetDir, { recursive: true, force: true });
await fs.mkdir(targetDir, { recursive: true });

const extracted = extractPageContent(
  {
    url: "https://example.com/posts/example-article",
    html,
    status: 200
  },
  {}
);

assert.equal(extracted.title, "Example Article Title");
assert.match(extracted.markdown, /first paragraph/i);
assert.equal(extracted.images[0].url, "https://example.com/images/example.png");
assert.equal(extracted.links[1].url, "https://example.com/inside-link");

await saveOutputs({
  targetDir,
  page: {
    url: "https://example.com/posts/example-article",
    html,
    status: 200
  },
  extracted,
  formats: ["json", "md"],
  downloadAssets: false
});

const json = JSON.parse(await fs.readFile(path.join(targetDir, "content.json"), "utf8"));
const markdown = await fs.readFile(path.join(targetDir, "content.md"), "utf8");

assert.equal(json.title, "Example Article Title");
assert.match(markdown, /Source: https:\/\/example.com\/posts\/example-article/);

console.log("smoke test passed");
