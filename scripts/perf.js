// Rendimiento en móvil emulado (#25): LCP y CLS con red 4G lenta y CPU ×4, más la latencia de la interacción
// principal (pulsar «Recomendar»). Escribe docs/rendimiento.md. Objetivos: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { startServer } from './serve.js';

const PORT = 4176;
const base = `http://127.0.0.1:${PORT}`;
const PAGES = ['/', '/estoy-por-aqui/', '/locales/anyora/', '/mejores-arroces-valencia/', '/en/places/la-salita/', '/rutas/cabanyal-comida-paseo-helado/'];
const server = await startServer(PORT);
const browser = await chromium.launch();
const rows = [];
try {
  for (const path of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const loadCls = await page.evaluate(() => window.__cls);
    let inp = null;
    if (path === '/estoy-por-aqui/') {
      inp = await page.evaluate(async () => {
        const btn = document.querySelector('#selector button[type=submit]');
        const t0 = performance.now();
        btn.click();
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
        return Math.round(performance.now() - t0);
      });
    }
    const m = await page.evaluate((c) => ({ lcp: Math.round(window.__lcp), cls: Number(c.toFixed(3)), bytes: performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0) + (performance.getEntriesByType('navigation')[0]?.transferSize || 0) }), loadCls);
    rows.push({ path, ...m, inp });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
const ok = (r) => r.lcp <= 2500 && r.cls <= 0.1 && (r.inp == null || r.inp <= 200);
const md = [
  '# Rendimiento (móvil emulado)',
  '',
  `Generado con \`npm run perf\`: 360×780, red 4G lenta (150 ms, 1,6 Mbit/s) y CPU ×4. Servidor local, sin CDN: en producción con caché y compresión será igual o mejor. Interacción medida: pulsar «Recomendar» en el selector.`,
  '',
  '| Página | LCP | CLS | Interacción | Peso transferido | Objetivo |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.path} | ${r.lcp} ms | ${r.cls} | ${r.inp == null ? '—' : r.inp + ' ms'} | ${Math.round(r.bytes / 1024)} KB | ${ok(r) ? 'cumple' : 'NO cumple'} |`),
  '',
].join('\n');
writeFileSync(new URL('../docs/rendimiento.md', import.meta.url), md);
console.log(md);
if (!rows.every(ok)) process.exitCode = 1;
