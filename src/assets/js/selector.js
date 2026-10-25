// Selector «Estoy por aquí». Usa exactamente las mismas reglas que las pruebas (lib/recommend.js).
// El estado vive en la URL (zona, día, hora…; nunca coordenadas ni edades): volver o cambiar de idioma lo conserva.
import { UI } from './i18n.js';
import { recommend, continuation } from './lib/recommend.js';
import { summarize } from './lib/price.js';
import { money, escapeHtml as e, clock } from './lib/format.js';
import { statusAt } from './lib/hours.js';
import { dayOfDate, holidayInfo } from './lib/calendar.js';

const catalog = JSON.parse(document.getElementById('catalog').textContent);
const lang = catalog.lang;
const ui = UI[lang];
const m = (x) => money(x, lang);
const form = document.getElementById('selector');
const out = document.getElementById('results');
const MAX_COMPARE = 3;
const selected = new Set();
let lastQuery = {};
const byId = Object.fromEntries(catalog.places.map((p) => [p.id, p]));

const FIELDS = ['fecha', 'zona', 'dia', 'hora', 'con', 'presupuesto', 'antojo', 'plan'];
const CHECKS = ['sinpantallas', 'sinmovil', 'fuera'];

function readUrl() {
  const p = new URLSearchParams(location.search);
  let any = false;
  for (const f of FIELDS) if (p.has(f) && form.elements[f]) { form.elements[f].value = p.get(f); any = true; }
  for (const c of CHECKS) if (p.get(c) === '1') { form.elements[c].checked = true; any = true; }
  if (form.elements.fecha.value) form.elements.dia.value = dayOfDate(form.elements.fecha.value);
  for (const g of p.getAll('gusto')) {
    const box = form.querySelector(`input[name="gusto"][value="${CSS.escape(g)}"]`);
    if (box) { box.checked = true; any = true; }
  }
  return any;
}

function formQuery() {
  const fd = new FormData(form);
  const v = (k) => fd.get(k) || null;
  const date = v('fecha');
  const hol = date ? holidayInfo(catalog.festivos, date) : null;
  return {
    date, holiday: hol ? !!hol.holiday : false, holidayInfo: hol,
    zone: v('zona'), day: date ? dayOfDate(date) : v('dia'), time: v('hora'), company: v('con'),
    budget: v('presupuesto') ? Number(v('presupuesto')) : null,
    craving: v('antojo'), plan: v('plan'),
    noScreens: fd.get('sinpantallas') === '1', noPhone: fd.get('sinmovil') === '1', includeOutside: fd.get('fuera') === '1',
    likes: fd.getAll('gusto'),
  };
}

function writeUrl() {
  const fd = new FormData(form);
  const p = new URLSearchParams();
  for (const f of FIELDS) if (fd.get(f)) p.set(f, fd.get(f));
  for (const c of CHECKS) if (fd.get(c) === '1') p.set(c, '1');
  for (const g of fd.getAll('gusto')) p.append('gusto', g);
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

function priceLine(place) {
  const s = summarize(place.price);
  if (s.exampleTotal != null) return `${m(s.perPerson)} ${ui.receiptPerPerson} (${ui.receiptPartial.toLowerCase()}, ${ui.receiptGroup(s.exampleParty)}: ${m(s.exampleTotal)})`;
  if (s.base != null) return `${m(s.base)} ${ui.receiptPerPerson} (${lang === 'es' ? 'base' : 'base price'})`;
  return '';
}

function pickHtml(pick) {
  const p = pick.place;
  const reasons = pick.reasons.map((r) => ui.reasons[r.code]?.(r, m, ui)).filter(Boolean);
  const limits = pick.limits.map((l) => ui.limits[l.code]?.(l, ui)).filter(Boolean);
  return `<article class="pick">
    <span class="pick__slot">${e(ui.slots[pick.slot])}</span>
    <h3><a href="${p.url}">${e(p.name)}</a></h3>
    <p class="ticket__meta">${e(p.type)}${p.zone ? ', ' + e(catalog.zones[p.zone]) : ''}</p>
    ${(p.labels || []).length ? `<p>${p.labels.map((l) => `<span class="tag tag--${e(l.tone)}">${e(l.name)}</span>`).join(' ')}</p>` : ''}
    <p>${e(p.text.fits)}</p>
    ${p.text.reviews ? `<p class="small"><strong>${e(ui.reviewsTitle)}:</strong> ${e(p.text.reviews)}</p>` : ''}
    ${reasons.length ? `<p><strong>${e(ui.why)}:</strong></p><ul>${reasons.map((x) => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
    <p class="pick__catch"><strong>${e(ui.catch)}:</strong> ${e(p.text.not_for)}${limits.length ? ' ' + e(limits.join(' ')) : ''}</p>
    ${priceLine(p) ? `<p class="num small">${e(priceLine(p))}</p>` : ''}
    <p class="pick__actions"><a href="${p.url}">${e(ui.seeCard)}</a><a href="${e(p.maps)}" rel="nofollow noopener">${e(ui.maps)}</a></p>
    ${compareBox(p)}
  </article>`;
}

function compareBox(p) {
  return `<label class="check comparebox"><input type="checkbox" data-compare="${e(p.id)}"${selected.has(p.id) ? ' checked' : ''}> <span>${e(ui.compareAdd)}</span></label>`;
}

function hoursCell(p) {
  const q = lastQuery;
  if (q.day && q.time) {
    const st = statusAt(p.hours, q.day, q.time, { holiday: !!q.holiday });
    return ui.hoursStates[st.state] + (st.closes ? ` (${clock(st.closes)})` : '');
  }
  return ui.hoursStatus[p.hours?.status] || ui.unknownMark;
}

function renderCompare() {
  const box = document.getElementById('compare');
  if (!box) return;
  const ps = [...selected].map((id) => byId[id]).filter(Boolean);
  for (const input of out.querySelectorAll('input[data-compare]')) {
    input.disabled = !input.checked && selected.size >= MAX_COMPARE;
  }
  if (ps.length < 2) {
    box.innerHTML = `<p class="small">${e(selected.size >= MAX_COMPARE ? ui.compareLimit : ui.compareHint)}</p>`;
    return;
  }
  const R = ui.compareRows;
  const sums = ps.map((p) => summarize(p.price));
  const comp = (s, k) => ui.includes[s.components.find((c) => c.key === k).status];
  const kid = (p, k) => ui.kidsValues[p.kids?.[k] || 'desconocido'];
  const rows = [
    [R.base, sums.map((s) => (s.base != null ? m(s.base) : ui.unknownMark))],
    [R.example, sums.map((s) => (s.perPerson != null ? m(s.perPerson) : ui.unknownMark))],
    [R.bebida, sums.map((s) => comp(s, 'bebida'))],
    [R.pan, sums.map((s) => comp(s, 'pan'))],
    [R.postre, sums.map((s) => comp(s, 'postre'))],
    [R.cafe, sums.map((s) => comp(s, 'cafe'))],
    [lastQuery.day && lastQuery.time ? R.hoursAt : R.hours, ps.map(hoursCell)],
    [R.play, ps.map((p) => kid(p, 'juego_sin_pantallas'))],
    [R.phone, ps.map((p) => kid(p, 'pedir_sin_movil'))],
    [R.scope, ps.map((p) => ui.scopes[p.scope])],
  ];
  box.innerHTML = `<div class="compare compare--picks" role="region" tabindex="0" aria-label="${e(ui.compareTitle)}"><table><caption>${e(ui.compareTitle)}</caption>
    <thead><tr><td></td>${ps.map((p) => `<th scope="col"><a href="${p.url}">${e(p.name)}</a></th>`).join('')}</tr></thead>
    <tbody>${rows.map(([label, cells]) => `<tr><th scope="row">${e(label)}</th>${cells.map((c) => `<td${c === ui.unknownMark || /¿\?/.test(c) ? ' class="is-open"' : ''}>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${selected.size >= MAX_COMPARE ? `<p class="small">${e(ui.compareLimit)}</p>` : ''}`;
}

function render(res, q) {
  const holNote = q.holidayInfo
    ? (q.holidayInfo.holiday ? `<p class="notice">${e(ui.holidayNote(q.holidayInfo.holiday.name[lang]))}</p>` : (!q.holidayInfo.known ? `<p class="notice notice--pending">${e(ui.holidayUnknownYear)}</p>` : ''))
    : '';
  const parts = [holNote, `<h2 id="results-title" tabindex="-1">${e(res.enough ? ui.resultsTitle : ui.resultsTitleFew)}</h2>`];
  if (!res.enough) parts.push(`<p class="lead">${e(ui.resultsFew(res.picks.length))}</p>`);
  if (res.picks.length) parts.push(`<div class="results__picks">${res.picks.map(pickHtml).join('')}</div>`);

  if (res.picks.length) {
    const cont = continuation(catalog.places, res.picks[0], q);
    const sweet = cont.options.slice(0, 3);
    if (cont.dessertIncluded || sweet.length) parts.push(`<section class="block"><h3>${e(ui.continuationTitle)}</h3>${cont.dessertIncluded ? `<p>${e(ui.continuationIncluded)}</p>` : ''}${
      sweet.length ? `<ul>${sweet.map((o) => `<li><a href="${o.place.url}">${e(o.place.name)}</a>: ${e(o.place.text.fits)}</li>`).join('')}</ul><p class="small">${e(ui.continuationHoursNote)}</p>` : ''
    }</section>`);
  }

  if (res.pending.length) {
    parts.push(`<section class="excl"><h3>${e(ui.pendingTitle)}</h3><p>${e(ui.pendingLead)}</p><ul>${res.pending.map((x) => `<li><a href="${x.place.url}">${e(x.place.name)}</a>: ${e(x.pendingReasons.map((r) => ui.pendingWhy[r]).join(', '))} ${compareBox(x.place)}</li>`).join('')}</ul></section>`);
  }

  const ex = Object.entries(res.exclusionCounts).filter(([k]) => ui.excluded[k]);
  if (ex.length || res.suggestions.length) {
    parts.push(`<section class="excl"><h3>${e(ui.excludedTitle)}</h3>${ex.length ? `<ul>${ex.map(([k, n]) => `<li>${e(ui.excluded[k])}: ${n}</li>`).join('')}</ul>` : ''}${
      res.suggestions.length ? `<p><strong>${e(ui.suggestionsTitle)}:</strong></p><div class="sugg">${res.suggestions.map((s) => `<button type="button" data-sugg="${s}">${e(ui.suggestions[s])}</button>`).join('')}</div>` : ''
    }</section>`);
  }
  parts.push('<section class="block" id="compare" aria-live="polite"></section>');
  out.innerHTML = parts.join('');
  renderCompare();
}

function run(focus) {
  const q = formQuery();
  const res = recommend(catalog.places, q);
  lastQuery = q;
  const shown = new Set([...res.picks, ...res.pending].map((x) => x.place.id));
  for (const id of [...selected]) if (!shown.has(id)) selected.delete(id);
  render(res, q);
  writeUrl();
  if (focus) document.getElementById('results-title')?.focus();
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  run(true);
});

out.addEventListener('change', (ev) => {
  const box = ev.target.closest('input[data-compare]');
  if (!box) return;
  if (box.checked) {
    if (selected.size >= MAX_COMPARE) { box.checked = false; return; }
    selected.add(box.dataset.compare);
  } else selected.delete(box.dataset.compare);
  renderCompare();
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

// La fecha fija el día: se refleja en el selector de día para que se vea qué se está comprobando.
form.elements.fecha.addEventListener('change', () => {
  const d = form.elements.fecha.value;
  if (d) form.elements.dia.value = dayOfDate(d);
});
