const puppeteer = require('puppeteer');

async function configureBrowser(headless = true) {
  const browser = await puppeteer.launch({ headless });
  
  return browser
}

module.exports = configureBrowser;
