import fs from "node:fs/promises";
import path from "node:path";

export async function writeRunSummary({ outputDir, summaryFormats = [], pages }) {
  if (!pages.length) return;

  const summary = pages.map(page => ({
    url: page.url,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt,
    status: page.status,
    targetDir: page.targetDir,
    links: page.links.length,
    images: page.images.length
  }));

  if (summaryFormats.includes("json")) {
    await fs.writeFile(path.join(outputDir, "run-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  }

  if (summaryFormats.includes("jsonl")) {
    await fs.writeFile(
      path.join(outputDir, "run-summary.jsonl"),
      `${summary.map(item => JSON.stringify(item)).join("\n")}\n`,
      "utf8"
    );
  }

  if (summaryFormats.includes("csv")) {
    const rows = [
      ["url", "slug", "title", "status", "links", "images", "targetDir"],
      ...summary.map(item => [
        item.url,
        item.slug,
        item.title,
        String(item.status),
        String(item.links),
        String(item.images),
        item.targetDir
      ])
    ];
    await fs.writeFile(path.join(outputDir, "run-summary.csv"), rows.map(toCsvRow).join("\n"), "utf8");
  }
}

function toCsvRow(values) {
  return values
    .map(value => `"${String(value ?? "").replaceAll('"', '""')}"`)
    .join(",");
}
