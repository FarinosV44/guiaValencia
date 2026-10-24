// Carga y normaliza datos compartidos entre idiomas. Un cambio de precio, horario o financiación
// en data/ se refleja en ES y EN porque ambas versiones leen el mismo objeto.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function mapsSearchUrl(place) {
  const city = place.city || 'Valencia';
  const parts = [place.name, place.address, city, 'España'].filter(Boolean);
  const params = new URLSearchParams({ api: '1', query: parts.join(', ') });
  return 'https://www.google.com/maps/search/?' + params.toString();
}

export function mapsWalkUrl(place) {
  if (!place.address) return null;
  const city = place.city || 'Valencia';
  const params = new URLSearchParams({ api: '1', destination: [place.name, place.address, city, 'España'].join(', '), travelmode: 'walking' });
  return 'https://www.google.com/maps/dir/?' + params.toString();
}

function domainOf(url) {
  try {
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname).replace(/\/$/, '');
    const short = path.length > 34 ? path.slice(0, 33) + '…' : path;
    return u.hostname.replace(/^www\./, '') + short;
  } catch {
    return url;
  }
}

export function buildEvidence(place) {
  const ev = [];
  for (const url of place.sources || []) {
    ev.push({ kind: 'documental', url, domain: domainOf(url), date: place.checked_on });
  }
  if (place.reviews_sample) {
    ev.push({ kind: 'opinion_usuario', count: place.reviews_sample, platform: 'Google', date: place.checked_on });
  }
  for (const a of place.evidence_awards || []) {
    ev.push({ kind: 'premio_externo', label: a.label, url: a.url, year: a.year, domain: domainOf(a.url) });
  }
  if (place.own_visit) ev.push({ kind: 'visita_propia', date: place.own_visit_date });
  return ev;
}

const DEFAULTS = {
  status: 'documental',
  publication_ready: false,
  own_visit: false,
  checked_on: '2026-10-24',
  kids: {},
  tags: [],
  cravings: [],
};

export function loadData() {
  const dir = join(DATA, 'places');
  const batches = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const places = [];
  for (const f of batches) {
    const batch = readJson(join(dir, f));
    for (const raw of batch.places) {
      const p = { ...DEFAULTS, ...raw, batch: f };
      p.kids = { ...(raw.kids || {}) };
      p.maps = { search: mapsSearchUrl(p), walk: mapsWalkUrl(p) };
      p.evidence = buildEvidence(p);
      places.push(p);
    }
  }
  const zones = readJson(join(DATA, 'zones.json')).zones;
  const routes = readJson(join(DATA, 'routes.json')).routes;
  const funding = readJson(join(DATA, 'funding.json'));
  const categories = readJson(join(DATA, 'categories.json')).categories;
  const byId = Object.fromEntries(places.map((p) => [p.id, p]));
  const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));
  return { places, byId, zones, zoneById, routes, funding, categories, root: ROOT };
}

// Validación estructural: falla el build si los datos rompen reglas editoriales comprobables.
export function validate(data) {
  const errors = [];
  const ids = new Set();
  for (const p of data.places) {
    if (ids.has(p.id)) errors.push(`ID duplicado: ${p.id}`);
    ids.add(p.id);
    if (!p.text?.es || !p.text?.en) errors.push(`${p.id}: falta texto ES o EN`);
    for (const lang of ['es', 'en']) {
      for (const k of ['offer', 'fits', 'not_for', 'order', 'may_disappoint', 'before']) {
        if (!p.text?.[lang]?.[k]) errors.push(`${p.id}: falta text.${lang}.${k}`);
      }
    }
    if (!(p.sources || []).length) errors.push(`${p.id}: sin fuentes`);
    if (p.zone && !data.zoneById[p.zone]) errors.push(`${p.id}: zona desconocida ${p.zone}`);
    if (p.zone && data.zoneById[p.zone] && data.zoneById[p.zone].scope !== p.scope) errors.push(`${p.id}: scope ${p.scope} no coincide con zona ${p.zone}`);
    if (p.own_visit && !p.own_visit_date) errors.push(`${p.id}: visita propia sin fecha ni registro`);
    if (p.publication_ready && p.status !== 'revisado' && p.status !== 'publicado') errors.push(`${p.id}: publication_ready sin revisión`);
    for (const l of p.price?.lines || []) {
      if (l.amount == null && !l.amount_range) errors.push(`${p.id}: línea de precio sin importe`);
    }
  }
  for (const r of data.routes) {
    const ref = r.places || r.stops?.filter((s) => s.kind === 'place').map((s) => s.place) || [];
    for (const id of ref) if (!data.byId[id]) errors.push(`Ruta ${r.id}: local inexistente ${id}`);
  }
  for (const c of data.categories) {
    for (const s of c.sections || []) for (const id of s.places || []) if (!data.byId[id]) errors.push(`Categoría ${c.id}: local inexistente ${id}`);
  }
  return errors;
}
