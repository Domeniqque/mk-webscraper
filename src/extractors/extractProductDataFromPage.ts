import { Browser } from "puppeteer";
import cheerio from "cheerio";
import { hashText } from "../utils/hashText";

export const extractProductDataFromPage = async (urlPage: string, browser: Browser) => {
  const page = await browser.newPage();
  await page.goto(urlPage);

  const productDetailsHtml = await page.evaluate(() => {
    return document.querySelector('.container.module.product.product-detail')?.innerHTML ?? ""
  });
  await page.close();

  const $ = cheerio.load(productDetailsHtml);
  const productId = $('input[type="hidden"]#PDP-ProductID').val();
  const price = $('input[type="hidden"]#PDP-ProductPrice').val();
  const imagesUrls: string[] = $('ul.thumbnails.thumbnails_hide a').map((_, link) => {
    const url: string = $(link).prop('href');
    return url.startsWith('https:') ? url : `https:${url}`.trim(); 
  }).get()

  const productName = $('.details h1').text()
  const $colorsVariants = $('ul.color-list a');

  const colors = $colorsVariants.map((_, el) => ({
      name: $(el).data('name'),
      value: $("span", el).first().css("background-color"),
  })).get();

  const variants = $colorsVariants.map((_, el) => {
    const links: string = $(el).prop("href");

    return links.split("-").pop();
  }).get();

  const productData = {
    id: hashText(productName),
    productName,
    sku: productId,
    price: Number(price),
    images: Array.from(new Set([...imagesUrls])),
    colors,
    variants: Array.from(new Set([...variants])),
    urlPage,
  }

  return productData;
}