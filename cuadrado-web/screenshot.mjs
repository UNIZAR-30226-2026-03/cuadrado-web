// Script de utilidad para capturar screenshots de verificación visual
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5173/home';
const output = process.argv[3] || 'screenshot.png';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const width = parseInt(process.argv[4]) || 1920;
const height = parseInt(process.argv[5]) || 1080;
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
// Esperar a que las animaciones CSS se estabilicen
await new Promise(r => setTimeout(r, 2000));
await page.screenshot({ path: output, fullPage: false });
await browser.close();
console.log(`Screenshot saved: ${output}`);
