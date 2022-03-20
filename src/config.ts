import 'dotenv/config';

export enum ProductTypeUrl {
  CUIDADOS_PELE = 'https://www.marykay.com.br/pt-br/products/skincare?iad=ProductShopGrid1_CuidadosComAPele&pagesize=0',
  // MAQUIAGEM = 'https://www.marykay.com.br/pt-br/products/makeup?iad=ProductShoppingGrid2Produtos_Maquiagem&pagesize=0',
  // CORPO_SOL = 'https://www.marykay.com.br/pt-br/products/body-and-sun?iad=ProductShoppingGrid3Produtos_CorpoeSol&pagesize=0',
  // FRAGRANCIAS = 'https://www.marykay.com.br/pt-br/products/fragrance?iad=productShoppingGrid4_Fragrancias&pagesize=0',
  // HOMENS = 'https://www.marykay.com.br/pt-br/products/mens?iad=ProductShopGrid5_Homens&pagesize=0',
  // PRESENTES = 'https://www.marykay.com.br/pt-br/products/gifts?iad=ProductShopGrid6_Presentes&pagesize=0',
}

export const BASE_TARGET_URL = "https://www.marykay.com.br"

export const AWS_CREDENTIALS = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  bucket: process.env.AWS_BUCKET_NAME as string,
  region: process.env.AWS_REGION as string
}

export const IMG_UPLOADER= {
  width: parseInt(process.env.IMG_WIDTH || '200', 10),
  height: parseInt(process.env.IMG_HEIGHT || '200', 10),
  quality: parseInt(process.env.IMG_QUALITY || '50', 10),
}

export const SHOULD_UPLOAD_S3 = process.env.IMG_UPLOAD_TO_S3 || false;