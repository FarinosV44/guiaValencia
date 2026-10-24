// Selector «Estoy por aquí». Usa exactamente las mismas reglas que las pruebas (lib/recommend.js).
// El estado vive en la URL (zona, día, hora…; nunca coordenadas ni edades): volver o cambiar de idioma lo conserva.
import { UI } from './i18n.js';
import { recommend, continuation } from './lib/recommend.js';
import { summarize } from './lib/price.js';
import { money, escapeHtml as e } from './lib/format.js';

const catalog = JSON.parse(document.getElementById('catalog').textContent);
const lang = catalog.lang;
const ui = UI[lang];
const m = (x) => money(x, lang);
const form = document.getElementById('selector');
const out = document.getElementById('results');

const FIELDS = ['zona', 'dia', 'hora', 'con', 'presupuesto', 'antojo', 'plan'];
const CHECKS = ['sinpantallas', 'fuera'];

function readUrl() {
  const p = new URLSearchParams(location.search);
  let any = false;
  for (const f of FIELDS) if (p.has(f) && form.elements[f]) { form.elements[f].value = p.get(f); any = true; }
  for (const c of CHECKS) if (p.get(c) === '1') { form.elements[c].checked = true; any = true; }
  return any;
}

function formQuery() {
  const fd = new FormData(form);
  const v = (k) => fd.get(k) || null;
  return {
    zone: v('zona'), day: v('dia'), time: v('hora'), company: v('con'),
    budget: v('presupuesto') ? Number(v('presupuesto')) : null,
    craving: v('antojo'), plan: v('plan'),
    noScreens: fd.get('sinpantallas') === '1', includeOutside: fd.get('fuera') === '1',
  };
}

function writeUrl() {
  const fd = new FormData(form);
  const p = new URLSearchParams();
  for (const f of FIELDS) if (fd.get(f)) p.set(f, fd.get(f));
  for (const c of CHECKS) if (fd.get(c) === '1') p.set(c, '1');
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

function priceLine(place) {
  const s = summarize(place.price);
  if (s.exampleTotal != null) return `${m(s.perPerson)} ${ui.receiptPerPerson} (${ui.receiptPartial.toLowerCase()}, ${ui.receiptGroup(s.exampleParty)}: ${m(s.exampleTotal)})`;
  if (s.base != null) return `${m(s.base)} ${ui.receiptPerPerson} (${lang === 'es' ? 'base' : 'base price'})`;
  return ui.bands.pendiente;
}

function pickHtml(pick) {
  const p = pick.place;
  const reasons = pick.reasons.map((r) => ui.reasons[r.code]?.(r, m, ui)).filter(Boolean);
  const limits = pick.limits.map((l) => ui.limits[l.code]?.(l, ui)).filter(Boolean);
  return `<article class="pick">
    <span class="pick__slot">${e(ui.slots[pick.slot])}</span>
    <h3><a href="${p.url}">${e(p.name)}</a></h3>
    <p class="ticket__meta">${e(p.type)}${p.zone ? ', ' + e(catalog.zones[p.zone]) : ''}</p>
    <p>${e(p.text.fits)}</p>
    ${reasons.length ? `<p><strong>${e(ui.why)}:</strong></p><ul>${reasons.map((x) => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
    <p class="pick__catch"><strong>${e(ui.catch)}:</strong> ${e(p.text.not_for)}${limits.length ? ' ' + e(limits.join(' ')) : ''}</p>
    <p class="num small">${e(priceLine(p))}</p>
    <p class="pick__actions"><a href="${p.url}">${e(ui.seeCard)}</a><a href="${e(p.maps)}" rel="nofollow noopener">${e(ui.maps)}</a></p>
  </article>`;
}

function render(res, q) {
  const parts = [`<h2 id="results-title" tabindex="-1">${e(res.enough ? ui.resultsTitle : ui.resultsTitleFew)}</h2>`];
  if (!res.enough) parts.push(`<p class="lead">${e(ui.resultsFew(res.picks.length))}</p>`);
  if (res.picks.length) parts.push(`<div class="results__picks">${res.picks.map(pickHtml).join('')}</div>`);

  if (res.picks.length) {
    const cont = continuation(catalog.places, res.picks[0], q);
    const sweet = cont.options.slice(0, 3);
    parts.push(`<section class="block"><h3>${e(ui.continuationTitle)}</h3>${cont.dessertIncluded ? `<p>${e(ui.continuationIncluded)}</p>` : ''}${
      sweet.length ? `<ul>${sweet.map((o) => `<li><a href="${o.place.url}">${e(o.place.name)}</a>: ${e(o.place.text.fits)}</li>`).join('')}</ul><p class="small">${e(ui.continuationHoursNote)}</p>` : `<p>${e(ui.continuationNone)}</p>`
    }</section>`);
  }

  if (res.pending.length) {
    parts.push(`<section class="excl"><h3>${e(ui.pendingTitle)}</h3><p>${e(ui.pendingLead)}</p><ul>${res.pending.map((x) => `<li><a href="${x.place.url}">${e(x.place.name)}</a>: ${e(x.pendingReasons.map((r) => ui.pendingWhy[r]).join(', '))}</li>`).join('')}</ul></section>`);
  }

  const ex = Object.entries(res.exclusionCounts).filter(([k]) => ui.excluded[k]);
  if (ex.length || res.suggestions.length) {
    parts.push(`<section class="excl"><h3>${e(ui.excludedTitle)}</h3>${ex.length ? `<ul>${ex.map(([k, n]) => `<li>${e(ui.excluded[k])}: ${n}</li>`).join('')}</ul>` : ''}${
      res.suggestions.length ? `<p><strong>${e(ui.suggestionsTitle)}:</strong></p><div class="sugg">${res.suggestions.map((s) => `<button type="button" data-sugg="${s}">${e(ui.suggestions[s])}</button>`).join('')}</div>` : ''
    }</section>`);
  }
  out.innerHTML = parts.join('');
}

function run(focus) {
  const q = formQuery();
  const res = recommend(catalog.places, q);
  render(res, q);
  writeUrl();
  if (focus) document.getElementById('results-title')?.focus();
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  run(true);
});

out.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-sugg]');
  if (!b) return;
  const s = b.dataset.sugg;
  if (s === 'quitar_zona') form.elements.zona.value = '';
  if (s === 'cambiar_hora') { form.elements.hora.value = ''; form.elements.dia.value = ''; }
  if (s === 'subir_presupuesto') {
    const sel = form.elements.presupuesto;
    if (sel.selectedIndex > 0 && sel.selectedIndex < sel.options.length - 1) sel.selectedIndex += 1; else sel.value = '';
  }
  if (s === 'quitar_antojo') form.elements.antojo.value = '';
  if (s === 'incluir_fuera') form.elements.fuera.checked = true;
  if (s === 'ver_pendientes') { document.querySelector('.excl')?.scrollIntoView(); return; }
  run(true);
});

if (readUrl()) run(false);
