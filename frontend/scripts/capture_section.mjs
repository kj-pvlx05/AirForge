import puppeteer from 'puppeteer-core';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1200 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/optimization', { waitUntil: 'networkidle0' });
  const el = await page.$('#situation-analysis-section');
  if (el) {
    await el.screenshot({ path: 'C:\\Users\\KRISHNAJITH\\.gemini\\antigravity-ide\\brain\\8907c16e-fca7-4631-ba7e-4387443d8b64\\phase8_weather_analysis_section.png' });
    console.log('Saved weather situation analysis section screenshot');
  }
  await browser.close();
}

capture();
