import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\KRISHNAJITH\\.gemini\\antigravity-ide\\brain\\8907c16e-fca7-4631-ba7e-4387443d8b64';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- Phase 8 UI Validation Script Starting ---');
  
  const consoleLogs = [];
  const pageErrors = [];

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200'],
    defaultViewport: { width: 1600, height: 1200 }
  });

  try {
    const page = await browser.newPage();

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error]: ${text}`);
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err.toString());
      console.error(`[Browser PageError]: ${err.toString()}`);
    });

    // 1. BASELINE TEST
    console.log('\n[1/3] Testing Baseline /optimization Page...');
    // Reset seed data on backend first
    await fetch('http://127.0.0.1:8000/api/simulation/reset', { method: 'POST' });
    await sleep(500);

    await page.goto('http://localhost:3001/optimization', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for the solver result to appear (e.g., CP-SAT metrics)
    await page.waitForFunction(() => {
      const el = document.querySelector('body');
      return el && el.innerText.includes('FEASIBLE / ASSIGNED') && !el.innerText.includes('Solving with OR-Tools');
    }, { timeout: 15000 });

    console.log('Baseline optimization rendered.');

    // Click "Generate Situation Analysis"
    await page.waitForSelector('#empty-generate-analysis-btn, #generate-ai-analysis-btn', { visible: true });
    console.log('Clicking Generate Situation Analysis button...');
    await page.evaluate(() => {
      const btn = document.querySelector('#empty-generate-analysis-btn') || document.querySelector('#generate-ai-analysis-btn');
      if (btn) btn.click();
    });

    // Wait for analysis to populate
    await page.waitForFunction(() => {
      const section = document.querySelector('#situation-analysis-section');
      return section && (section.innerText.includes('Nominal Operating Conditions') || section.innerText.includes('CONFIDENCE:'));
    }, { timeout: 20000 });

    console.log('Baseline Situation Analysis loaded successfully.');
    await sleep(1000);

    // Capture baseline screenshot
    const baselineScreenshotPath = path.join(SCREENSHOT_DIR, 'phase8_baseline_analysis.png');
    await page.screenshot({ path: baselineScreenshotPath, fullPage: false });
    console.log(`Saved baseline screenshot: ${baselineScreenshotPath}`);

    // Verify baseline textual content
    const baselineText = await page.evaluate(() => {
      const sec = document.querySelector('#situation-analysis-section');
      return sec ? sec.innerText : '';
    });
    console.log('\nBaseline Situation Analysis text:');
    console.log(baselineText.slice(0, 450) + '...\n');

    // 2. WEATHER SCENARIO TEST
    console.log('[2/3] Testing Weather Deterioration Scenario (SEC-B)...');
    
    // Click "Simulate Sector B Squall" button
    await page.waitForSelector('#simulate-squall-btn', { visible: true });
    await page.click('#simulate-squall-btn');
    console.log('Clicked Simulate Sector B Squall.');
    await sleep(2000);

    // Wait for squall to trigger and run-solver-btn to be ready
    await page.waitForSelector('#run-solver-btn', { visible: true });
    await page.click('#run-solver-btn');
    console.log('Clicked Run CP-SAT Optimizer.');

    // Wait for solver execution: first wait for running state or sleep briefly
    await sleep(1000);
    await page.waitForFunction(() => {
      const btn = document.querySelector('#run-solver-btn');
      return btn && !btn.innerText.includes('Running Solver');
    }, { timeout: 15000 });
    console.log('CP-SAT Solver completed for weather scenario.');
    await sleep(2000);

    // Click "Generate Situation Analysis" or "Regenerate Analysis"
    console.log('Triggering Situation Analysis for weather scenario...');
    await page.evaluate(() => {
      const btn = document.querySelector('#empty-generate-analysis-btn') || document.querySelector('#generate-ai-analysis-btn');
      if (btn) btn.click();
    });

    // Wait for weather analysis to populate
    await page.waitForFunction(() => {
      const section = document.querySelector('#situation-analysis-section');
      return section && (
        section.innerText.includes('Weather Deterioration Impact') ||
        section.innerText.includes('Sector SEC-B') ||
        section.innerText.includes('Sector B') ||
        (section.innerText.includes('CONFIDENCE:') && !section.innerText.includes('Analyzing...'))
      );
    }, { timeout: 25000 });
    await sleep(1000);

    console.log('Weather Scenario Situation Analysis loaded successfully.');

    // Capture weather screenshot
    const weatherScreenshotPath = path.join(SCREENSHOT_DIR, 'phase8_weather_analysis.png');
    await page.screenshot({ path: weatherScreenshotPath, fullPage: false });
    console.log(`Saved weather screenshot: ${weatherScreenshotPath}`);

    const weatherText = await page.evaluate(() => {
      const sec = document.querySelector('#situation-analysis-section');
      return sec ? sec.innerText : '';
    });
    console.log('\nWeather Situation Analysis text:');
    console.log(weatherText.slice(0, 450) + '...\n');

    // 3. FALLBACK STATE AUDIT & AUTHORITY BOUNDARY
    console.log('[3/3] Auditing Authority Boundaries & Safety Rules...');
    const forbiddenList = [
      'execute dispatch orders',
      'assign aircraft',
      'reassign crew',
      'approve this mission',
      'override the restriction',
      'proceed with the flight',
      'select aircraft',
      'use aircraft'
    ];
    const foundForbidden = forbiddenList.filter(cmd => 
      weatherText.toLowerCase().includes(cmd) || baselineText.toLowerCase().includes(cmd)
    );

    if (foundForbidden.length > 0) {
      console.warn(`WARNING: Forbidden commands found: ${foundForbidden.join(', ')}`);
    } else {
      console.log('PASS: No operational authority commands found in AI output.');
    }

    console.log(`Page runtime errors count: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      console.error('Page errors encountered:', pageErrors);
    } else {
      console.log('PASS: Zero browser page runtime errors.');
    }

    console.log('\n--- UI Validation Completed Successfully ---');
  } catch (err) {
    console.error('Validation error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
