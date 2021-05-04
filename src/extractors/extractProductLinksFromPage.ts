import { Browser } from "puppeteer";
import { ProductTypeUrl } from "../config";


export const extractProductLinksFromPage = async (pageUrl: ProductTypeUrl, browser: Browser) => {
  const page = await browser.newPage();
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded'});

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    if (['image', 'websocket', 'font'].includes(request.resourceType())) {
      return request.abort()
    } else {
      return request.continue()
    }
  })

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