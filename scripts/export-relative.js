// Copia dist/ a otra carpeta con enlaces internos relativos y explícitos (…/index.html), para servir la guía
// desde una subcarpeta o un visor que no resuelve «/ruta/» a «/ruta/index.html».
// Uso: node scripts/export-relative.js <destino> [--home=home.html]
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';

const SRC = new URL('../dist/', import.meta.url).pathname;
const DEST = process.argv[2];
const HOME = (process.argv.find((a) => a.startsWith('--home=')) || '--home=index.html').split('=')[1];
if (!DEST) throw new Error('Falta destino');

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(relative(SRC, p)); } })(SRC);

const target = (abs) => {
  // «/» → home; «/x/» → x/index.html; «/x.ext» → x.ext
  const [path, rest = ''] = abs.split(/(?=[?#])/);
  let t = path === '/' ? HOME : path.replace(/^\//, '');
  if (t.endsWith('/')) t += 'index.html';
  return { t, rest: abs.slice(path.length) };
};
const rel = (fromFile, abs) => {
  const { t, rest } = target(abs);
  let r = posix.relative(posix.dirname(fromFile) || '.', t);
  if (!r) r = posix.basename(t);
  return r + rest;
};
const mapPath = (f) => (f === 'index.html' ? HOME : f);

for (const f of files) {
  const out = join(DEST, mapPath(f));
  mkdirSync(dirname(out), { recursive: true });
  if (!f.endsWith('.html')) { copyFileSync(join(SRC, f), out); continue; }
  const me = mapPath(f);
  let s = readFileSync(join(SRC, f), 'utf8');
  s = s.replace(/\b(href|src|action)="(\/(?!\/)[^"]*)"/g, (_, a, v) => `${a}="${rel(me, v)}"`);
  s = s.replace(/\bsrcset="([^"]*)"/g, (_, v) => `srcset="${v.replace(/(^|,\s*)(\/(?!\/)[^\s,]+)/g, (m, sep, u) => sep + rel(me, u))}"`);
  s = s.replace(/"(url|path)":"(\/(?!\/)[^"]*)"/g, (_, k, v) => `"${k}":"${rel(me, v)}"`);
  s = s.replace(/import\("\/assets\//g, `import("${posix.relative(posix.dirname(me), 'assets')}/`);
  writeFileSync(out, s);
}
console.log(`Exportado a ${DEST} (${files.length} archivos, portada: ${HOME})`);
