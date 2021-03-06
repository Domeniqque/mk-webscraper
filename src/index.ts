import fs from 'fs/promises'
import path from 'path'

import { configureBrowser } from './configureBrowser'
import { AWS_CREDENTIALS, SHOULD_UPLOAD_S3, ProductTypeUrl } from './config';
import { extractProductLinksFromPage } from './extractors/extractProductLinksFromPage';
import { extractProductDataFromPage, IProductData } from './extractors/extractProductDataFromPage';
import { logger } from './utils/logger';
import { getUniqueProductUrlId } from './utils/getUniqueProductUrlId';
import { getFileName } from './utils/getFileName';
import { hashText } from './utils/hashText';
import { fileUploader } from './utils/fileUploader';

const products = new Map<string, IProductData>();

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
  const categories = new Map<string, string>();

  console.time('extract_roducts')

  for await (const url of productLinks) {
    const urlId = getUniqueProductUrlId(url);

    if (exploredUrlVariants.has(urlId)) {
      logger.warn(`skip: (${urlId}) ${url}`);
      continue;
    }

    logger.info('-------------------------');

    /**
     * todo:
     * - tratar imagens
     * - implementar tratamento de errors e re-tentativas
     */
    const data = await extractProductDataFromPage(url, browser);

    if (!data) {
      logger.warn(`pagina invalido: ${url}`);
      continue;
    }

    const { product: productData, urls } = data;

    products.set(productData.unique, productData);
    urls.map(u => exploredUrlVariants.add(u));
    categories.set(hashText(productData.category), productData.category);
    logger.info(`Product: ${productData.title}; Variations: ${productData.variations.length} \n`)
  }
  console.timeEnd('extract_roducts')
  
  productLinks = null;
  await browser.close();

  console.time('SAVE_PRODUCTS');

  const fileName = getFileName('products')
  const filePath = path.join(__dirname, '..', 'output', fileName);

  logger.info(`Save ${products.size} products into: ${filePath}`);

  const jsonProducts = JSON.stringify({
    products: Array.from(products).map(p => p[1]),
    categories: Array.from(categories).map(c => ({ unique: c[0], name: c[1] })),
  })

  await fs.writeFile(filePath, jsonProducts);

  if (!!SHOULD_UPLOAD_S3) {
    console.log(AWS_CREDENTIALS)
    await fileUploader({ 
      fileJson: jsonProducts, 
      fileName 
    })
  }

  console.timeEnd('SAVE_PRODUCTS')

  process.exit();
}

startTracking();