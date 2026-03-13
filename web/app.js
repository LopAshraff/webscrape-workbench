const profileEl = document.querySelector("#profile");
const profileHelpEl = document.querySelector("#profile-help");
const urlEl = document.querySelector("#url");
const selectorEl = document.querySelector("#selector");
const maxPagesEl = document.querySelector("#max-pages");
const crawlEl = document.querySelector("#crawl");
const browserEl = document.querySelector("#browser");
const assetsEl = document.querySelector("#assets");
const subdomainsEl = document.querySelector("#subdomains");
const runEl = document.querySelector("#run");
const openFolderEl = document.querySelector("#open-folder");
const statusEl = document.querySelector("#status");
const summaryCopyEl = document.querySelector("#summary-copy");
const resultsEl = document.querySelector("#results");
const recentRunsEl = document.querySelector("#recent-runs");
let lastOutputDir = "";
let profileMap = {};

await loadProfiles();
await loadRecentRuns();

runEl.addEventListener("click", async () => {
  if (!urlEl.value.trim()) {
    statusEl.textContent = "Enter a URL first";
    return;
  }

  runEl.disabled = true;
  statusEl.textContent = "Running...";
  resultsEl.innerHTML = '<p class="empty">Scraping in progress...</p>';

  try {
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        url: urlEl.value.trim(),
        profile: profileEl.value || undefined,
        selector: selectorEl.value.trim() || undefined,
        maxPages: Number(maxPagesEl.value || 10),
        crawl: crawlEl.checked,
        browser: browserEl.checked,
        downloadAssets: assetsEl.checked,
        includeSubdomains: subdomainsEl.checked
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Scrape failed");
    }

    statusEl.textContent = "Done";
    lastOutputDir = data.summary.outputDir;
    summaryCopyEl.textContent = `${data.summary.ok} page(s) saved. Output: ${data.summary.outputDir}`;
    resultsEl.innerHTML = data.pages
      .map(
        page => `
          <article class="result-card">
            <h3>${escapeHtml(page.title)}</h3>
            <p>${escapeHtml(page.excerpt || "No excerpt available.")}</p>
            <p class="meta">${escapeHtml(page.url)}</p>
            <p class="meta">${page.links} links · ${page.images} images</p>
            <div class="links">
              <a href="${page.markdownPath}" target="_blank" rel="noreferrer">Markdown</a>
              <a href="${page.jsonPath}" target="_blank" rel="noreferrer">JSON</a>
            </div>
          </article>
        `
      )
      .join("");
    await loadRecentRuns();
  } catch (error) {
    statusEl.textContent = "Error";
    resultsEl.innerHTML = `<p class="empty">${escapeHtml(error.message || "Scrape failed")}</p>`;
  } finally {
    runEl.disabled = false;
  }
});

openFolderEl.addEventListener("click", async () => {
  if (!lastOutputDir) {
    statusEl.textContent = "Run a scrape first";
    return;
  }

  const response = await fetch("/api/open-output", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ outputDir: lastOutputDir })
  });

  const data = await response.json();
  statusEl.textContent = response.ok && data.ok ? "Folder opened" : data.error || "Could not open folder";
});

profileEl.addEventListener("change", async () => {
  const response = await fetch("/api/profiles");
  const data = await response.json();
  const profile = data.profiles[profileEl.value];
  if (!profile) return;

  selectorEl.value = profile.selector || "";
  crawlEl.checked = Boolean(profile.crawl);
  browserEl.checked = Boolean(profile.browser);
  assetsEl.checked = Boolean(profile.downloadAssets);
  if (profile.maxPages) {
    maxPagesEl.value = String(profile.maxPages);
  }
  profileHelpEl.textContent = describeProfile(profileEl.value, profile);
});

async function loadProfiles() {
  const response = await fetch("/api/profiles");
  const data = await response.json();
  profileMap = data.profiles;
  profileEl.innerHTML = `<option value="">None</option>${Object.keys(data.profiles)
    .map(name => `<option value="${name}">${name}</option>`)
    .join("")}`;
  profileHelpEl.textContent = "Use a built-in preset when you want less manual setup.";
}

async function loadRecentRuns() {
  const response = await fetch("/api/runs");
  const data = await response.json();

  if (!data.runs?.length) {
    recentRunsEl.innerHTML = '<p class="empty">No recent runs yet.</p>';
    return;
  }

  recentRunsEl.innerHTML = data.runs
    .map(
      run => `
        <article class="result-card">
          <h3>${escapeHtml(run.firstTitle)}</h3>
          <p class="meta">${escapeHtml(run.outputDir)}</p>
          <p class="meta">${run.pages} page(s)</p>
        </article>
      `
    )
    .join("");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function describeProfile(name, profile) {
  const descriptions = {
    article: "Good for blog posts, articles, and news pages.",
    docs: "Good for documentation pages and same-domain crawling.",
    jsapp: "Good for pages that only reveal content after JavaScript loads.",
    media: "Good when you want to save page images as well."
  };

  return descriptions[name] || `Profile loaded${profile.selector ? ` with selector: ${profile.selector}` : "."}`;
}
