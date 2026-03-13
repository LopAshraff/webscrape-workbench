import { chromium } from "playwright";

export async function fetchPage(url, options) {
  if (options.browser) {
    return fetchWithBrowser(url, options);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20000);

  try {
    const response = await fetch(url, {
      headers: buildHeaders(options.userAgent),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return {
      url: response.url,
      html: await response.text(),
      status: response.status
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithBrowser(url, options) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      userAgent: options.userAgent || defaultUserAgent()
    });
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: options.timeoutMs ?? 20000
    });

    return {
      url: page.url(),
      html: await page.content(),
      status: response?.status() ?? 200
    };
  } finally {
    await browser.close();
  }
}

function buildHeaders(userAgent) {
  return {
    "user-agent": userAgent || defaultUserAgent()
  };
}

function defaultUserAgent() {
  return "webscrape-workbench/0.1 (+https://github.com/LopAshraff/webscrape-workbench)";
}
