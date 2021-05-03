import { Browser, Page } from "puppeteer";
import cheerio from "cheerio";
import { hashText } from "../utils/hashText";
import { BASE_TARGET_URL } from "../config";

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

const getContentPage = async (pageUrl: string, page: Page) => {
  console.log(pageUrl)
  await page.goto(pageUrl);

  const [summary, category, productDetailsHtml] = await page.evaluate(() => [
    document.querySelector<HTMLDivElement>('.description')?.innerText ?? "",
    document.querySelector<HTMLDivElement>('.breadcrumb a')?.innerText ?? "",
    document.querySelector('.container.module.product.product-detail')?.innerHTML ?? ""
  ]);

  const $ = cheerio.load(productDetailsHtml);

  return { $, category, summary };
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

export const extractProductDataFromPage = async (pageUrl: string, page: Page, exploredUrlVariants: Set<string>) => {
  if (exploredUrlVariants.has(pageUrl)) {
    return;
  }

  const { $, category, summary } = await getContentPage(pageUrl, page);

  const productId = $('input[type="hidden"]#PDP-ProductID').val()?.trim();
  const productName = $('.details h1').text()?.trim();
  const content = $('.tab.resp-tab-content.resp-tab-content-active p').text()?.trim();

  const $colorsVariants = $('ul.color-list a');
  const variantUrls = $colorsVariants.map((_, el) => `${BASE_TARGET_URL}${$(el).prop("href")}`).get() as string[];

  const variations: IVariationData[] = [];

  for (const [i, variationUrl] of variantUrls.entries()) {
    const { $: $variationContent} = i === 0 ? { $ } : await getContentPage(variationUrl, page);

    const variationData = getVariantData(variationUrl, $variationContent);

    variations.push(variationData);
    exploredUrlVariants.add(variationUrl);
  }

  const product: IProductData = {
    unique: hashText(productName),
    sku: productId,
    title: productName,
    summary,
    content,
    category,
    variations,
    pageUrl
  }

  exploredUrlVariants.add(pageUrl);
  
  console.log(JSON.stringify(product, null, 2))

  return product;
}