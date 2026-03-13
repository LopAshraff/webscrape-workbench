import fs from "node:fs/promises";

const builtInProfiles = {
  article: {
    browser: false,
    selector: "article, main article, .article-body, .post-content, .entry-content",
    downloadAssets: false
  },
  docs: {
    browser: false,
    crawl: true,
    maxPages: 25,
    selector: "main, article, .content, .markdown-body",
    downloadAssets: false
  },
  jsapp: {
    browser: true,
    selector: "main, article, .content, body",
    downloadAssets: false
  },
  media: {
    browser: false,
    downloadAssets: true,
    selector: "main, article, body"
  }
};

export function getBuiltInProfiles() {
  return builtInProfiles;
}

export async function loadProfile(profileName, profileFile) {
  if (!profileName) return {};

  if (builtInProfiles[profileName]) {
    return builtInProfiles[profileName];
  }

  if (!profileFile) {
    throw new Error(`Unknown profile: ${profileName}`);
  }

  const text = await fs.readFile(profileFile, "utf8");
  const profiles = JSON.parse(text);
  const profile = profiles[profileName];

  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}`);
  }

  return profile;
}
