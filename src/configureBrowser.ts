import puppeteer, { Browser } from 'puppeteer';

export async function configureBrowser(headless = true): Promise<Browser> {
  const browser = await puppeteer.launch({ 
    headless,
    ignoreDefaultArgs: ['--disable-extensions'],
    devtools: false,
  });
  
  return browser
}
