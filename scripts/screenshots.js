// Capturas reales de dist/ en móvil y escritorio. Uso: npm run screenshots [-- carpeta]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { startServer } from './serve.js';

const outDir = process.argv[2] || 'screenshots';
mkdirSync(outDir, { recursive: true });
const PORT = 4174;
const base = `http://127.0.0.1:${PORT}`;

const shots = [
  ['portada-es', '/'],
  ['portada-en', '/en/'],
  ['resultados-es', '/estoy-por-aqui/?zona=cabanyal&dia=sat&hora=13:30&con=pareja&presupuesto=30'],
  ['resultados-en', '/en/im-around-here/?zona=cabanyal&dia=sat&hora=13:30&con=pareja&presupuesto=30'],
  ['ficha-es', '/locales/anyora/'],
  ['ficha-en', '/en/places/anyora/'],
  ['ruta-es', '/rutas/cabanyal-comida-paseo-helado/'],
  ['familias-es', '/comer-con-ninos-valencia/'],
  ['familias-en', '/en/eating-out-with-kids-valencia/'],
  ['arroces-es', '/mejores-arroces-valencia/'],
  ['invitanos-es', '/invitanos/'],
];
const viewports = { movil: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, escritorio: { width: 1366, height: 900 } };
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;

const server = await startServer(PORT);
const browser = await chromium.launch();
try {
  for (const [vpName, vp] of Object.entries(viewports)) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    for (const [name, path] of shots) {
      if (only && !only.includes(name)) continue;
      await page.goto(base + path, { waitUntil: 'networkidle' });
      if (name.startsWith('resultados')) await page.waitForSelector('.results h2');
      await page.screenshot({ path: `${outDir}/${name}-${vpName}.png`, fullPage: true });
    }
    if (errors.length) console.error(vpName, 'errores de consola:', errors);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log('capturas en', outDir);
