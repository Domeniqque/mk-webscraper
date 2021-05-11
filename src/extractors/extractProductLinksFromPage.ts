import { Browser } from "puppeteer";
import { ProductTypeUrl } from "../config";


export const extractProductLinksFromPage = async (pageUrl: ProductTypeUrl, browser: Browser) => {
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setRequestInterception(true);
  
  page.on('request', (req) => {
    if (['stylesheet', 'font', 'image'].includes(req.resourceType())){
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(pageUrl, { waitUntil: 'domcontentloaded'});

  const anchorSelector = await page.evaluate(() => [
    // carousel
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('.container.module.carousel-slider.responsive a:not(.carousel-control)')).map(a => a.href),
    // grid
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('a.product-name')).map(a => a.href),
  ]);

  await page.close();

  const productLinks: string[] = anchorSelector
    .filter(link => !!link.toString().match(/\/products/ig));

  return productLinks
}