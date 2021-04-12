
import crypto from 'crypto'
import cheerio from 'cheerio'
import { configureBrowser } from './configureBrowser'
import { ProductTypeUrl } from './config';
import { extractProductLinksFromPage } from './extractors/extractProductLinksFromPage';

const products = new Map();

const getHash = (text: string) => {
  const name = text.toLowerCase().replace(/ /ig, '');
  return crypto.createHash('md5').update(name).digest('hex');
}

const startTracking = async () => {
  const browser = await configureBrowser();

  const productLinks = new Set();

  [
    ...await extractProductLinksFromPage(ProductTypeUrl.MAQUIAGEM, browser),
    ...await extractProductLinksFromPage(ProductTypeUrl.CUIDADOS_PELE, browser),
    ...await extractProductLinksFromPage(ProductTypeUrl.CORPO_SOL, browser),
    ...await extractProductLinksFromPage(ProductTypeUrl.FRAGRANCIAS, browser),
  ].forEach(link => productLinks.add(link));

  console.log(productLinks.size)

  await browser.close();
}

startTracking();