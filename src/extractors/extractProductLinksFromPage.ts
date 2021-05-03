import { Page } from "puppeteer";
import { ProductTypeUrl } from "../config";


export const extractProductLinksFromPage = async (pageUrl: ProductTypeUrl, page: Page) => {
  await page.goto(pageUrl);

  const anchorSelector = await page.evaluate(() => [
    // carousel
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('.container.module.carousel-slider.responsive a:not(.carousel-control)')).map(a => a.href),
    // grid
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('a.product-name')).map(a => a.href),
  ]);

  const productLinks: string[] = anchorSelector
    .filter(link => !!link.toString().match(/\/products/ig))

  return productLinks
}