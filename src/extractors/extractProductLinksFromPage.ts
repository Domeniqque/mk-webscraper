import { Browser } from "puppeteer";
import { ProductTypeUrl } from "../config";

export const extractProductLinksFromPage = async (pageUrl: ProductTypeUrl, browser: Browser) => {
  const page = await browser.newPage();
  await page.goto(pageUrl);

  const productLinks = await page.evaluate(() => {
    const nodeElements = [...document.querySelectorAll('a.product-name')] as HTMLAnchorElement[];

    return nodeElements.map(a => a.href);
  });

  await page.close()

  return productLinks;
}