const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 140)}`); });
  page.on('requestfailed', r => bad.push(`FAILED ${r.url().slice(0, 140)} ${r.failure()?.errorText}`));
  page.on('console', m => console.log('[console]', m.type(), m.text().slice(0, 200)));
  page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 400)));
  await page.goto('https://genuine-cheesecake-327d05.netlify.app/pack/amazing-animals', { waitUntil: 'networkidle' });
  const info = await page.evaluate(async () => ({
    readyState: document.readyState,
    nextRuntime: typeof window.next !== 'undefined' ? window.next.version : null,
    regs: (await navigator.serviceWorker.getRegistrations()).length,
    scripts: performance.getEntriesByType('resource').filter(e => e.name.includes('/_next/static/chunks/')).length,
  }));
  console.log(JSON.stringify(info, null, 2));
  console.log('bad responses:', JSON.stringify(bad, null, 2));
  await browser.close();
})();
