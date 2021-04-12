
'use strict';

var crypto = require('crypto');
const cheerio = require('cheerio');
const configureBrowser = require('./configureBrowser')

const ProductTypeUrl = {
  CUIDADOS_PELE: 'https://www.marykay.com.br/pt-br/products/skincare?iad=ProductShopGrid1_CuidadosComAPele&pagesize=0',
  MAQUIAGEM: 'https://www.marykay.com.br/pt-br/products/makeup?iad=ProductShoppingGrid2Produtos_Maquiagem&pagesize=0',
  CORPO_SOL: 'https://www.marykay.com.br/pt-br/products/body-and-sun?iad=ProductShoppingGrid3Produtos_CorpoeSol&pagesize=0',
  FRAGRANCIAS: 'https://www.marykay.com.br/pt-br/products/fragrance?iad=productShoppingGrid4_Fragrancias&pagesize=0',
  HOMENS: 'https://www.marykay.com.br/pt-br/products/mens?iad=ProductShopGrid5_Homens&pagesize=0',
  // PRESENTES: 'https://www.marykay.com.br/pt-br/products/gifts?iad=ProductShopGrid6_Presentes&pagesize=0',
}

const products = new Map();

const getHash = text => {
  const name = text.toLowerCase().replace(/ /ig, '');
  return crypto.createHash('md5').update(name).digest('hex');
}

const extractProductLinksFromPage = async (pageUrl, page) => {
  await page.goto(pageUrl);

  const productLinks = await page.evaluate(() => {
    return [...document.querySelectorAll('a.product-name')].map(a => a.href);
  });

  return productLinks;
}

const startTracking = async () => {
  const browser = await configureBrowser();
  const page = await browser.newPage();

  const productLinks = new Set();

  [
    ...await extractProductLinksFromPage(ProductTypeUrl.MAQUIAGEM, page),
    ...await extractProductLinksFromPage(ProductTypeUrl.CUIDADOS_PELE, page),
    ...await extractProductLinksFromPage(ProductTypeUrl.CORPO_SOL, page),
    ...await extractProductLinksFromPage(ProductTypeUrl.FRAGRANCIAS, page),
  ].forEach(link => productLinks.add(link));

  console.log(productLinks.size)

  await browser.close();
}

startTracking();


 // const productId = $el.data('productid');
    // const productName = $link.text()

    // productLinks.set(productId, {
    //   sku: productId,
    //   title: productName,
    //   productHash: getHash(productName),
    //   url: $link.prop('href'),
    // });