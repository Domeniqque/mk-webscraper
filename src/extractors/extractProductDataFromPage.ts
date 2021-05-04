import { Browser, Page } from "puppeteer";
import cheerio from "cheerio";
import { hashText } from "../utils/hashText";
import { BASE_TARGET_URL } from "../config";
import { logger } from "../utils/logger";
import { getUniqueProductUrlId } from "../utils/getUniqueProductUrlId";

interface IVariationData {
  size: string;
  sku: string;
  price: number;
  color: {
    name: string;
    value: string;
  };
  images: string[];
}

interface IProductData {
  unique: string;
  sku: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  variations: IVariationData[];
  pageUrl: string;
}

const getContentPage = async (pageUrl: string, browser: Browser) => {
  let attempts = 0;
  let page: Page = await browser.newPage();
  
  try {
    attempts += 1;
    
    if (!page || page.isClosed()) {
      page = await browser.newPage();
    }

    logger.info(`getContentPage: ${pageUrl}`);

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    const [summary, category, productDetailsHtml] = await page.evaluate(() => [
      document.querySelector<HTMLDivElement>('.description')?.innerText ?? "",
      document.querySelector<HTMLDivElement>('.breadcrumb a')?.innerText ?? "",
      document.querySelector('.container.module.product.product-detail')?.innerHTML ?? ""
    ]);

    const $ = cheerio.load(productDetailsHtml);

    await page.close();

    return { $, category, summary };
  } catch (err) {
    logger.error(err, `getContentPage: ${pageUrl}`);
    await page.close();

    if (attempts > 3) {
      throw err;
    }
  }
}

const getVariantData = (pageUrl: string, $: cheerio.Root) => {
  const $color = $('ul.color-list a').first();

  const color = {
    name: $color.data('name')?.trim(),
    value: $color.find('span').css("background-color"),
  }

  const price = $('input[type="hidden"]#PDP-ProductPrice').val();
  
  const imagesUrls: string[] = $('ul.thumbnails.thumbnails_hide a').map((_, link) => {
    const url: string = $(link).prop('href');
    return url.startsWith('https:') ? url?.trim() : `https:${url}`?.trim(); 
  }).get()

  const variation: IVariationData = {
    size: $('.included-sizes').text()?.trim(),
    sku: pageUrl.split('-').pop()?.trim() as string,
    price: Number(price?.trim()),
    color,
    images: Array.from(new Set([...imagesUrls])),
  }

  return variation;
}

export const extractProductDataFromPage = async (pageUrl: string, browser: Browser) => {
  const contentPage = await getContentPage(pageUrl, browser);

  if (!contentPage) {
    throw new Error(`getContentPage: ${pageUrl}. Conteúdo invalido ou nao encontrado`)
  }

  const { $, category, summary } = contentPage;

  const productId = $('input[type="hidden"]#PDP-ProductID').val()?.trim();
  const productName = $('.details h1').text()?.trim();
  const content = $('.tab.resp-tab-content.resp-tab-content-active p').text()?.trim();

  const $colorsVariants = $('ul.color-list a');
  const variantUrls = $colorsVariants.map((_, el) => `${BASE_TARGET_URL}${$(el).prop("href")}`).get() as string[];

  const variations: IVariationData[] = []
  
  for (const { variationUrl, i} of variantUrls.map((variationUrl, i) => ({ variationUrl, i }))) {
    const isFirst = i === 0;
    const $variationContent = isFirst ? $ : (await getContentPage(variationUrl, browser))?.$;

    if (!$variationContent) {
      throw new Error(`getContentPage: variationUrl: ${variationUrl}: Conteúdo do produto variante invalido ou nao encontrado`)
    }

    const variationData = getVariantData(variationUrl, $variationContent);
    variations.push(variationData);
  }

  const product: IProductData = {
    unique: hashText(productName),
    sku: productId as string,
    title: productName,
    summary,
    content,
    category,
    variations,
    pageUrl
  }

  return { 
    product, 
    urls: [getUniqueProductUrlId(pageUrl), ...variantUrls.map(v => getUniqueProductUrlId(v))]
  };
}