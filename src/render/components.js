import { escapeHtml as e, money, t, DAYS, DAY_NAMES, DAY_SHORT, clock, dateLabel } from '../lib/format.js';
import { summarize, COMPONENTS, bandOf } from '../lib/price.js';
import { placeDisclosures } from '../lib/funding.js';
import { UI, PATHS, TYPE_EN } from '../i18n.js';
import { icon, CRAVING_ICON } from '../icons.js';

export function typeLabel(place, lang) {
  return lang === 'en' ? TYPE_EN[place.type] || place.type : place.type;
}

export function zoneName(place, ctx, lang) {
  const z = ctx.data.zoneById[place.zone];
  return z ? t(z.name, lang) : '';
}

export function scopeBadge(place, lang) {
  const ui = UI[lang];
  if (place.scope === 'excursion') return `<span class="badge badge--away">${e(ui.excursion)}</span>`;
  if (place.scope === 'area_metropolitana') return `<span class="badge badge--away">${e(ui.outsideCity)}</span>`;
  return '';
}

export function evidenceBadge(place, ctx, lang) {
  const ui = UI[lang];
  const d = placeDisclosures(ctx.data.funding, place);
  if (d.kind === 'financiada') return `<span class="badge badge--paid">${e(ui.evidenceKinds.visita_propia)}</span>`;
  if (d.kind === 'visita_propia') return `<span class="badge badge--visit">${e(ui.evidenceKinds.visita_propia)}</span>`;
  return `<span class="badge badge--doc">${e(ui.evidenceKinds.documental)}</span>`;
}

// ——— La cuenta ———
export function receipt(place, lang) {
  const ui = UI[lang];
  const p = place.price || {};
  const s = summarize(p);
  const m = (x) => money(x, lang);
  const rows = [];

  if (p.example) {
    rows.push(`<p class="rc__sub">${e(ui.receiptExample(p.example.party))}</p>`);
    rows.push('<table class="rc__lines"><tbody>');
    for (const it of p.example.items) {
      rows.push(`<tr><td>${it.qty} × ${e(t(it.label, lang))}</td><td class="num">${m(it.qty * it.amount)}</td></tr>`);
    }
    rows.push('</tbody></table>');
    if (p.example.note) rows.push(`<p class="rc__note">${e(t(p.example.note, lang))}</p>`);
  }

  // Solo enseñamos lo que sabemos: un concepto sin dato no ocupa fila.
  const compRows = COMPONENTS.map((k) => {
    const st = s.components.find((c) => c.key === k).status;
    if (st === 'desconocido' || !ui.includes[st]) return '';
    const open = ['aparte', 'obligatoria_aparte'].includes(st);
    return `<tr class="${open ? 'is-open' : ''}"><td>${e(ui.components[k])}</td><td class="num">${e(ui.includes[st])}</td></tr>`;
  }).join('');

  let total = '';
  if (s.exampleTotal != null) {
    const lbl = s.complete ? ui.receiptComplete : ui.receiptPartial;
    total = `<div class="rc__total"><span>${e(lbl)} ${e(ui.receiptGroup(s.exampleParty))}</span><strong class="num">${m(s.exampleTotal)}</strong></div>
<div class="rc__pp"><span>${e(ui.receiptPerPerson)}</span><span class="num">${m(s.perPerson)}</span></div>`;
  } else if (s.base != null) {
    total = `<div class="rc__total"><span>${e(ui.receiptBase)}</span><strong class="num">${m(s.base)}</strong></div>`;
  }

  const lines = (p.lines || []).length
    ? `<details class="rc__pub"><summary>${e(ui.receiptPublished)}</summary><table><tbody>${p.lines
        .map((l) => {
          const amt = l.amount_range ? `${m(l.amount_range[0])}–${m(l.amount_range[1])}` : m(l.amount);
          return `<tr><td>${e(t(l.label, lang))}${l.third_party ? ' *' : ''}</td><td class="num">${amt} <span class="unit">${e(ui.units[l.unit] || '')}</span></td></tr>`;
        })
        .join('')}</tbody></table>${p.lines.some((l) => l.third_party) ? `<p class="rc__note">* ${e(ui.receiptThirdParty)}</p>` : ''}</details>`
    : '';

  const extra = [];
  if (p.minimum) extra.push(`<p><strong>${e(ui.receiptMinimum)}:</strong> ${e(t(p.minimum, lang))}</p>`);
  if (p.kids_cost) extra.push(`<p><strong>${e(ui.receiptKids)}:</strong> ${e(t(p.kids_cost, lang))}</p>`);
  if (p.note) extra.push(`<p class="rc__note">${e(t(p.note, lang))}</p>`);

  // Sin precio publicado no hay cuenta que explicar: la ficha guía con el resto.
  if (s.label === 'sin_precio' && !(p.lines || []).length && !p.minimum && !p.kids_cost) return '';
  const warn = s.exampleTotal != null || s.base != null ? `<p class="rc__warn">${e(ui.receiptNotFull)}</p>` : '';
  const src = p.source ? `<p class="rc__src"><a href="${e(p.source)}" rel="nofollow noopener">${e(new URL(p.source).hostname.replace(/^www\./, ''))}</a>, ${e(dateLabel(place.checked_on, lang))}</p>` : '';

  return `<section class="receipt" aria-label="${e(ui.receiptTitle)}">
<h2 class="rc__title">${e(ui.receiptTitle)}</h2>
${rows.join('')}
${total}
${compRows ? `<table class="rc__comp"><tbody>${compRows}</tbody></table>` : ''}
${warn}
${lines}
${extra.join('')}
${src}
</section>`;
}

// ——— Horario ———
export function hoursBlock(place, lang) {
  const ui = UI[lang];
  const h = place.hours || { status: 'desconocido' };
  const known = h.weekly && Object.keys(h.weekly).length;
  if (!known && !h.service && h.status !== 'contradictorio' && (!h.note || h.status === 'desconocido')) return '';
  const status = ui.hoursStatus[h.status] ? `<p class="hours__status hours__status--${h.status}">${e(ui.hoursStatus[h.status])}</p>` : '';
  let table = '';
  if (h.weekly) {
    table = `<table class="hours"><tbody>${DAYS.filter((d) => h.weekly[d] !== undefined).map((d) => {
      const v = h.weekly[d];
      let txt;
      if (Array.isArray(v) && v.length === 0) txt = e(ui.closed);
      else if (Array.isArray(v)) txt = v.map(([a, b]) => `${clock(a)}–${clock(b)}`).join(', ');
      else txt = e(ui.slotsOnly(v.slots.map((x) => ui.slotNames[x]).join(' + ')));
      return `<tr><th scope="row">${e(DAY_NAMES[lang][d])}</th><td>${txt}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  if (h.service) table += `<p>${e(ui.serviceHours)}: ${h.service.map(([a, b]) => `${clock(a)}–${clock(b)}`).join(', ')}</p>`;
  const src = h.source ? `<p class="small">${e(ui.hoursSource)}: <a href="${e(h.source)}" rel="nofollow noopener">${e(new URL(h.source).hostname.replace(/^www\./, ''))}</a>${h.checked_on ? `, ${e(dateLabel(h.checked_on, lang))}` : ''}</p>` : '';
  const hol = h.holidays === 'cerrado' ? `<p class="small">${e(ui.holidaysClosed)}</p>` : '';
  const kitchen = h.kitchen && !h.note ? `<p class="small">${e(ui.kitchenHours)}</p>` : '';
  const note = h.note ? `<p class="small">${e(t(h.note, lang))}</p>` : '';
  return `${status}${table}${kitchen}${note}${hol}${src}`;
}

// ——— Niños ———
export const KID_ATTRS = ['espacio_juego', 'juego_sin_pantallas', 'politica_sin_pantallas', 'sin_tv', 'monitores', 'trona', 'cambiador', 'carrito', 'pedir_sin_movil'];

export function kidsBlock(place, lang, { full = false } = {}) {
  const ui = UI[lang];
  const k = place.kids || {};
  const known = KID_ATTRS.filter((a) => k[a] && k[a] !== 'desconocido');
  if (known.length === 0 && !k.edades && !k.acompanamiento && !place.price?.kids_cost) return '';
  const rows = known.map((a) => {
    const v = k[a];
    return `<tr><th scope="row">${e(ui.kidsAttrs[a])}</th><td><span class="kv kv--${v}">${e(ui.kidsValues[v])}</span></td></tr>`;
  }).join('');
  const extra = [];
  if (k.edades) extra.push(`<p><strong>${e(ui.kidsAges)}:</strong> ${e(t(k.edades, lang))}</p>`);
  if (k.acompanamiento) extra.push(`<p><strong>${e(ui.kidsCompany)}:</strong> ${e(t(k.acompanamiento, lang))}</p>`);
  if (place.price?.kids_cost) extra.push(`<p><strong>${e(ui.kidsCost)}:</strong> ${e(t(place.price.kids_cost, lang))}</p>`);
  return `${rows ? `<table class="kids"><tbody>${rows}</tbody></table>` : ''}${extra.join('')}`;
}

// ——— Evidencias ———
export function evidenceBlock(place, ctx, lang) {
  const ui = UI[lang];
  const groups = { documental: [], opinion_usuario: [], premio_externo: [], visita_propia: [] };
  for (const ev of place.evidence) groups[ev.kind].push(ev);
  const out = [];
  out.push(`<p class="disclosure">${e(ui.disclosureDocumental)}</p>`);
  out.push('<dl class="evidence">');
  if (groups.documental.length) {
    out.push(`<dt>${e(ui.evidenceKinds.documental)}</dt><dd><ul>${groups.documental.map((x) => `<li><a href="${e(x.url)}" rel="nofollow noopener">${e(x.domain)}</a></li>`).join('')}</ul><span class="small">${e(ui.checked)} ${e(dateLabel(place.checked_on, lang))}</span></dd>`);
  }
  if (groups.opinion_usuario.length) {
    out.push(`<dt>${e(ui.evidenceKinds.opinion_usuario)}</dt><dd>${e(ui.evidenceReviews(groups.opinion_usuario[0].count))} <span class="small">${e(ui.checked)} ${e(dateLabel(place.checked_on, lang))}</span></dd>`);
  }
  if (groups.premio_externo.length) {
    out.push(`<dt>${e(ui.evidenceKinds.premio_externo)}</dt><dd><ul>${groups.premio_externo.map((x) => `<li><a href="${e(x.url)}" rel="nofollow noopener">${e(t(x.label, lang))}</a></li>`).join('')}</ul></dd>`);
  }
  out.push('</dl>');
  return out.join('');
}

// ——— Tarjeta compacta (ticket) ———
export function placeCard(place, ctx, lang, { headingLevel = 3, showZone = true } = {}) {
  const ui = UI[lang];
  const tx = place.text[lang];
  const s = summarize(place.price);
  const m = (x) => money(x, lang);
  let priceLine;
  if (s.exampleTotal != null) priceLine = `${m(s.perPerson)} ${ui.receiptPerPerson}, ${ui.receiptPartial.toLowerCase()}`;
  else if (s.base != null) priceLine = `${m(s.base)} ${ui.receiptPerPerson}, ${lang === 'es' ? 'base' : 'base price'}`;
  else priceLine = '';
  const hTag = `h${headingLevel}`;
  const href = PATHS.place[lang](place.id);
  const icoName = CRAVING_ICON[(place.cravings || [])[0]] || 'pin';
  return `<article class="ticket" data-zone="${e(place.zone || '')}">
  <div class="ticket__head">
    <span class="ticket__ico">${icon(icoName)}</span>
    <div>
      <${hTag} class="ticket__name"><a href="${href}">${e(place.name)}</a></${hTag}>
      <p class="ticket__meta">${e(typeLabel(place, lang))}${showZone && place.zone ? `, ${e(zoneName(place, ctx, lang))}` : ''}</p>
    </div>
  </div>
  <div class="ticket__badges">${evidenceBadge(place, ctx, lang)}${scopeBadge(place, lang)}${place.branch_pending ? `<span class="badge badge--warn">${e(lang === 'es' ? 'Varias sucursales' : 'Several branches')}</span>` : ''}${place.candidate_only ? `<span class="badge badge--warn">${e(lang === 'es' ? 'Solo para curiosos' : 'For the curious')}</span>` : ''}</div>
  <p class="ticket__fits">${e(tx.fits)}</p>
  <p class="ticket__catch"><strong>${e(ui.catch)}:</strong> ${e(tx.not_for)}</p>
  ${priceLine ? `<p class="ticket__price"><span class="num">${e(priceLine)}</span></p>` : ''}
</article>`;
}

export function compareTable(places, ctx, lang) {
  const ui = UI[lang];
  const c = ui.compareCols;
  const m = (x) => money(x, lang);
  // Solo comparamos lo que tiene cifra: una fila de rayas no ayuda a decidir.
  const priced = places.filter((p) => summarize(p.price).base != null);
  if (priced.length < 2) return '';
  const rows = priced.map((p) => {
    const s = summarize(p.price);
    const comp = (k) => ui.includes[s.components.find((x) => x.key === k).status];
    return `<tr><th scope="row"><a href="${PATHS.place[lang](p.id)}">${e(p.name)}</a></th><td class="num">${s.base != null ? m(s.base) : ui.unknownMark}</td><td>${e(comp('bebida'))}</td><td>${e(comp('postre'))}</td></tr>`;
  }).join('');
  return `<div class="compare" role="region" aria-label="${e(ui.compareTitle)}" tabindex="0"><table><caption>${e(ui.compareTitle)}</caption><thead><tr><th scope="col">${e(c.name)}</th><th scope="col">${e(c.base)}</th><th scope="col">${e(c.drink)}</th><th scope="col">${e(c.dessert)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function bandLabel(place, lang) {
  return UI[lang].bands[bandOf(place.price)];
}
