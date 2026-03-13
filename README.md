# webscrape-workbench

CLI-first utility untuk mudahkan web scraping dan simpan hasil dalam format yang senang diguna semula.

Tool ini fokus pada kerja yang paling kerap diperlukan semasa scrape:

- fetch satu atau banyak URL
- crawl beberapa page dalam domain yang sama
- extract tajuk, metadata, kandungan utama, links, dan images
- simpan `raw.html`, `content.json`, dan `content.md`
- hasilkan `run-summary.json`, `run-summary.jsonl`, dan `run-summary.csv`
- optional `--assets` untuk download imej halaman
- optional `--browser` untuk page yang perlukan rendering JavaScript

## Kenapa tool ini wujud

Kebanyakan script scrape cepat jadi serabut kerana:

- fetch bercampur dengan extraction
- output tak konsisten
- setiap site perlu ditangani semula dari kosong

`webscrape-workbench` pecahkan kerja itu kepada pipeline yang lebih bersih:

1. fetch page
2. extract main content
3. normalize links dan media
4. save output yang boleh diinspeksi dan diproses semula

## Quick Start

```bash
npm install
npx webscrape https://example.com
```

Output akan masuk ke folder `scrapes/`.

## User-Friendly Mode

Kalau kau nak guna tanpa terminal yang banyak, buka local web app:

```bash
npm run app
```

Lepas itu buka:

```text
http://localhost:4173
```

Di situ user hanya perlu:

1. tampal URL
2. pilih profile kalau perlu
3. tekan `Run scrape`
4. buka hasil `Markdown` atau `JSON`

## Cheat Sheet

Command paling ringkas:

```bash
npx webscrape <URL>
```

Contoh biasa:

Scrape satu page:

```bash
npx webscrape https://example.com/article
```

Scrape banyak URL dari fail:

```bash
npx webscrape --input urls.txt
```

Crawl beberapa page dalam domain yang sama:

```bash
npx webscrape https://example.com/docs --crawl --max-pages 20
```

Pakai browser mode:

```bash
npx webscrape https://example.com/app --browser
```

Download imej sekali:

```bash
npx webscrape https://example.com/post --assets
```

Guna selector tertentu:

```bash
npx webscrape https://example.com/post --selector ".article-body"
```

Guna profile built-in:

```bash
npx webscrape https://example.com/docs --profile docs
```

Tukar folder output:

```bash
npx webscrape https://example.com --output hasil-scrape
```

Kalau kau hanya nak test cepat tanpa option tambahan, ini pun boleh:

```bash
npm run scrape -- https://example.com
```

## CLI Usage

```bash
npx webscrape [url] [options]
```

Pilihan utama:

- `--input <file>`: fail teks dengan satu URL setiap baris
- `--output <dir>`: folder output, default `scrapes`
- `--format <formats>`: contoh `json,md`
- `--assets`: download image assets
- `--browser`: render page dengan Playwright sebelum extraction
- `--selector <css>`: hadkan extraction kepada CSS selector tertentu
- `--profile <name>`: profile built-in seperti `article`, `docs`, `jsapp`, `media`
- `--profile-file <file>`: fail JSON dengan preset scrape sendiri
- `--crawl`: ikut link dalam domain yang sama bermula dari URL pertama
- `--max-pages <number>`: had crawl, default `10`
- `--include-subdomains`: benarkan crawl subdomain
- `--summary-formats <formats>`: contoh `json,jsonl,csv`
- `--concurrency <number>`: bilangan job serentak
- `--timeout <ms>`: request timeout
- `--user-agent <value>`: override user-agent

## Examples

Scrape satu URL:

```bash
npx webscrape https://example.com/articles/hello-world
```

Scrape banyak URL dari fail:

```bash
npx webscrape --input urls.txt --output scrapes/batch-run
```

Crawl satu domain kecil:

```bash
npx webscrape https://example.com/docs --crawl --max-pages 20
```

Scrape page JS-heavy:

```bash
npx webscrape https://example.com/app --browser
```

Scrape dan download imej:

```bash
npx webscrape https://example.com/post --assets
```

Scrape kandungan dalam selector tertentu sahaja:

```bash
npx webscrape https://example.com/post --selector ".article-body"
```

Scrape guna profile:

```bash
npx webscrape https://example.com/docs --profile docs
```

## Output Structure

Setiap URL akan dapat satu folder sendiri:

```text
scrapes/
  run-summary.json
  run-summary.jsonl
  run-summary.csv
  example-com-example-article-title/
    raw.html
    content.json
    content.md
    assets/
```

Kandungan fail:

- `raw.html`: salinan HTML asal
- `content.json`: metadata + content yang sudah diextract
- `content.md`: versi markdown yang lebih mudah dibaca/diolah
- `assets/`: fail image yang berjaya dimuat turun
- `run-summary.*`: ringkasan semua page dalam satu run, sesuai untuk audit atau dataset pipeline

## Browser Mode

`--browser` guna Playwright dan headless Chromium untuk render page sebelum scrape. Ini berguna untuk:

- page yang load content melalui JavaScript
- “load after render” content
- site yang tak beri HTML penuh pada initial request

Jika browser mode belum pernah dipasang pada mesin ini, pasang Chromium sekali:

```bash
npx playwright install chromium
```

## Profiles

Built-in profile yang ada sekarang:

- `article`: fokus content article/post
- `docs`: crawl docs page dalam domain yang sama
- `jsapp`: paksa browser mode untuk page JavaScript-heavy
- `media`: download assets sekali

Contoh:

```bash
npx webscrape https://example.com/blog/post --profile article
npx webscrape https://example.com/docs --profile docs
```

Kalau kau nak profile sendiri, buat fail JSON:

```json
{
  "mydocs": {
    "crawl": true,
    "maxPages": 40,
    "selector": ".content-body",
    "browser": false,
    "downloadAssets": false
  }
}
```

Lepas itu guna:

```bash
npx webscrape https://example.com/docs --profile mydocs --profile-file profiles.json
```

## Development

Run smoke test:

```bash
npm run smoke
```

Smoke test guna fixture lokal, jadi ia tak bergantung pada internet untuk pass.

## Notes

- Tool ini tak cuba bypass auth, DRM, atau paywall
- Guna hanya pada content yang memang sah untuk kau akses dan simpan
- Extraction “main content” ialah heuristic, jadi untuk site pelik kadang-kadang `--selector` lebih tepat

## Existing Files

Repo ini masih ada `docs/` dan `output/` lama daripada kerja lain. Tool scraping baru duduk dalam:

- `src/`
- `tests/`
- `package.json`
