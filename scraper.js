const fs = require('fs');
const { chromium } = require('playwright');

const TARGET_URL = 'https://example.com'; // Ziel-URL hier ändern

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

  await page.screenshot({ path: 'screenshot_fullpage.png', fullPage: true });

  const faviconUrl = await page.$eval("link[rel~='icon']", el => el.href).catch(() => null);
  if (faviconUrl) {
    const faviconRes = await page.request.get(faviconUrl);
    fs.writeFileSync('favicon.ico', await faviconRes.body());
  }

  const fonts = await page.evaluate(() => {
    const usedFonts = new Set();
    document.querySelectorAll('*').forEach(el => {
      const font = window.getComputedStyle(el).getPropertyValue('font-family');
      if (font) usedFonts.add(font);
    });
    return Array.from(usedFonts);
  });
  fs.writeFileSync('fonts.txt', fonts.join('\n'));

  const colors = await page.evaluate(() => {
    const colorMap = new Map();
    document.querySelectorAll('*').forEach(el => {
      const bg = window.getComputedStyle(el).getPropertyValue('background-color');
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        colorMap.set(bg, (colorMap.get(bg) || 0) + 1);
      }
    });
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  });
  fs.writeFileSync('colors.json', JSON.stringify(colors, null, 2));

  const logoElement = await page.$("img[alt*='logo'], img[src*='logo']");
  if (logoElement) {
    await logoElement.screenshot({ path: 'logo.png' });
  }

  await browser.close();
  console.log('✔️ Scraping abgeschlossen.');
})();
