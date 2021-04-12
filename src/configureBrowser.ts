import puppeteer from 'puppeteer';

export async function configureBrowser(headless = true) {
  const browser = await puppeteer.launch({ headless });
  
  return browser
}
