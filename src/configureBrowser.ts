import puppeteer, { Browser } from 'puppeteer';
import { join } from 'path'

export async function configureBrowser(headless = true): Promise<Browser> {
  const browser = await puppeteer.launch({ 
    headless,
    ignoreDefaultArgs: ['--disable-extensions'],
    devtools: false,
    userDataDir: join(__dirname, '..', 'puppeteer'),
  });
  
  return browser
}
