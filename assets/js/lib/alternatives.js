// Dos alternativas comparables por ficha (#9), con el motivo explícito de cada una.
// Comparables = antojo compartido (o espacio de juego declarado) y mismo ámbito; se prefiere la misma zona.
import { isEatingVenue } from './recommend.js';
import { summarize } from './price.js';

const GENERIC = new Set(['mediterranea']);

const SETTLED = new Set(['incluido', 'en_ejemplo', 'no_aplica']);
// Dos bases solo se comparan si cubren lo mismo: cada concepto resuelto o abierto en ambas.
function sameCoverage(a, b) {
  const sa = summarize(a.price).components;
  const sb = summarize(b.price).components;
  return sa.every((c, i) => SETTLED.has(c.status) === SETTLED.has(sb[i].status));
}

function keys(p) {
  const k = (p.cravings || []).filter((c) => !GENERIC.has(c));
  if (p.kids?.espacio_juego === 'declarado') k.push('juego');
  return k;
}

export function alternativesFor(place, places, n = 2) {
  if (!isEatingVenue(place)) return [];
  const mine = keys(place);
  const scored = [];
  for (const p of places) {
    if (p.id === place.id || !isEatingVenue(p) || p.scope !== place.scope) continue;
    const shared = keys(p).filter((c) => mine.includes(c));
    if (!shared.length) continue;
    const sameZone = !!place.zone && p.zone === place.zone;
    let score = shared.length * 2 + (sameZone ? 3 : 0);
    const a = place.price?.per_adult_base;
    const b = p.price?.per_adult_base;
    let price = 'desconocido';
    if (a != null && b != null && !sameCoverage(place, p)) price = 'no_comparable';
    else if (a != null && b != null) {
      price = b < a ? 'mas_barata' : b > a ? 'mas_cara' : 'igual';
      if (Math.abs(a - b) <= Math.max(10, a * 0.5)) score += 1;
    }
    scored.push({ place: p, shared, sameZone, price, base: b ?? null, score });
  }
  scored.sort((x, y) => y.score - x.score || x.place.name.localeCompare(y.place.name, 'es'));
  return scored.slice(0, n);
}
