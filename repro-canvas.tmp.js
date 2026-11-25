const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(); // fresh, no auth, no SW
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 2000)); });
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message + '\n' + (e.stack||'').slice(0, 2000)));
  await page.goto('https://genuine-cheesecake-327d05.netlify.app/community', { waitUntil: 'networkidle', timeout: 45000 }).catch(e => errors.push('[nav] '+e.message));
  await page.waitForTimeout(2000);
  // click first "Color this"
  await page.click('text=Color this').catch(e => errors.push('[click] ' + e.message));
  await page.waitForTimeout(8000);
  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('--- URL ---\n' + url);
  console.log('--- BODY ---\n' + bodyText);
  console.log('--- ERRORS ---\n' + errors.join('\n---\n'));
  await browser.close();
})();
