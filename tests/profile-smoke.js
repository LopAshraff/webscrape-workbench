import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { loadProfile } from "../src/profiles.js";

const profile = await loadProfile("docs");
assert.equal(profile.crawl, true);
assert.equal(profile.maxPages, 25);

const profileFile = path.resolve("tmp/profile-test.json");
await fs.mkdir(path.dirname(profileFile), { recursive: true });
await fs.writeFile(
  profileFile,
  JSON.stringify(
    {
      custom: {
        browser: true,
        selector: ".main-content",
        crawl: false
      }
    },
    null,
    2
  ),
  "utf8"
);

const custom = await loadProfile("custom", profileFile);
assert.equal(custom.browser, true);
assert.equal(custom.selector, ".main-content");

console.log("profile smoke test passed");
