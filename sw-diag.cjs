const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)); });
  page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.goto('https://genuine-cheesecake-327d05.netlify.app/pack/amazing-animals', { waitUntil: 'load' });
  const info = await page.evaluate(async () => {
    const out = { supported: 'serviceWorker' in navigator };
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      out.registrations = regs.map(r => ({
        scope: r.scope,
        installing: !!r.installing, waiting: !!r.waiting, active: !!r.active,
        state: (r.active || r.waiting || r.installing || {}).state,
      }));
      out.controller = !!navigator.serviceWorker.controller;
    } catch (e) { out.err = String(e); }
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  await page.waitForTimeout(8000);
  const info2 = await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.map(r => ({ installing: !!r.installing, waiting: !!r.waiting, active: !!r.active, state: (r.active || r.waiting || r.installing || {}).state })).concat([{ controller: !!navigator.serviceWorker.controller }]);
  });
  console.log('after 8s:', JSON.stringify(info2));
  const reg = await page.evaluate(async () => {
    try {
      const r = await navigator.serviceWorker.register('/sw.js');
      await new Promise((res) => setTimeout(res, 5000));
      return { scope: r.scope, installing: !!r.installing, waiting: !!r.waiting, active: !!r.active };
    } catch (e) { return { error: String(e) }; }
  });
  console.log('manual register:', JSON.stringify(reg));
  await browser.close();
})();
