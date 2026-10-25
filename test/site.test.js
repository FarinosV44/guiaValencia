// Comprobaciones sobre el sitio generado: canonical, hreflang, noindex, sitemap, enlaces e idioma.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://donde-comer-valencia.example';
let pages;
const html = {};

function fileFor(path) {
  return path.endsWith('.html') ? join(DIST, path) : join(DIST, path, 'index.html');
}

before(() => {
  execFileSync('node', ['src/build.js'], { cwd: ROOT, env: { ...process.env, SITE_ORIGIN: ORIGIN } });
  pages = JSON.parse(readFileSync(join(DIST, 'pages.json'), 'utf8'));
  for (const p of pages) html[p.path] = readFileSync(fileFor(p.path), 'utf8');
});

const meta = (h, re) => (h.match(re) || [])[1];

test('cada página tiene lang, título, descripción y canonical a sí misma', () => {
  for (const p of pages) {
    const h = html[p.path];
    assert.match(h, new RegExp(`<html lang="${p.lang}">`), p.path);
    assert.ok(meta(h, /<title>([^<]+)<\/title>/), p.path);
    assert.ok(meta(h, /<meta name="description" content="([^"]+)"/), p.path);
    assert.equal(meta(h, /<link rel="canonical" href="([^"]+)"/), ORIGIN + p.path, p.path);
  }
});

test('borradores con noindex, sin hreflang y fuera del sitemap', () => {
  const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  for (const p of pages) {
    const h = html[p.path];
    const robots = meta(h, /<meta name="robots" content="([^"]+)"/);
    if (p.indexable) {
      assert.equal(robots, 'index,follow', p.path);
      assert.ok(sitemap.includes(`<loc>${ORIGIN}${p.path}</loc>`), p.path);
    } else {
      assert.equal(robots, 'noindex,follow', p.path);
      assert.ok(!h.includes('hreflang="es" href') && !h.includes('hreflang="en" href'), `hreflang en borrador ${p.path}`);
      assert.ok(!sitemap.includes(`<loc>${ORIGIN}${p.path}</loc>`), p.path);
    }
  }
});

test('hreflang recíproco entre versiones indexables equivalentes', () => {
  const idx = pages.filter((p) => p.indexable);
  assert.ok(idx.length >= 10);
  for (const p of idx) {
    const h = html[p.path];
    const es = meta(h, /hreflang="es" href="([^"]+)"/);
    const en = meta(h, /hreflang="en" href="([^"]+)"/);
    const self = ORIGIN + p.path;
    assert.ok(es === self || en === self, `se incluye a sí misma ${p.path}`);
    const otherPath = (es === self ? en : es).replace(ORIGIN, '');
    const other = pages.find((x) => x.path === otherPath);
    assert.ok(other && other.indexable, `alternativa indexable ${p.path}`);
    const oh = html[otherPath];
    assert.ok(oh.includes(`hreflang="${p.lang}" href="${self}"`), `recíproco ${p.path}`);
  }
});

test('mismo conjunto de páginas en ES y EN', () => {
  const count = (l) => pages.filter((p) => p.lang === l).length;
  assert.equal(count('es'), count('en'));
  for (const p of pages.filter((x) => x.alt)) assert.ok(pages.some((x) => x.path === p.alt), `${p.path} → ${p.alt}`);
});

test('todos los enlaces internos apuntan a archivos existentes', () => {
  const broken = [];
  for (const p of pages) {
    for (const [, href] of html[p.path].matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const f = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href);
      if (!existsSync(f)) broken.push(`${p.path} → ${href}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('las páginas inglesas no arrastran interfaz en español', () => {
  const spanishUi = ['Qué pedir', 'Para quién encaja', 'La cuenta, explicada', 'Suma parcial', 'Saltar al contenido', 'Estoy por aquí', 'Investigación documental', 'Consultado el', 'Horario documentado', 'Desconocido'];
  for (const p of pages.filter((x) => x.lang === 'en')) {
    const body = html[p.path].replace(/<script[\s\S]*?<\/script>/g, '').replace(/lang="es"[^>]*>[^<]*/g, '');
    for (const s of spanishUi) assert.ok(!body.includes(s), `${p.path} contiene «${s}»`);
  }
});

test('sin valoraciones inventadas ni marca descartada', () => {
  for (const p of pages) {
    const h = html[p.path];
    assert.ok(!/aggregateRating|ratingValue|"Review"/.test(h), p.path);
    assert.ok(!/Sin Humo/i.test(h), p.path);
  }
});

test('nunca se llama «total completo» a una suma con extras desconocidos', () => {
  for (const p of pages) assert.ok(!/Total completo|Full total/.test(html[p.path].replace(/<script[\s\S]*?<\/script>/g, '')), p.path);
});

test('cada ficha muestra Maps, fuente, fecha y tipo de evidencia', () => {
  for (const p of pages.filter((x) => x.key === 'place')) {
    const h = html[p.path];
    assert.ok(h.includes('https://www.google.com/maps/search/?api=1'), p.path);
    assert.ok(/24 (de octubre de|October) 2026/.test(h), p.path);
    assert.ok(/Investigación documental|Documentary research/.test(h), p.path);
  }
});

test('la declaración de independencia y el enlace de visitas están en portada', () => {
  assert.ok(html['/'].includes('Aquí no nos paga nadie.'));
  assert.ok(html['/'].includes('Páganos: iremos a tu sitio y quizá cambiemos de opinión si nos convences.'));
  assert.ok(html['/en/'].includes('No restaurant pays us at the moment.'));
  assert.ok(html['/en/'].includes('Fund a visit. We might change our minds'));
  assert.ok(!/stripe|paypal|checkout|redsys/i.test(html['/invitanos/']), 'sin pasarela de pago');
});

test('Fernandet se presenta como excursión fuera de la ciudad', () => {
  assert.match(html['/locales/fernandet/'], /badge--away">Excursión/);
  assert.match(html['/en/places/fernandet/'], /badge--away">Day trip/);
});

// Esto es una guía: lo que no sabemos no se dice, pero tampoco se deja como hueco.
test('ninguna página deja huecos de «no sabemos» (pendiente, sin confirmar, ¿?…)', () => {
  const gaps = /¿\?|\bpendientes?\b|sin confirmar|desconocid|sin dato|no verificad|sin verificar|por confirmar|por verificar|no sabemos|sin cata|sin reseñas|reseñas revisadas|no documentad|sin documentar|sin precio|not confirmed|unconfirmed|\bpending\b|unknown|no data|not verified|to be confirmed|we don’t know|not documented|no documented/i;
  const textOf = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
  for (const p of pages) {
    const m = textOf(html[p.path]).match(gaps);
    assert.ok(!m, `${p.path}: «${m && m[0]}»`);
  }
  // También los textos que el selector pinta en el navegador.
  const ui = readFileSync(join(DIST, 'assets/js/i18n.js'), 'utf8');
  for (const key of ['pendingTitle', 'pendingLead', 'continuationNone', 'kidsNoInfo']) {
    const line = ui.split('\n').filter((l) => l.includes(key + ':')).join(' ');
    assert.ok(!gaps.test(line), `${key}: ${line}`);
  }
});

// Proveedor de rutas o mapas caído: nada depende de un script externo; Maps es solo un enlace.
test('sin scripts de terceros: la guía funciona aunque falle cualquier proveedor externo', () => {
  for (const p of pages) {
    const ext = [...html[p.path].matchAll(/<script[^>]+src="(https?:)?\/\/[^"]+"/g)];
    assert.equal(ext.length, 0, `${p.path} carga scripts externos`);
  }
});
