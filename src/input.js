import fs from "node:fs/promises";

export async function loadUrlsFromFile(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));
}
