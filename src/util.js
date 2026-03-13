export function cleanText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    if ((parsed.protocol === "http:" && parsed.port === "80") || (parsed.protocol === "https:" && parsed.port === "443")) {
      parsed.port = "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function absolutizeUrl(baseUrl, maybeRelative) {
  if (!maybeRelative) return "";

  try {
    return normalizeUrl(new URL(maybeRelative, baseUrl).toString());
  } catch {
    return "";
  }
}

export function isCrawlableUrl(startUrl, candidateUrl, includeSubdomains = false) {
  try {
    const start = new URL(startUrl);
    const candidate = new URL(candidateUrl);
    if (!["http:", "https:"].includes(candidate.protocol)) return false;

    if (includeSubdomains) {
      return candidate.hostname === start.hostname || candidate.hostname.endsWith(`.${start.hostname}`);
    }

    return candidate.hostname === start.hostname;
  } catch {
    return false;
  }
}

export function slugFromUrl(url, title) {
  const hostname = safeString(() => new URL(url).hostname.replace(/^www\./, ""), "page");
  const label = sanitizeSlug(title || safeString(() => new URL(url).pathname, "page"))
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${hostname}-${label || "page"}`;
}

export function assetFilenameFromUrl(url) {
  const pathname = safeString(() => new URL(url).pathname, "/asset");
  const name = pathname.split("/").filter(Boolean).pop() || "asset";
  return sanitizeSlug(name, true) || "asset";
}

function sanitizeSlug(value, keepDots = false) {
  const pattern = keepDots ? /[^a-z0-9.-]+/gi : /[^a-z0-9]+/gi;
  return String(value ?? "")
    .toLowerCase()
    .replace(pattern, "-")
    .replace(/-+/g, "-");
}

function safeString(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
