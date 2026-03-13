import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { absolutizeUrl, cleanText } from "./util.js";

export function extractPageContent(page, options) {
  const dom = new JSDOM(page.html, { url: page.url });
  const document = dom.window.document;
  const $ = cheerio.load(page.html);
  const readability = new Readability(document);
  const article = readability.parse();
  const selectedHtml = options.selector ? $(options.selector).first().html() ?? "" : "";
  const mainHtml = selectedHtml || article?.content || $("main").first().html() || $("body").html() || "";
  const turnDown = new TurndownService();
  const title = article?.title || cleanText($("title").first().text()) || page.url;
  const excerpt = article?.excerpt || cleanText($("meta[name='description']").attr("content") || "");
  const markdown = turnDown.turndown(mainHtml);
  const links = $("a[href]")
    .map((_, element) => {
      const href = $(element).attr("href");
      return {
        text: cleanText($(element).text()),
        url: absolutizeUrl(page.url, href)
      };
    })
    .get()
    .filter(item => item.url);
  const images = $("img[src]")
    .map((_, element) => {
      const src = $(element).attr("src");
      return {
        alt: cleanText($(element).attr("alt") || ""),
        url: absolutizeUrl(page.url, src)
      };
    })
    .get()
    .filter(item => item.url);

  return {
    url: page.url,
    status: page.status,
    title,
    excerpt,
    byline: article?.byline || "",
    contentHtml: mainHtml,
    contentText: cleanText(markdown),
    markdown,
    links,
    images
  };
}
