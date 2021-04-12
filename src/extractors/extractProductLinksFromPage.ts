import $ from "cheerio";
import { Browser } from "puppeteer";
import { BASE_TARGET_URL, ProductTypeUrl } from "../config";


export const extractProductLinksFromPage = async (pageUrl: ProductTypeUrl, browser: Browser) => {
  const page = await browser.newPage();
  await page.goto(pageUrl);

  const html = await page.evaluate(() => document.body.innerHTML);

  await page.close()

  const anchorSelector = (pageUrl === ProductTypeUrl.PRESENTES) 
    ? '.container.module.carousel-slider.responsive a:not(.carousel-control)' 
    : 'a.product-name'

  const productLinks: string[] = $(anchorSelector, html)
    .map((_, el) => $(el).prop('href'))
    .filter((_, link) => !!link.toString().match(/\/products/ig))
    .map((_, link) => `${BASE_TARGET_URL}${link}`)
    .get();

  return productLinks
}