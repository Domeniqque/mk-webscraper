import fs from 'fs/promises'

import { configureBrowser } from './configureBrowser'
import { ProductTypeUrl } from './config';
import { extractProductLinksFromPage } from './extractors/extractProductLinksFromPage';
import { extractProductDataFromPage } from './extractors/extractProductDataFromPage';

const products = new Map();

const startTracking = async () => {
  const browser = await configureBrowser();
  const page = await browser.newPage();

  // const productLinks = new Set([
  //   ...await extractProductLinksFromPage(ProductTypeUrl.MAQUIAGEM, page),
  //   ...await extractProductLinksFromPage(ProductTypeUrl.CUIDADOS_PELE, page),
  //   ...await extractProductLinksFromPage(ProductTypeUrl.CORPO_SOL, page),
  //   ...await extractProductLinksFromPage(ProductTypeUrl.FRAGRANCIAS, page),
  //   // ...await extractProductLinksFromPage(ProductTypeUrl.PRESENTES, page),
  // ]);

  const exploredUrlVariants = new Set<string>();

  // for await (const url of productLinks) {
  //   console.log(url);
  //   /**
  //    * Todo:
  //    * - buscar categoria
  //    * - obter todas as imagens
  //    * - baixar imagens localmente e alterar link pelo id da imagem
  //    * - reduce para agregar as variações em produtos
  //    * - fazer o unzip de products.json e das imagens e fazer o stream para a api
  //    * - fazer o upload das imagens para um bucket do s3 e inserir a url no lugar do id da imagem
  //    * - implementar tratamento de errors com notificacao de falhas
  //    * 
  //    */
  //   const productData = await extractProductDataFromPage(url, page);
  //   products.set(productData.sku, productData);

  //   console.log(productData)
  // }

  // console.log(products.size)

  // fix: dont save file
  // let data = JSON.stringify(products.values(), null, 2);
  // await fs.writeFile('products.json', data);

  await extractProductDataFromPage("https://www.marykay.com.br/pt-br/products/makeup/face/blush-chromafusion-mary-kay-rouge-rose-99010454", page, exploredUrlVariants)
  await browser.close();
}

startTracking();