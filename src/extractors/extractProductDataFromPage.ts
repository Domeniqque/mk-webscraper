import { Browser, Page } from "puppeteer";
import cheerio from "cheerio";

import { hashText } from "../utils/hashText";
import { BASE_TARGET_URL } from "../config";
import { logger } from "../utils/logger";
import { getUniqueProductUrlId } from "../utils/getUniqueProductUrlId";
import { imageUploader } from "../utils/imageUploader";

export interface IVariationData {
  size: string;
  sku: string;
  price: number;
  pageUrl: string;
  images: string[];
  color: {
    name: string;
    value: string;
  };
}

export interface IProductData {
  unique: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  variations: IVariationData[];
}

const getContentPage = async (pageUrl: string, browser: Browser) => {
  let attempts = 0;
  let page: Page = await browser.newPage();
  
  try {
    attempts += 1;
    
    if (!page || page.isClosed()) {
      page = await browser.newPage();
    }

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setRequestInterception(true);
    
    page.on('request', (req) => {
      if(['stylesheet', 'font', 'image'].includes(req.resourceType())){
        req.abort();
      } else {
        req.continue();
      }
    });

    logger.info(`getContentPage: ${pageUrl}`);

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    const [summary, category, productDetailsHtml] = await page.evaluate(() => [
      document.querySelector<HTMLDivElement>('.description')?.innerText ?? "",
      document.querySelector<HTMLDivElement>('.breadcrumb a')?.innerText ?? "",
      document.querySelector('.container.module.product.product-detail')?.innerHTML ?? ""
    ]);

    const $ = cheerio.load(productDetailsHtml);

    return { $, category, summary };
  } catch (err) {
    logger.error(err, `getContentPage: ${pageUrl}`);
    
    if (attempts > 3) {
      throw err;
    }
  } finally {
    await page.close();
  }
}

const getVariantData = async (pageUrl: string, $: cheerio.Root) => {
  const $color = $('ul.color-list a').first();

  const color = {
    name: $color.data('name')?.trim(),
    value: $color.find('span').css("background-color"),
  }

  const price = $('input[type="hidden"]#PDP-ProductPrice').val();
  const productId = $('input[type="hidden"]#PDP-ProductID').val()?.trim();
  
  const imagesUrlsOrigin: string[] = $('ul.thumbnails.thumbnails_hide a')
    .map((_, link) => {
      const url: string = $(link).prop('href');
      return url.startsWith('https:') ? url : `https:${url}`; 
    })
    .get()
    .filter(Boolean)

  const imagesPromise = imagesUrlsOrigin.map((imgUrl) => imageUploader(imgUrl));

  const imageUrls = await Promise.all(imagesPromise);

  const size = $('.included-sizes').text()?.trim().replace(/\s/ig, '');
  const controlRange = $('.controlcontainer.cf a').first().text()?.trim();

  const variation: IVariationData = {
    size: controlRange.length > 0 ? `${size}, ${controlRange}` : size,
    sku: productId, //pageUrl.split('-').pop()?.trim() as string,
    price: Number(price?.trim()),
    images: Array.from(new Set([...imageUrls])),
    color,
    pageUrl,
  }

  return variation;
}

export const extractProductDataFromPage = async (pageUrl: string, browser: Browser) => {
  const contentPage = await getContentPage(pageUrl, browser);

  if (!contentPage) {
    throw new Error(`getContentPage: ${pageUrl}. Conteúdo invalido ou nao encontrado`)
  }

  const { $, category, summary } = contentPage;
  
  const productName = $('.details h1').text()?.trim();

  if (!productName) return;

  const content = $('.tab.resp-tab-content.resp-tab-content-active p').text()?.trim();

  const rangeVariants = $('.controlcontainer.cf a').map((_, el) => `${BASE_TARGET_URL}${$(el).prop("href")}`).get() as string[]
  const colorVariantsUrls = $('ul.color-list a').map((_, el) => `${BASE_TARGET_URL}${$(el).prop("href")}`).get() as string[];

  const variantUrls = [...colorVariantsUrls, ...rangeVariants].filter(Boolean);

  const variations: IVariationData[] = []

  if (variantUrls.length === 0) {
    variations.push(await getVariantData(pageUrl, $));
  } else {
    for (const variationUrl of variantUrls) {
      const $variationContent = (await getContentPage(variationUrl, browser))?.$;
      
      if (!$variationContent) {
        throw new Error(`getContentPage: variationUrl: ${variationUrl}: Conteúdo do produto variante invalido ou nao encontrado`)
      }
      
      variations.push(await getVariantData(variationUrl, $variationContent));
    }
  }

  const product: IProductData = {
    unique: hashText(productName),
    title: productName,
    summary,
    content,
    category,
    variations,
  }

  return { 
    product, 
    urls: [getUniqueProductUrlId(pageUrl), ...variantUrls.map(v => getUniqueProductUrlId(v))]
  };
}