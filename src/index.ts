import fs from 'fs/promises'
import fastJson from 'fast-json-stringify';
import path from 'path'

import { configureBrowser } from './configureBrowser'
import { ProductTypeUrl } from './config';
import { extractProductLinksFromPage } from './extractors/extractProductLinksFromPage';
import { extractProductDataFromPage } from './extractors/extractProductDataFromPage';
import { logger } from './utils/logger';
import { hashText } from './utils/hashText';
import { getUniqueProductUrlId } from './utils/getUniqueProductUrlId';
import { getFileName } from './utils/getFileName';

const products = new Map();

const startTracking = async () => {
  console.time('get_urls')
  let browser = await configureBrowser();
  let productLinks: Set<string> | null = new Set<string>();

  let pageLinkPromises: Promise<string[]>[] | null = Object.values(ProductTypeUrl)
    .map(url => extractProductLinksFromPage(url, browser));

  (await Promise.all(pageLinkPromises))
    .forEach(linkArr => {
      linkArr.forEach(link => productLinks?.add(link))
    });

  pageLinkPromises = null;

  logger.info(`Product URLs: ${productLinks.size}`)
  console.timeEnd('get_urls');

  const exploredUrlVariants = new Set<string>();

  console.time('extract_roducts')

  for await (const url of productLinks) {
    const urlId = getUniqueProductUrlId(url);

    if (exploredUrlVariants.has(urlId)) {
      logger.warn(`skip: (${urlId}) ${url}`);
      continue;
    }

    logger.info('-------------------------');

    /**
     * Todo:
     * - save on .json
     * - upload to backend
     * 
     * Next:
     * - tratar imagens, enviar para s3 e substituir url
     * - implementar tratamento de errors com notificação de falhas
     * - indexar dados com o algolia
     */
    const { product: productData, urls } = await extractProductDataFromPage(url, browser);

    products.set(productData.sku, productData);
    urls.map(u => exploredUrlVariants.add(u));

    logger.info(`Product: ${productData.title}; Variations: ${productData.variations.length} \n`)
  }
  console.timeEnd('extract_roducts')
  
  productLinks = null;
  await browser.close();

  console.time('SAVE_PRODUCTS');
  
  const filePath = path.join(__dirname, '..', 'output', getFileName('products'));

  logger.info(`Save ${products.size} products into: ${filePath}`);

  const jsonProducts = JSON.stringify({
    products: Array.from(products).map(p => p[1]),
  })

  await fs.writeFile(filePath, jsonProducts);
  console.timeEnd('SAVE_PRODUCTS')

  process.exit();
}

startTracking();