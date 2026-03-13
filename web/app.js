const profileEl = document.querySelector("#profile");
const urlEl = document.querySelector("#url");
const selectorEl = document.querySelector("#selector");
const maxPagesEl = document.querySelector("#max-pages");
const crawlEl = document.querySelector("#crawl");
const browserEl = document.querySelector("#browser");
const assetsEl = document.querySelector("#assets");
const subdomainsEl = document.querySelector("#subdomains");
const runEl = document.querySelector("#run");
const statusEl = document.querySelector("#status");
const summaryCopyEl = document.querySelector("#summary-copy");
const resultsEl = document.querySelector("#results");

await loadProfiles();

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
  } catch (error) {
    statusEl.textContent = "Error";
    resultsEl.innerHTML = `<p class="empty">${escapeHtml(error.message || "Scrape failed")}</p>`;
  } finally {
    runEl.disabled = false;
  }
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
});

async function loadProfiles() {
  const response = await fetch("/api/profiles");
  const data = await response.json();
  profileEl.innerHTML = `<option value="">None</option>${Object.keys(data.profiles)
    .map(name => `<option value="${name}">${name}</option>`)
    .join("")}`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
