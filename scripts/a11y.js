// Accesibilidad básica y recorridos principales en navegador real (móvil y escritorio).
// axe-core (WCAG 2 A/AA), desbordamiento horizontal, teclado y JS de selector/ruta/invitación.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startServer } from './serve.js';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PORT = 4175;
const base = `http://127.0.0.1:${PORT}`;
const PAGES = [
  '/', '/en/', '/estoy-por-aqui/?zona=cabanyal&dia=sat&hora=13:30', '/en/im-around-here/?antojo=asiatico&presupuesto=30',
  '/locales/anyora/', '/en/places/la-salita/', '/locales/petit/', '/rutas/cabanyal-comida-paseo-helado/', '/en/routes/cabanyal-lunch-stroll-ice-cream/',
  '/comer-con-ninos-valencia/', '/mejores-buffets-sushi-valencia/', '/en/esmorzar-valencia/', '/restaurantes-playa-valencia/', '/invitanos/', '/como-nos-financiamos/', '/zonas/ruzafa/', '/en/korean-bbq-valencia/',
];
const VIEWPORTS = { movil: { width: 360, height: 780 }, escritorio: { width: 1366, height: 900 } };

const failures = [];
const server = await startServer(PORT);
const browser = await chromium.launch();
try {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage({ viewport });
    const jsErrors = [];
    page.on('pageerror', (e) => jsErrors.push(e.message));
    for (const path of PAGES) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      });
      for (const v of res) failures.push(`[${vpName}] ${path}: ${v.id} (${v.impact}) ${v.nodes.join(' | ')}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) failures.push(`[${vpName}] ${path}: desbordamiento horizontal ${overflow}px`);
    }

    // Teclado: el primer Tab llega al enlace «Saltar al contenido».
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => document.activeElement?.className);
    if (first !== 'skip') failures.push(`[${vpName}] el primer Tab no llega al enlace de salto (${first})`);

    // Recorrido: portada → zona → resultados → ficha.
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.selectOption('#home-zona', 'cabanyal');
    await Promise.all([page.waitForURL(/estoy-por-aqui\/\?zona=cabanyal/), page.click('.zoneform button')]);
    await page.waitForSelector('.pick h3 a');
    const picks = await page.$$eval('.pick', (els) => els.length);
    if (picks < 3) failures.push(`[${vpName}] Cabanyal sin tres opciones (${picks})`);
    await Promise.all([page.waitForURL(/\/locales\//), page.click('.pick h3 a')]);
    if (!(await page.isVisible('.receipt'))) failures.push(`[${vpName}] la ficha no muestra la cuenta`);

    // Cambio de idioma en el selector conserva filtros.
    await page.goto(base + '/estoy-por-aqui/?zona=ruzafa&presupuesto=40', { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/\/en\/im-around-here\/\?zona=ruzafa&presupuesto=40/), page.click('a.lang')]);
    await page.waitForSelector('.results h2');

    // Ruta: lunes → heladería cerrada; sábado con estimaciones → llegada calculada.
    await page.goto(base + '/rutas/cabanyal-comida-paseo-helado/', { waitUntil: 'networkidle' });
    await page.selectOption('#r-dia', 'mon');
    if (!(await page.textContent('#routeresult')).includes('heladería cierra ese día')) failures.push(`[${vpName}] ruta: lunes no avisa del cierre`);
    await page.selectOption('#r-dia', 'sat');
    await page.fill('#r-estancia', '90');
    await page.fill('#r-paseo', '15');
    if (!(await page.textContent('#routeresult')).includes('15:15')) failures.push(`[${vpName}] ruta: no calcula la llegada`);

    // Invitación: valida y no envía a ningún sitio.
    await page.goto(base + '/invitanos/', { waitUntil: 'networkidle' });
    await page.click('#inviteform button[type=submit]');
    if (!(await page.textContent('#err-venue'))) failures.push(`[${vpName}] invitación: no valida campos`);
    await page.fill('#i-venue', 'Bar de prueba, sucursal centro');
    await page.fill('#i-address', 'Calle Falsa 1');
    await page.fill('#i-contact', 'Persona de prueba');
    await page.fill('#i-email', 'prueba@example.com');
    await page.fill('#i-what', 'El arroz del jueves');
    await page.check('#i-ack');
    await page.click('#inviteform button[type=submit]');
    if (!(await page.isVisible('#proposal'))) failures.push(`[${vpName}] invitación: no prepara la propuesta`);

    if (jsErrors.length) failures.push(`[${vpName}] errores JS: ${jsErrors.join('; ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Accesibilidad y recorridos OK: ${PAGES.length} páginas × ${Object.keys(VIEWPORTS).length} tamaños.`);
