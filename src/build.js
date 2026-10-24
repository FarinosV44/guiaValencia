// Generador estático: node src/build.js → dist/. Sin dependencias de ejecución.
// No publica ni despliega nada: solo escribe archivos locales.
import { mkdirSync, writeFileSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadData, validate } from './data.js';
import { allPages } from './render/pages.js';
import { layout, abs } from './render/layout.js';

const data = loadData();
const errors = validate(data);
if (errors.length) {
  console.error('Datos no válidos:\n' + errors.map((x) => ' - ' + x).join('\n'));
  process.exit(1);
}

// Sin dominio decidido (#2): dominio reservado .example como marcador. Definir SITE_ORIGIN al publicar.
const origin = process.env.SITE_ORIGIN || 'https://donde-comer-valencia.example';
const DIST = join(data.root, 'dist');
const ctx = { data, origin };

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const pages = allPages(ctx);
const seen = new Set();
for (const page of pages) {
  if (seen.has(page.path)) throw new Error('Ruta duplicada: ' + page.path);
  seen.add(page.path);
  const file = page.path.endsWith('.html') ? join(DIST, page.path) : join(DIST, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, layout(page, ctx));
}

// Recursos: CSS, JS de cliente (comparte lib/ e i18n con el build) e imágenes.
cpSync(join(data.root, 'src/assets'), join(DIST, 'assets'), { recursive: true });
mkdirSync(join(DIST, 'assets/js/lib'), { recursive: true });
for (const f of readdirSync(join(data.root, 'src/lib'))) cpSync(join(data.root, 'src/lib', f), join(DIST, 'assets/js/lib', f));
cpSync(join(data.root, 'src/i18n.js'), join(DIST, 'assets/js/i18n.js'));

// Sitemap solo con URLs indexables y alternativas recíprocas entre versiones indexables.
const indexable = pages.filter((p) => p.indexable);
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...indexable.map((p) => {
    const alts = p.alt && p.altIndexable
      ? [p.lang === 'es' ? [p.path, p.alt] : [p.alt, p.path]].map(([es, en]) => `<xhtml:link rel="alternate" hreflang="es" href="${abs(origin, es)}"/><xhtml:link rel="alternate" hreflang="en" href="${abs(origin, en)}"/>`).join('')
      : '';
    return `<url><loc>${abs(origin, p.path)}</loc>${alts}</url>`;
  }),
  '</urlset>',
].join('\n');
writeFileSync(join(DIST, 'sitemap.xml'), xml + '\n');
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs(origin, '/sitemap.xml')}\n`);

const manifest = pages.map((p) => ({ path: p.path, lang: p.lang, key: p.key, indexable: p.indexable, alt: p.alt }));
writeFileSync(join(DIST, 'pages.json'), JSON.stringify(manifest, null, 1));

console.log(`Build OK: ${pages.length} páginas (${indexable.length} indexables), ${data.places.length} locales.`);
