import fs from 'fs/promises'

import { configureBrowser } from './configureBrowser'
import { ProductTypeUrl } from './config';
import { extractProductLinksFromPage } from './extractors/extractProductLinksFromPage';
import { extractProductDataFromPage } from './extractors/extractProductDataFromPage';

const products = new Map();

const startTracking = async () => {
  const browser = await configureBrowser();

  const productLinks = new Set([
    ...await extractProductLinksFromPage(ProductTypeUrl.MAQUIAGEM, browser),
    ...await extractProductLinksFromPage(ProductTypeUrl.CUIDADOS_PELE, browser),
    ...await extractProductLinksFromPage(ProductTypeUrl.CORPO_SOL, browser),
    ...await extractProductLinksFromPage(ProductTypeUrl.FRAGRANCIAS, browser),
    // ...await extractProductLinksFromPage(ProductTypeUrl.PRESENTES, browser),
  ]);

  console.log(productLinks)

  for await (const url of productLinks) {
    console.log(url);
    /**
     * Todo:
     * - buscar categoria
     * - baixar imagens localmente e alterar link pelo id da imagem
     * - reduce para agregar as variacoes em produtos
     * - fazer o unzip de products.json e das imagens e fazer o stream para a api
     * - fazer o upload das imagens para um bucket do s3 e inserir a url no lugar do id da imagem
     * - implementar tratamento de errors com notificacao de falhas
     * 
     */
    const productData = await extractProductDataFromPage(url, browser);
    products.set(productData.id, productData);
  }

  console.log(products.size)



  // fix: dont save file
  let data = JSON.stringify(products.values(), null, 2);
  await fs.writeFile('products.json', data);

// await extractProductDataFromPage("https://www.marykay.com.br/pt-br/products/makeup/face/blush-chromafusion-mary-kay-rouge-rose-99010454", browser)
  // await browser.close();
}

startTracking();