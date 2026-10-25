// Cola de revisión de datos (#28): qué falta para poder publicar cada ficha y qué dato ha caducado.
// Detecta; no corrige ni publica nada. Uso: npm run revision  (REVIEW_DATE=AAAA-MM-DD para simular otra fecha)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadData } from '../src/data.js';
import { summarize } from '../src/lib/price.js';

const LABEL = { bebida: 'bebida', pan: 'pan', postre: 'postre', cafe: 'café', suplementos: 'suplementos' };

export const MAX_AGE_DAYS = { precio: 30, infantil: 60, horario: 30 };

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export function reviewQueue(data, today) {
  const usage = {};
  const bump = (id, why) => ((usage[id] ||= new Set()).add(why));
  for (const r of data.routes) for (const id of r.places || r.stops.filter((s) => s.kind === 'place').map((s) => s.place)) bump(id, `ruta ${r.id}`);
  for (const c of data.categories) for (const s of c.sections || []) for (const id of s.places || []) bump(id, `categoría ${c.id}`);

  return data.places
    .map((p) => {
      const items = [];
      const age = daysBetween(p.checked_on, today);
      const h = p.hours || { status: 'desconocido' };
      if (h.status === 'desconocido') items.push(['horario', 'Horario sin confirmar']);
      else if (h.status === 'contradictorio') items.push(['horario', 'Horario contradictorio entre fuentes']);
      else if (h.status === 'parcial') items.push(['horario', 'Horario parcial (faltan horas o días)']);
      if (h.status !== 'desconocido' && !h.holidays) items.push(['festivos', 'Apertura en festivos sin dato']);

      const s = summarize(p.price);
      if (s.base == null && s.exampleTotal == null) items.push(['precio', 'Sin precio verificable']);
      if (!s.baseConfirmed) items.push(['precio', 'Precio publicado por terceros: ratificar con el local']);
      if (s.openComponents.length) items.push(['precio', `Falta saber: ${s.openComponents.map((k) => LABEL[k]).join(', ')}`]);
      if (s.compulsoryUnknown.length) items.push(['precio', `Consumo obligatorio sin importe: ${s.compulsoryUnknown.map((k) => LABEL[k]).join(', ')}`]);
      if (p.price?.kids_cost && /contradict|cifras distintas/i.test(p.price.kids_cost.es)) items.push(['infantil', 'Coste infantil contradictorio']);

      const familyRelevant = (p.tags || []).some((t) => t === 'familia_bebe' || t === 'nino_activo') || p.kids?.espacio_juego;
      if (familyRelevant) {
        for (const k of ['juego_sin_pantallas', 'politica_sin_pantallas', 'sin_tv', 'carrito', 'trona']) {
          if (!p.kids?.[k] || p.kids[k] === 'desconocido') items.push(['infantil', `Infantil: ${k} desconocido`]);
          if (p.kids?.[k] === 'terceros') items.push(['infantil', `Infantil: ${k} solo por fuente externa`]);
        }
      }
      if (!p.address) items.push(['ficha', 'Sucursal o dirección sin identificar']);
      if (p.candidate_only) items.push(['ficha', 'Candidato: falta decidir si se recomienda']);
      if (!p.reviews) items.push(['ficha', 'Sin lectura de reseñas']);
      for (const l of p.labelsAll || []) {
        const left = daysBetween(today, l.expires);
        if (left < 0) items.push(['etiqueta', `Etiqueta «${l.label}» caducada el ${l.expires}: revisar o retirar`]);
        else if (left <= 7) items.push(['etiqueta', `Etiqueta «${l.label}» caduca el ${l.expires}`]);
      }
      if (!p.own_visit) items.push(['ficha', 'Sin visita propia']);

      const stale = [];
      if (s.base != null && age > MAX_AGE_DAYS.precio) stale.push(`precio (${age} d > ${MAX_AGE_DAYS.precio})`);
      if (familyRelevant && age > MAX_AGE_DAYS.infantil) stale.push(`servicios infantiles (${age} d > ${MAX_AGE_DAYS.infantil})`);
      if (h.status === 'documentado' && age > MAX_AGE_DAYS.horario) stale.push(`horario (${age} d > ${MAX_AGE_DAYS.horario})`);

      const used = [...(usage[p.id] || [])];
      const blocking = items.filter(([k]) => k === 'horario' || k === 'precio').length;
      return { id: p.id, name: p.name, checked_on: p.checked_on, age, items, stale, used, priority: used.length * 10 + blocking };
    })
    .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name, 'es'));
}

export function toMarkdown(queue, today) {
  const out = [
    '# Cola de revisión de datos',
    '',
    `Generada el ${today} con \`npm run revision\`. Detecta qué falta para publicar cada ficha y qué dato ha caducado (precios ${MAX_AGE_DAYS.precio} días, horarios ${MAX_AGE_DAYS.horario}, servicios infantiles ${MAX_AGE_DAYS.infantil}). No corrige ni publica nada: al confirmar un dato, actualízalo en \`data/places/\` con fuente y fecha.`,
    '',
    'Orden: primero los locales usados en rutas y categorías, y dentro de ellos los que tienen más pendientes de horario y precio.',
    '',
    `Resumen: ${queue.length} fichas, ${queue.filter((q) => q.stale.length).length} con datos caducados, ${queue.filter((q) => q.items.some(([k]) => k === 'horario')).length} con horario sin confirmar, parcial o contradictorio, ${queue.filter((q) => q.items.some(([k, t]) => k === 'precio' && t === 'Sin precio verificable')).length} sin precio verificable.`,
    '',
  ];
  for (const q of queue) {
    out.push(`## ${q.name} (\`${q.id}\`)`, '');
    out.push(`Consultado: ${q.checked_on} (${q.age} d).${q.used.length ? ` Aparece en: ${q.used.join(', ')}.` : ''}`, '');
    if (q.stale.length) out.push(`**Caducado:** ${q.stale.join('; ')}.`, '');
    for (const [, text] of q.items) out.push(`- [ ] ${text}`);
    out.push('');
  }
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const today = process.env.REVIEW_DATE || new Date().toISOString().slice(0, 10);
  const data = loadData();
  const queue = reviewQueue(data, today);
  mkdirSync(join(data.root, 'docs'), { recursive: true });
  writeFileSync(join(data.root, 'docs/revision-datos.md'), toMarkdown(queue, today) + '\n');
  console.log(`Cola de revisión: ${queue.length} fichas, ${queue.filter((q) => q.stale.length).length} con datos caducados → docs/revision-datos.md`);
}
