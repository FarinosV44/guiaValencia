import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as e, money, t, DAYS, DAY_NAMES, clock, dateLabel } from '../lib/format.js';
import { summarize, BANDS } from '../lib/price.js';
import { statement, isFunded } from '../lib/funding.js';
import { dayTable, checkRoute } from '../lib/route.js';
import { isEatingVenue, RULES_VERSION } from '../lib/recommend.js';
import { alternativesFor } from '../lib/alternatives.js';
import { dessertVerdict } from '../lib/dessert.js';
import { UI, PATHS, SITE } from '../i18n.js';
import { icon, CRAVING_ICON } from '../icons.js';
import { receipt, hoursBlock, kidsBlock, evidenceBlock, reviewsBlock, labelsBlock, labelChips, placeCard, compareTable, typeLabel, zoneName, scopeBadge, evidenceBadge } from './components.js';

const LANGS = ['es', 'en'];
const PRINT_DATE = '2026-10-24';
const other = (l) => (l === 'es' ? 'en' : 'es');

// Página indexable solo si es contenido completo y revisado. Los borradores documentales llevan noindex,
// no entran en el sitemap y no reciben hreflang (#20, #37, #42).
function pageBase(key, lang, path, alt, { indexable, draft }) {
  return { key, lang, path, alt, indexable, altIndexable: indexable, draft };
}

function chips(items) {
  return `<ul class="chips">${items.map((i) => `<li><a class="chip" href="${i.href}">${i.icon ? icon(i.icon) : ''}<span>${e(i.label)}</span></a></li>`).join('')}</ul>`;
}

function categoryFor(ctx, id) {
  return ctx.data.categories.find((c) => c.id === id);
}

function zonesWithEating(ctx) {
  const counts = {};
  for (const p of ctx.data.places) if (isEatingVenue(p) && p.scope === 'valencia') counts[p.zone] = (counts[p.zone] || 0) + 1;
  return ctx.data.zones.filter((z) => counts[z.id]);
}

export function zonePagesList(ctx) {
  return ctx.data.zones.filter((z) => z.scope === 'valencia' && ctx.data.places.filter((p) => p.zone === z.id).length >= 3);
}

// ——— Portada ———
function homePage(ctx, lang) {
  const ui = UI[lang];
  const sel = PATHS.selector[lang];
  const stmt = statement(ctx.data.funding, lang);
  const sample = ctx.data.byId.anyora;
  const cravingLinks = [
    ['arroz', PATHS.category[lang](categoryFor(ctx, 'arroces').slug[lang])],
    ['tapas', `${sel}?antojo=tapas`],
    ['asiatico', `${sel}?antojo=asiatico`],
    ['pizza', PATHS.category[lang](categoryFor(ctx, 'pizzas').slug[lang])],
    ['burger', PATHS.category[lang](categoryFor(ctx, 'hamburguesas').slug[lang])],
    ['valenciano', `${sel}?antojo=valenciano`],
    ['nuevo', `${sel}?antojo=nuevo`],
    ['esmorzar', PATHS.category[lang](categoryFor(ctx, 'esmorzar').slug[lang])],
    ['coreano', PATHS.category[lang](categoryFor(ctx, 'barbacoa-coreana').slug[lang])],
    ['alta_cocina', PATHS.category[lang](categoryFor(ctx, 'alta-cocina').slug[lang])],
  ].map(([k, href]) => ({ label: ui.cravings[k], href, icon: CRAVING_ICON[k] }));

  const zoneOpts = zonesWithEating(ctx).map((z) => `<option value="${z.id}">${e(t(z.name, lang))}</option>`).join('');
  const bandLinks = [
    { label: ui.bands['hasta-15'], href: `${sel}?presupuesto=15` },
    { label: ui.bands['15-30'], href: `${sel}?presupuesto=30` },
    { label: ui.bands['30-60'], href: `${sel}?presupuesto=60` },
    { label: ui.bands['mas-60'], href: `${sel}` },
  ];
  const companyLinks = [
    { label: ui.companies.pareja, href: PATHS.category[lang](categoryFor(ctx, 'citas').slug[lang]), icon: 'cita' },
    { label: ui.companies.amigos, href: `${sel}?con=amigos`, icon: 'tapas' },
    { label: ui.companies.familia_bebe, href: PATHS.families[lang], icon: 'bebe' },
    { label: ui.companies.nino_activo, href: PATHS.families[lang], icon: 'nino' },
    { label: ui.companies.visitante, href: PATHS.category[lang](categoryFor(ctx, 'visitantes').slug[lang]), icon: 'maleta' },
  ];
  const planLinks = [
    { label: ui.plans.rapido, href: `${sel}?plan=rapido` },
    { label: ui.plans.sobremesa, href: `${sel}?plan=sobremesa` },
    { label: ui.plans.paseo, href: PATHS.routes[lang], icon: 'ruta' },
    { label: ui.plans.ocasion, href: PATHS.category[lang](categoryFor(ctx, 'alta-cocina').slug[lang]) },
    { label: ui.plans.descubrimiento, href: PATHS.category[lang](categoryFor(ctx, 'barrios').slug[lang]), icon: 'lupa' },
  ];
  const catOrder = ['arroces', 'sushi', 'pizzas', 'hamburguesas', 'citas', 'barrios', 'alta-cocina', 'esmorzar', 'playa', 'barbacoa-coreana', 'visitantes'];
  const cats = catOrder.map((id) => categoryFor(ctx, id));

  const r09 = ctx.data.routes.find((r) => r.id === 'R09');

  const body = `
<section class="hero">
  <div class="wrap hero__grid">
    <div class="hero__text">
      <h1>${e(ui.h1Home)}</h1>
      <p class="hero__tag">${e(ui.tagline)}</p>
      <p>${e(ui.homeIntro)}</p>
    </div>
    <a class="hero__receipt" href="${PATHS.place[lang](sample.id)}">
      ${heroReceipt(sample, lang)}
    </a>
  </div>
</section>

<section class="band band--ink">
  <div class="wrap independence">
    <p class="independence__claim">${e(stmt.headline)}</p>
    <p>${e(stmt.body)}</p>
    <p><a href="${PATHS.funding[lang]}">${e(ui.independenceLink)}</a></p>
  </div>
</section>

<section class="wrap block" aria-labelledby="h-antojo">
  <h2 id="h-antojo">${e(ui.cravingsTitle)}</h2>
  ${chips(cravingLinks)}
</section>

<section class="wrap block split" aria-labelledby="h-zona">
  <div>
    <h2 id="h-zona">${e(ui.zoneTitle)}</h2>
    <p>${e(ui.zoneLead)}</p>
    <form class="zoneform" action="${sel}" method="get">
      <label for="home-zona">${e(ui.fZone)}</label>
      <div class="zoneform__row">
        <select id="home-zona" name="zona">${zoneOpts}</select>
        <button type="submit" class="btn">${e(ui.zoneSubmit)}</button>
      </div>
    </form>
  </div>
  <div>
    <h2>${e(ui.budgetTitle)}</h2>
    <p>${e(ui.budgetLead)}</p>
    ${chips(bandLinks)}
  </div>
</section>

<section class="wrap block split">
  <div>
    <h2>${e(ui.companyTitle)}</h2>
    ${chips(companyLinks)}
  </div>
  <div>
    <h2>${e(ui.planTitle)}</h2>
    ${chips(planLinks)}
  </div>
</section>

<section class="wrap block" aria-labelledby="h-guias">
  <h2 id="h-guias">${e(ui.categoriesTitle)}</h2>
  <ul class="guides">${cats.map((c) => `<li><a href="${PATHS.category[lang](c.slug[lang])}">${icon(c.icon === 'arroz' ? 'arroz' : c.icon)}<span class="guides__name">${e(t(c.nav, lang))}</span><span class="guides__h1">${e(t(c.h1, lang))}</span></a></li>`).join('')}</ul>
</section>

<section class="wrap block split">
  <div class="teaser">
    ${icon('ruta')}
    <h2>${e(ui.routeTeaserTitle)}</h2>
    <p>${e(t(r09.summary, lang))}</p>
    <p><a class="btn btn--ghost" href="${PATHS.route[lang](r09.slug[lang])}">${e(ui.routeTeaserLink)}</a></p>
  </div>
  <div class="teaser">
    ${icon('nino')}
    <h2>${e(ui.familiesTeaserTitle)}</h2>
    <p>${e(ui.familiesTeaserBody)}</p>
    <p><a class="btn btn--ghost" href="${PATHS.families[lang]}">${e(ui.familiesTeaserLink)}</a></p>
  </div>
</section>

<section class="wrap block invite-strip">
  <p><a href="${PATHS.invite[lang]}">${e(ui.inviteLinkText)}</a></p>
  <p class="small">${e(ui.inviteLinkSub)}</p>
</section>`;

  const page = pageBase('home', lang, PATHS.home[lang], PATHS.home[other(lang)], { indexable: true, draft: false });
  page.title = lang === 'es' ? 'Dónde comer en Valencia: qué pedir, cuánto cuesta y cómo seguir el plan' : 'Where to eat in Valencia: what to order, what it costs and what comes next';
  page.description = ui.tagline + ' ' + ui.homeIntro;
  page.body = body;
  page.bodyClass = 'home';
  page.jsonld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE[lang].name, inLanguage: lang, url: ctx.origin + PATHS.home[lang] }];
  return page;
}

function heroReceipt(p, lang) {
  const ui = UI[lang];
  const s = summarize(p.price);
  const m = (x) => money(x, lang);
  const items = p.price.example.items.map((it) => `<tr><td>${e(t(it.label, lang))}</td><td class="num">${m(it.amount * it.qty)}</td></tr>`).join('');
  const unknowns = '';
  return `<div class="receipt receipt--hero" aria-hidden="false">
  <p class="rc__title">${e(p.name)}</p>
  <p class="rc__sub">${e(ui.receiptExample(p.price.example.party))}</p>
  <table class="rc__lines"><tbody>${items}${unknowns}</tbody></table>
  <div class="rc__total"><span>${e(ui.receiptPartial)}</span><strong class="num">${m(s.exampleTotal)}</strong></div>
  <p class="rc__warn">${e(ui.receiptNotFull)}</p>
</div>`;
}

// ——— Selector «Estoy por aquí» ———
function selectorPage(ctx, lang) {
  const ui = UI[lang];
  const zones = zonesWithEating(ctx);
  const opt = (v, l) => `<option value="${e(v)}">${e(l)}</option>`;
  const times = ['10:00', '13:30', '14:30', '17:30', '20:30', '21:30'];
  const cravings = ['arroz', 'tapas', 'asiatico', 'japones', 'coreano', 'pizza', 'burger', 'valenciano', 'nuevo', 'esmorzar', 'mediterranea', 'alta_cocina'];
  const zonePagesIds = new Set(zonePagesList(ctx).map((z) => z.id));
  const noscriptLinks = zones.filter((z) => zonePagesIds.has(z.id)).map((z) => `<li><a href="${PATHS.zone[lang](z.id)}">${e(t(z.name, lang))}</a></li>`).join('');

  const body = `
<div class="wrap">
  <h1 class="pagetitle">${e(ui.selectorH1)}</h1>
  <p class="lead">${e(ui.selectorLead)}</p>
  <noscript><style>#nl{display:none}</style></noscript>
  <form id="nl" class="nlform">
    <label for="f-frase">${e(ui.nlLabel)}</label>
    <div class="nlrow"><input id="f-frase" name="frase" type="text" autocomplete="off" maxlength="300" placeholder="${e(ui.nlPlaceholder)}"><button type="submit" class="btn">${e(ui.nlSubmit)}</button></div>
    <p class="small">${e(ui.nlHint)}</p>
    <div id="nl-out" aria-live="polite"></div>
  </form>
  <form id="selector" class="selector" novalidate>
    <div class="selector__grid">
      <div class="field"><label for="f-zona">${e(ui.fZone)}</label><select id="f-zona" name="zona">${opt('', ui.fAnyZone)}${zones.map((z) => opt(z.id, t(z.name, lang))).join('')}</select><p class="geo" hidden><button type="button" class="linkbtn" id="geo" title="${e(ui.geoNote)}">${e(ui.geoBtn)}</button> <span class="small" id="geo-status" role="status">${e(ui.geoNote)}</span></p></div>
      <div class="field"><label for="f-fecha">${e(ui.fDate)}</label><input id="f-fecha" name="fecha" type="date" min="2026-01-01" max="2027-12-31"></div>
      <div class="field"><label for="f-dia">${e(ui.fDay)}</label><select id="f-dia" name="dia">${opt('', ui.fAnyDay)}${DAYS.map((d) => opt(d, DAY_NAMES[lang][d])).join('')}</select></div>
      <div class="field"><label for="f-hora">${e(ui.fTime)}</label><select id="f-hora" name="hora">${opt('', ui.fAnyTime)}${times.map((h) => opt(h, h)).join('')}</select></div>
      <div class="field"><label for="f-con">${e(ui.fCompany)}</label><select id="f-con" name="con">${opt('', ui.fAnyCompany)}${Object.entries(ui.companies).map(([k, v]) => opt(k, v)).join('')}</select></div>
      <div class="field"><label for="f-presupuesto">${e(ui.fBudget)}</label><select id="f-presupuesto" name="presupuesto">${opt('', ui.fAnyBudget)}${[15, 20, 30, 40, 60, 100].map((b) => opt(String(b), (lang === 'es' ? 'Hasta ' : 'Up to ') + money(b, lang))).join('')}</select></div>
      <div class="field"><label for="f-antojo">${e(ui.fCraving)}</label><select id="f-antojo" name="antojo">${opt('', ui.fAnyCraving)}${cravings.map((c) => opt(c, ui.cravings[c])).join('')}</select></div>
      <div class="field"><label for="f-plan">${e(ui.fPlan)}</label><select id="f-plan" name="plan">${opt('', ui.fAnyPlan)}${['rapido', 'sobremesa', 'ocasion'].map((p) => opt(p, ui.plans[p])).join('')}</select></div>
    </div>
    <fieldset class="likes"><legend>${e(ui.fLikes)}</legend><div class="likes__row">${Object.entries(ui.likes).map(([k, v]) => `<label class="likechip"><input type="checkbox" name="gusto" value="${k}"><span>${e(v)}</span></label>`).join('')}</div></fieldset>
    <div class="selector__checks">
      <label class="check"><input type="checkbox" name="sinpantallas" value="1"> <span>${e(ui.fNoScreens)}</span></label>
      <label class="check"><input type="checkbox" name="sinmovil" value="1"> <span>${e(ui.fNoPhone)}</span></label>
      <label class="check"><input type="checkbox" name="fuera" value="1"> <span>${e(ui.fOutside)}</span></label>
    </div>
    <button type="submit" class="btn">${e(ui.fSubmit)}</button>
  </form>
  <noscript><p>${e(ui.fNoJs)}</p><ul class="linklist">${noscriptLinks}</ul></noscript>
  <div id="results" class="results" aria-live="polite"></div>
  <p class="small rules">${e(ui.rulesVersion)}: ${RULES_VERSION}. ${e(ui.noFunding)} <a href="${PATHS.method[lang]}">${e(ui.methodH1)}</a></p>
</div>`;

  const page = pageBase('selector', lang, PATHS.selector[lang], PATHS.selector[other(lang)], { indexable: true, draft: false });
  page.title = lang === 'es' ? 'Estoy por aquí: dónde comer en Valencia según zona, hora y presupuesto' : 'I’m around here: where to eat in Valencia by area, time and budget';
  page.description = ui.selectorLead;
  page.body = body;
  page.crumbs = [{ name: ui.navSelector, path: PATHS.selector[lang] }];
  page.navKey = 'selector';
  page.keepQuery = true;
  page.bodyClass = 'selector';
  page.scripts = [
    `<script type="application/json" id="catalog">${JSON.stringify(clientCatalog(ctx, lang)).replace(/</g, '\\u003c')}</script>`,
    `<script type="module" src="/assets/js/selector.js"></script>`,
  ];
  return page;
}

export function clientCatalog(ctx, lang) {
  return {
    lang,
    festivos: ctx.data.festivos,
    centers: Object.fromEntries(ctx.data.zones.filter((z) => z.center).map((z) => [z.id, z.center])),
    zones: Object.fromEntries(ctx.data.zones.map((z) => [z.id, t(z.name, lang)])),
    places: ctx.data.places.map((p) => ({
      id: p.id, name: p.name, type: typeLabel(p, lang), role: p.role, scope: p.scope, zone: p.zone, address: p.address,
      cravings: p.cravings, tags: p.tags, likes: p.likes || [], candidate_only: !!p.candidate_only, reviews_sample: p.reviews_sample || 0,
      price: p.price, hours: p.hours, kids: p.kids,
      text: { fits: p.text[lang].fits, not_for: p.text[lang].not_for, may_disappoint: p.text[lang].may_disappoint, reviews: p.reviews ? p.reviews.verdict[lang] : '' },
      labels: (p.labels || []).map((l) => ({ name: l.def.name[lang], tone: l.def.tone })),
      url: PATHS.place[lang](p.id), maps: p.maps.search,
    })),
  };
}

// ——— Ficha ———
function placePage(ctx, lang, p) {
  const ui = UI[lang];
  const tx = p.text[lang];
  const zone = ctx.data.zoneById[p.zone];
  const sameZone = ctx.data.places.filter((x) => x.zone === p.zone && x.id !== p.id);
  const alts = alternativesFor(p, ctx.data.places);
  const sameSweet = sameZone.filter((x) => (x.role || []).some((r) => r === 'postre' || r === 'cafe')).slice(0, 3);
  const dv = dessertVerdict(p, ctx.data.places);
  const sweetLinks = (list) => list.map((x) => `<a href="${PATHS.place[lang](x.place.id)}">${e(x.place.name)}</a>`).join(lang === 'es' ? ' o ' : ' or ');
  const lineAmt = (l) => (l.amount_range ? `${money(l.amount_range[0], lang)}–${money(l.amount_range[1], lang)}` : money(l.amount, lang));
  let dvText = '';
  if (dv) {
    const D = ui.dessert;
    if (dv.kind === 'quedate') dvText = e(D.quedate);
    else if (dv.kind === 'elige') dvText = D.elige(e(t(dv.line.label, lang)), e(lineAmt(dv.line)), sweetLinks(dv.sweet));
    else if (dv.kind === 'aqui') dvText = e(D.aqui(t(dv.line.label, lang), lineAmt(dv.line)));
    else if (dv.kind === 'fuera') dvText = D.fuera(sweetLinks(dv.sweet));
  }
  const dvBlock = dv && dvText ? `<section class="dessert dessert--${dv.kind}"><h2>${e(ui.dessertTitle)}</h2><p>${dvText}</p>${dv.sweet.length && dv.kind !== 'quedate' ? `<p class="small">${e(ui.dessert.hours)}</p>` : ''}</section>` : '';

  const body = `
<article class="wrap place">
  <header class="place__head">
    <h1 class="pagetitle">${e(p.name)}</h1>
    ${p.closed ? `<p class="notice">${e(lang === 'es' ? `Este local ha cerrado (${dateLabel(p.closed, lang)}). Lo dejamos como referencia; ya no lo recomendamos.` : `This venue has closed (${dateLabel(p.closed, lang)}). We keep the card for reference; we no longer recommend it.`)}</p>` : ''}
    <p class="place__meta">${e(typeLabel(p, lang))}${zone ? `, ${e(t(zone.name, lang))}` : ''}</p>
    <div class="ticket__badges">${evidenceBadge(p, ctx, lang)}${scopeBadge(p, lang)}${labelChips(p, lang)}</div>
    ${p.zone_note ? `<p class="small">${e(t(p.zone_note, lang))}</p>` : ''}
    <p class="printrow" hidden><button type="button" class="btn btn--ghost" data-save="${e(p.id)}" data-checked="${e(p.checked_on)}" data-label="${e(ui.saveBtn)}" data-label-saved="${e(ui.savedBtn)}" aria-pressed="false">${e(ui.saveBtn)}</button> <button type="button" class="btn btn--ghost" data-print>${e(ui.printPlan)}</button></p><p class="printnote">${e(ui.printNote(dateLabel(PRINT_DATE, lang)))}</p>
  </header>

  <div class="verdict">
    <div class="verdict__item verdict__item--yes"><h2>${e(ui.fits)}</h2><p>${e(tx.fits)}</p></div>
    <div class="verdict__item verdict__item--no"><h2>${e(ui.notFor)}</h2><p>${e(tx.not_for)}</p></div>
  </div>

  ${labelsBlock(p, lang)}

  <div class="place__grid">
    <div class="place__main">
      <section><h2>${e(ui.order)}</h2><p>${e(tx.order)}</p></section>
      <section><h2>${e(ui.mayDisappoint)}</h2><p>${e(tx.may_disappoint)}</p></section>
      <section><h2>${e(ui.before)}</h2><p>${e(tx.before)}</p></section>
      ${p.reviews ? `<section class="reviews"><h2>${e(ui.reviewsTitle)}</h2>${reviewsBlock(p, ctx, lang)}</section>` : ''}
      <section><h2>${e(ui.offer)}</h2><p>${e(tx.offer)}</p></section>
      ${dvBlock}
      ${(() => { const h = hoursBlock(p, lang); return h ? `<section><h2>${e(ui.hours)}</h2>${h}</section>` : ''; })()}
      ${(() => { const k = kidsBlock(p, lang); return k ? `<section><h2>${e(ui.kids)}</h2>${k}</section>` : ''; })()}
      <section><h2>${e(ui.evidence)}</h2>${evidenceBlock(p, ctx, lang)}</section>
    </div>
    <aside class="place__side">
      ${receipt(p, lang)}
      <div class="mapbox">
        ${p.address ? `<p><strong>${e(ui.address)}:</strong> ${e(p.address)}${p.city && p.city !== 'Valencia' ? `, ${e(p.city)}` : ''}</p>` : `<p>${e(ui.branchPending)}</p>`}
        ${p.address_source ? `<p class="small">${e(ui.addressSource)}: <a href="${e(p.address_source)}" rel="nofollow noopener">${e(new URL(p.address_source).hostname.replace(/^www\./, ''))}</a></p>` : ''}
        <p><a class="btn" href="${e(p.maps.search)}" rel="nofollow noopener">${icon('pin')}<span>${e(ui.maps)}</span></a></p>
        ${p.maps.walk && p.scope === 'valencia' ? `<p><a href="${e(p.maps.walk)}" rel="nofollow noopener">${e(ui.mapsWalk)}</a></p>` : ''}
        <p class="small">${e(ui.mapsNote)}</p>
        <p class="small"><a href="${PATHS.fixes[lang]}?local=${e(p.id)}">${e(ui.fixLink)}</a></p>
      </div>
    </aside>
  </div>

  ${alts.length ? `<section class="block"><h2>${e(ui.altTitle)}</h2><div class="tickets">${alts.map((a) => `<div class="alt"><p class="alt__why">${e(ui.altWhy(a, ctx.data.zoneById[a.place.zone] ? t(ctx.data.zoneById[a.place.zone].name, lang) : '', (x) => money(x, lang)))}</p>${placeCard(a.place, ctx, lang)}</div>`).join('')}</div></section>` : ''}
  ${sameSweet.length ? `<section class="block"><h2>${e(ui.sweetHere)}</h2>
    <div class="tickets">${sameSweet.map((x) => placeCard(x, ctx, lang, { showZone: false })).join('')}</div></section>` : ''}
</article>`;

  const page = pageBase('place', lang, PATHS.place[lang](p.id), PATHS.place[other(lang)](p.id), { indexable: !!p.publication_ready, draft: !p.publication_ready });
  page.title = `${p.name}: ${lang === 'es' ? 'qué pedir, cuánto cuesta y para quién' : 'what to order, what it costs and who it suits'}`;
  page.description = `${tx.offer} ${tx.fits}`.slice(0, 158);
  page.body = body;
  page.crumbs = zone && zonePagesList(ctx).some((z) => z.id === zone.id) ? [{ name: t(zone.name, lang), path: PATHS.zone[lang](zone.id) }, { name: p.name, path: page.path }] : [{ name: p.name, path: page.path }];
  page.bodyClass = 'place';
  return page;
}

// ——— Zona ———
function zonePage(ctx, lang, z) {
  const ui = UI[lang];
  const ps = ctx.data.places.filter((p) => p.zone === z.id);
  const eat = ps.filter(isEatingVenue);
  const sweet = ps.filter((p) => !isEatingVenue(p));
  const body = `
<div class="wrap">
  <h1 class="pagetitle">${e(t(z.name, lang))}</h1>
  <p class="lead">${e(ui.zonePageLead(ps.length))}</p>
  ${z.note ? `<p class="small">${e(t(z.note, lang))}</p>` : ''}
  <p><a class="btn btn--ghost" href="${PATHS.selector[lang]}?zona=${z.id}">${e(ui.zoneSubmit)}</a></p>
  ${eat.length ? `<section class="block"><h2>${e(ui.eatHere)}</h2><div class="tickets">${eat.map((p) => placeCard(p, ctx, lang, { showZone: false })).join('')}</div></section>` : ''}
  ${sweet.length ? `<section class="block"><h2>${e(ui.sweetHere)}</h2><div class="tickets">${sweet.map((p) => placeCard(p, ctx, lang, { showZone: false })).join('')}</div></section>` : ''}
</div>`;
  const page = pageBase('zone', lang, PATHS.zone[lang](z.id), PATHS.zone[other(lang)](z.id), { indexable: false, draft: true });
  page.title = lang === 'es' ? `Dónde comer en ${t(z.name, lang)} (Valencia)` : `Where to eat in ${t(z.name, lang)}, Valencia`;
  page.description = ui.zonePageLead(ps.length);
  page.body = body;
  page.crumbs = [{ name: t(z.name, lang), path: page.path }];
  return page;
}

// ——— Categorías ———
function categoryPage(ctx, lang, c) {
  const ui = UI[lang];
  const sections = c.sections.map((s) => {
    const parts = [`<h2>${e(t(s.heading, lang))}</h2>`];
    if (s.excursion) parts.push(`<p><span class="badge badge--away">${e(ui.excursion)}</span> <span class="badge badge--away">${e(ui.outsideCity)}</span></p>`);
    for (const para of s.body?.[lang] || []) parts.push(`<p>${e(para)}</p>`);
    if (s.figure === 'metamorfosis') {
      parts.push(`<figure class="figure"><img src="/assets/img/metamorfosis-formatos.svg" width="800" height="210" alt="${e(lang === 'es' ? 'Viñeta: chino clásico, wok, buffet sushi y ¿parrilla?' : 'Cartoon: classic Chinese, wok, sushi buffet and… grill?')}"><figcaption>${e(lang === 'es' ? 'Sátira de formatos; no es la biografía de ningún restaurante.' : 'A satire of formats, not the biography of any restaurant.')}</figcaption></figure>`);
    }
    if (s.places?.length) {
      const ps = s.places.map((id) => ctx.data.byId[id]);
      if (s.compare) parts.push(compareTable(ps, ctx, lang));
      parts.push(`<div class="tickets">${ps.map((p) => placeCard(p, ctx, lang)).join('')}</div>`);
    }
    if (s.glossary) parts.push(`<dl class="glossary">${s.glossary.map((g) => `<dt>${e(t(g.term, lang))}</dt><dd>${e(t(g.def, lang))}</dd>`).join('')}</dl>`);
    if (s.awards) {
      const h = lang === 'es' ? ['Entidad premiada', 'Año', 'Ámbito y límite', 'Verificación'] : ['Recipient', 'Year', 'Scope and limits', 'Verification'];
      parts.push(`<div class="compare" role="region" tabindex="0" aria-label="Cacau d’Or"><table><thead><tr>${h.map((x) => `<th scope="col">${e(x)}</th>`).join('')}</tr></thead><tbody>${s.awards.map((a) => `<tr><th scope="row"><a href="${e(a.url)}" rel="nofollow noopener">${e(a.entity)}</a></th><td>${e(t(a.year, lang))}</td><td>${e(t(a.scope, lang))}</td><td>${e(t(a.status, lang))}</td></tr>`).join('')}</tbody></table></div>`);
    }
    if (s.phrases) parts.push(`<table class="phrases"><tbody>${s.phrases.map((ph) => `<tr><td lang="es">${e(ph.es)}</td>${lang === 'en' ? `<td>${e(ph.en)}</td>` : ''}</tr>`).join('')}</tbody></table>`);
    if (s.zones) parts.push(`<ul class="linklist">${s.zones.map((zid) => `<li><a href="${PATHS.zone[lang](zid)}">${e(t(ctx.data.zoneById[zid].name, lang))}</a></li>`).join('')}</ul>`);
    if (s.route) {
      const r = ctx.data.routes.find((x) => x.id === s.route);
      parts.push(`<p><a class="btn btn--ghost" href="${PATHS.route[lang](r.slug[lang])}">${e(t(r.title, lang))}</a></p>`);
    }
    if (s.related_category) {
      const rc = categoryFor(ctx, s.related_category);
      parts.push(`<p><a href="${PATHS.category[lang](rc.slug[lang])}">${e(t(rc.h1, lang))}</a></p>`);
    }
    return `<section class="block">${parts.join('\n')}</section>`;
  });

  const related = (c.related || []).map((id) => categoryFor(ctx, id));
  const body = `
<div class="wrap prose-wide">
  <header class="cat__head">
    <span class="cat__ico">${icon(c.icon)}</span>
    <h1 class="pagetitle">${e(t(c.h1, lang))}</h1>
  </header>
  ${(c.lead[lang] || []).map((p) => `<p class="lead">${e(p)}</p>`).join('')}
  ${sections.join('\n')}
  ${related.length ? `<section class="block"><h2>${e(ui.relatedTitle)}</h2><ul class="linklist">${related.map((r) => `<li><a href="${PATHS.category[lang](r.slug[lang])}">${e(t(r.h1, lang))}</a></li>`).join('')}</ul></section>` : ''}
  <section class="block sources"><h2>${e(ui.sourcesTitle)}</h2><ul>${c.sources.map((s) => `<li><a href="${e(s.url)}" rel="nofollow noopener">${e(s.label)}</a></li>`).join('')}</ul><p class="small">${e(ui.footerResearch)}</p></section>
</div>`;

  const page = pageBase('category', lang, PATHS.category[lang](c.slug[lang]), PATHS.category[other(lang)](c.slug[other(lang)]), { indexable: c.status === 'revisado', draft: c.status !== 'revisado' });
  page.title = t(c.title, lang);
  page.description = t(c.description, lang);
  page.body = body;
  page.crumbs = [{ name: t(c.nav, lang), path: page.path }];
  page.bodyClass = 'category';
  return page;
}

// ——— Familias ———
function familiesPage(ctx, lang) {
  const ui = UI[lang];
  const fam = ctx.data.places.filter((p) => {
    const k = p.kids || {};
    return k.espacio_juego || k.juego_sin_pantallas || (p.tags || []).some((x) => x === 'familia_bebe' || x === 'nino_activo');
  });
  const confirmed = fam.filter((p) => ['declarado', 'contrastado'].includes(p.kids?.juego_sin_pantallas));
  const pending = fam.filter((p) => !confirmed.includes(p));
  const card = (p) => `<article class="famcard">
    <h3><a href="${PATHS.place[lang](p.id)}">${e(p.name)}</a></h3>
    <p class="ticket__meta">${e(typeLabel(p, lang))}, ${e(zoneName(p, ctx, lang))}</p>
    <p>${e(p.text[lang].fits)}</p>
    ${kidsBlock(p, lang, { full: true })}
    <p class="ticket__catch"><strong>${e(ui.catch)}:</strong> ${e(p.text[lang].not_for)}</p>
  </article>`;
  const body = `
<div class="wrap">
  <h1 class="pagetitle">${e(ui.familiesH1)}</h1>
  <p class="lead">${e(ui.familiesLead)}</p>
  <section class="rules block"><h2>${e(ui.familiesRules)}</h2><ul>${ui.familiesRulesList.map((x) => `<li>${e(x)}</li>`).join('')}</ul></section>
  <label class="check famfilter"><input type="checkbox" id="fam-only" data-hide="#fam-pending"> <span>${e(ui.familiesFilter)}</span></label>
  <section class="block" id="fam-confirmed"><h2>${e(ui.familiesConfirmed)} (${confirmed.length})</h2><div class="famgrid">${confirmed.map(card).join('')}</div></section>
  <section class="block" id="fam-pending"><h2>${e(ui.familiesPending)} (${pending.length})</h2><p>${e(ui.familiesPendingLead)}</p><div class="famgrid">${pending.map(card).join('')}</div></section>
  <p><a class="btn btn--ghost" href="${PATHS.selector[lang]}?con=nino_activo&amp;sinpantallas=1">${e(ui.fNoScreens)}</a></p>
</div>`;
  const page = pageBase('families', lang, PATHS.families[lang], PATHS.families[other(lang)], { indexable: false, draft: true });
  page.title = lang === 'es' ? 'Comer con niños en Valencia sin pantallas: juego, edades y coste' : 'Eating out with kids in Valencia without screens: play, ages and cost';
  page.description = ui.familiesLead;
  page.body = body;
  page.crumbs = [{ name: ui.navFamilies, path: page.path }];
  page.navKey = 'families';
  return page;
}

// ——— Rutas ———
// Una ruta completa se bloquea sola si una de sus paradas cierra (#28): vuelve a «Más ideas» hasta revisarla.
const routePlaces = (r) => r.places || r.stops.filter((s) => s.kind === 'place').map((s) => s.place);
export function routeLive(ctx, r) {
  return r.status === 'ejemplo_completo' && routePlaces(r).every((id) => !ctx.data.byId[id]?.closed);
}
function routesIndex(ctx, lang) {
  const ui = UI[lang];
  const complete = ctx.data.routes.filter((r) => routeLive(ctx, r));
  const pending = ctx.data.routes.filter((r) => !routeLive(ctx, r));
  const body = `
<div class="wrap">
  <h1 class="pagetitle">${e(ui.routesH1)}</h1>
  <p class="lead">${e(ui.routesLead)}</p>
  <section class="block"><h2>${e(ui.routeComplete)}</h2>
  ${complete.map((r) => `<article class="teaser"><h3><a href="${PATHS.route[lang](r.slug[lang])}">${e(t(r.title, lang))}</a></h3><p>${e(t(r.summary, lang))}</p></article>`).join('')}
  </section>
  <section class="block"><h2>${e(ui.routePending)}</h2><p>${e(ui.routePendingNote)}</p>
  <ul class="pendlist">${pending.map((r) => `<li><strong>${e(t(r.title, lang))}</strong><span>${routePlaces(r).map((id) => `<a href="${PATHS.place[lang](id)}">${e(ctx.data.byId[id].name)}</a>`).join(', ')}</span><span>${e(t(r.tip || r.summary, lang))}</span></li>`).join('')}</ul></section>
</div>`;
  const page = pageBase('routes', lang, PATHS.routes[lang], PATHS.routes[other(lang)], { indexable: false, draft: true });
  page.title = lang === 'es' ? 'Rutas para comer y pasear en Valencia, con horarios comprobados' : 'Eat-and-stroll routes in Valencia, with checked opening hours';
  page.description = ui.routesLead;
  page.body = body;
  page.crumbs = [{ name: ui.navRoutes, path: page.path }];
  page.navKey = 'routes';
  return page;
}

function routePage(ctx, lang, r) {
  const ui = UI[lang];
  const m = (x) => money(x, lang);
  const byId = ctx.data.byId;
  const table = dayTable(r, byId);
  const rest = byId[r.base_order.place];
  const sweet = byId[r.dessert_options.out.place];
  const fmtDay = (v) => (v === undefined ? ui.unknownDay : Array.isArray(v) && v.length === 0 ? ui.closed : v.map(([a, b]) => `${clock(a)}–${clock(b)}`).join(', '));
  const stay = checkRoute(r, byId, { day: 'sat', arrival: '13:30', dessert: 'stay', dessertQty: 1 });
  const out = checkRoute(r, byId, { day: 'sat', arrival: '13:30', dessert: 'out' });

  const stops = r.stops.map((s, i) => {
    if (s.kind === 'walk') return `<li class="stop stop--walk"><h3>${e(ui.routeWalkStep)}</h3><p>${e(t(s.text, lang))}</p>${r.maps_walk ? `<p><a href="${e(r.maps_walk)}" rel="nofollow noopener">${e(ui.routeOpenMaps)}</a></p>` : ''}</li>`;
    const p = byId[s.place];
    return `<li class="stop"><h3><a href="${PATHS.place[lang](p.id)}">${e(p.name)}</a>${s.optional ? ` <span class="badge">${e(ui.routeOptional)}</span>` : ''}</h3><p>${e(p.text[lang].order)}</p></li>`;
  }).join('');

  const costBlock = (res, label) => `<div class="receipt receipt--small"><p class="rc__title">${e(label)}</p>
    <table class="rc__lines"><tbody>
      <tr${res.cost.base == null ? ' class="is-open"' : ''}><td>${e(rest.name)}: ${e(ui.routeBaseFrom[res.cost.baseFrom](res.cost.party))}${res.cost.baseThirdParty ? ' *' : ''}</td><td class="num">${res.cost.base == null ? ui.unknownMark : m(res.cost.base)}</td></tr>
      <tr${res.cost.dessertKnown ? '' : ' class="is-open"'}><td>${e(res.cost.dessert === 'stay' ? t(r.dessert_options.stay.label, lang) : t(r.dessert_options.out.label, lang))}</td><td class="num">${res.cost.dessertKnown ? m(res.cost.dessertCost) : ui.unknownMark}</td></tr>
    </tbody></table>
    <div class="rc__total"><span>${e(ui.receiptPartial)} ${e(ui.receiptGroup(res.cost.party))}</span><strong class="num">${res.cost.knownTotal == null ? ui.unknownMark : m(res.cost.knownTotal)}</strong></div>
    <div class="rc__pp"><span>${e(ui.receiptPerPerson)}</span><span class="num">${res.cost.perPersonKnown == null ? ui.unknownMark : m(res.cost.perPersonKnown)}</span></div>
    <p class="rc__note">${e(ui.routeDrinksNote)}</p>
    ${res.cost.baseThirdParty ? `<p class="rc__note">* ${e(ui.receiptThirdParty)}</p>` : ''}
  </div>`;

  const body = `
<div class="wrap">
  <h1 class="pagetitle">${e(t(r.title, lang))}</h1>
  <p class="lead">${e(t(r.summary, lang))}</p>
  <p class="printrow" hidden><button type="button" class="btn btn--ghost" data-print>${e(ui.printPlan)}</button></p><p class="printnote">${e(ui.printNote(dateLabel(PRINT_DATE, lang)))}</p>
  <ol class="stops">${stops}</ol>

  <section class="block"><h2>${e(ui.routeWeekTable)}</h2>
  <div class="compare" role="region" tabindex="0" aria-label="${e(ui.routeWeekTable)}"><table><thead><tr><th scope="col">${e(ui.routeDay)}</th><th scope="col">${e(rest.name)}</th><th scope="col">${e(sweet.name)}</th><th scope="col">${e(lang === 'es' ? 'Veredicto' : 'Verdict')}</th></tr></thead>
  <tbody>${table.map((row) => `<tr class="v-${row.verdict}"><th scope="row">${e(DAY_NAMES[lang][row.day])}</th><td>${e(fmtDay(row.rest))}</td><td>${e(fmtDay(row.sweet))}</td><td>${e(ui.routeVerdicts[row.verdict])}</td></tr>`).join('')}</tbody></table></div>
  <p class="small">${e(t(r.caveats, lang))}</p>
  </section>

  <section class="block routecheck" id="routecheck" data-route="${r.id}">
    <h2>${e(ui.routeCheckTitle)}</h2>
    <form class="selector__grid" id="routeform">
      <div class="field"><label for="r-dia">${e(ui.routeDay)}</label><select id="r-dia" name="dia">${DAYS.map((d) => `<option value="${d}"${d === 'sat' ? ' selected' : ''}>${e(DAY_NAMES[lang][d])}</option>`).join('')}</select></div>
      <div class="field"><label for="r-llegada">${e(ui.routeArrival)}</label><input id="r-llegada" name="llegada" type="time" value="13:30" step="900"></div>
      <div class="field"><label for="r-estancia">${e(ui.routeStay)}</label><input id="r-estancia" name="estancia" type="number" min="15" max="300" step="5" inputmode="numeric"></div>
      <div class="field"><label for="r-paseo">${e(ui.routeWalk)}</label><input id="r-paseo" name="paseo" type="number" min="0" max="120" step="1" inputmode="numeric"></div>
      <fieldset class="field field--wide"><legend>${e(ui.routeDessert)}</legend>
        <label class="check"><input type="radio" name="postre" value="out" checked> <span>${e(t(r.dessert_options.out.label, lang))}</span></label>
        <label class="check"><input type="radio" name="postre" value="stay"> <span>${e(t(r.dessert_options.stay.label, lang))}</span></label>
      </fieldset>
    </form>
    <div id="routeresult" aria-live="polite">
      ${out.lastSeated ? `<p>${e(ui.routeLastSeated(out.lastSeated))}</p>` : `<p>${e(ui.routeWarnings.postre_cerrado_ese_dia)}</p>`}
      <p class="small">${e(ui.routeWarnings.sin_estimacion_paseo)}</p>
    </div>
  </section>

  <section class="block"><h2>${e(ui.routeCostTitle)}</h2><p>${e(ui.routeCostNote)}</p>
    <div class="tickets">${costBlock(out, t(r.dessert_options.out.label, lang))}${costBlock(stay, t(r.dessert_options.stay.label, lang))}</div>
  </section>
</div>`;
  const page = pageBase('route', lang, PATHS.route[lang](r.slug[lang]), PATHS.route[other(lang)](r.slug[other(lang)]), { indexable: false, draft: true });
  page.title = t(r.title, lang);
  page.description = t(r.summary, lang);
  page.body = body;
  page.crumbs = [{ name: ui.navRoutes, path: PATHS.routes[lang] }, { name: t(r.title, lang), path: page.path }];
  page.navKey = 'routes';
  page.scripts = [
    `<script type="application/json" id="routedata">${JSON.stringify({ route: r, places: { [rest.id]: { id: rest.id, hours: rest.hours, price: rest.price }, [sweet.id]: { id: sweet.id, hours: sweet.hours, price: sweet.price } } }).replace(/</g, '\\u003c')}</script>`,
    `<script type="module" src="/assets/js/route.js"></script>`,
  ];
  return page;
}

// ——— Financiación ———
function fundingPage(ctx, lang) {
  const ui = UI[lang];
  const f = ctx.data.funding;
  const stmt = statement(f, lang);
  const body = `
<div class="wrap prose">
  <h1 class="pagetitle">${e(ui.fundingH1)}</h1>
  <section class="band band--ink independence independence--page">
    <p class="independence__claim">${e(stmt.headline)}</p>
    <p>${e(stmt.body)}</p>
    ${stmt.body2 ? `<p>${e(stmt.body2)}</p>` : ''}
    <p class="small">${e(ui.fundingSince(dateLabel(f.current.since, lang)))}</p>
  </section>
  <section class="block"><h2>${e(ui.fundingRules)}</h2><ul>${ui.fundingRulesList.map((x) => `<li>${e(x)}</li>`).join('')}</ul></section>
  <section class="block"><h2>${e(ui.fundingRegistry)}</h2>
    ${f.entries.length ? `<table><tbody>${f.entries.map((en) => `<tr><td>${e(en.date)}</td><td>${e(ctx.data.byId[en.place]?.name || en.place)}</td><td>${e(t(f.kinds[en.kind], lang))}</td></tr>`).join('')}</tbody></table>` : `<p>${e(ui.fundingRegistryEmpty)}</p>`}
    <p>${e(lang === 'es' ? 'Si llega, cada apoyo se registrará por separado:' : 'If it happens, each kind of support is recorded separately:')}</p><ul>${Object.values(f.kinds).map((k) => `<li>${e(t(k, lang))}</li>`).join('')}</ul>
  </section>
  <section class="block"><h2>${e(ui.fundingHistory)}</h2><ul>${f.history.map((h) => `<li>${e(dateLabel(h.from, lang))}: ${e(t(h.note, lang))}</li>`).join('')}</ul></section>
  <section class="block invite-strip"><p><a href="${PATHS.invite[lang]}">${e(ui.inviteLinkText)}</a></p><p class="small">${e(ui.inviteLinkSub)}</p></section>
</div>`;
  const page = pageBase('funding', lang, PATHS.funding[lang], PATHS.funding[other(lang)], { indexable: true, draft: false });
  page.title = lang === 'es' ? 'Cómo nos financiamos: quién paga esta guía' : 'How we are funded: who pays for this guide';
  page.description = `${stmt.headline} ${stmt.body}`.slice(0, 158);
  page.body = body;
  page.crumbs = [{ name: ui.navFunding, path: page.path }];
  page.navKey = 'funding';
  return page;
}

function invitePage(ctx, lang) {
  const ui = UI[lang];
  const F = ui.inviteFields;
  const endpoint = ctx.data.funding.proposals.endpoint;
  const field = (name, label, type = 'text', extra = '') => `<div class="field field--wide"><label for="i-${name}">${e(label)}</label>${type === 'textarea' ? `<textarea id="i-${name}" name="${name}" rows="4" required aria-describedby="err-${name}"></textarea>` : `<input id="i-${name}" name="${name}" type="${type}" required ${extra} aria-describedby="err-${name}">`}<p class="err" id="err-${name}"></p></div>`;
  const body = `
<div class="wrap prose">
  <h1 class="pagetitle">${e(ui.inviteH1)}</h1>
  <p class="lead">${e(ui.inviteLead)}</p>
  <p class="notice">${e(ui.inviteNoPay)}</p>
  ${endpoint ? '' : `<p class="notice notice--pending">${e(ui.inviteChannelPending)}</p>`}
  <form id="inviteform" class="inviteform" novalidate data-endpoint="${e(endpoint || '')}">
    ${field('venue', F.venue)}
    ${field('address', F.address)}
    ${field('contact', F.contact, 'text', 'autocomplete="name"')}
    ${field('email', F.email, 'email', 'autocomplete="email"')}
    ${field('what', F.what, 'textarea')}
    <fieldset class="field field--wide"><legend>${e(F.support)}</legend>
      ${Object.entries(ui.inviteSupport).map(([k, v], i) => `<label class="check"><input type="radio" name="support" value="${k}"${i === 0 ? ' checked' : ''}> <span>${e(v)}</span></label>`).join('')}
    </fieldset>
    <div class="field field--wide"><label class="check"><input type="checkbox" name="ack" id="i-ack" required aria-describedby="err-ack"> <span>${e(F.ack)}</span></label><p class="err" id="err-ack"></p></div>
    <button class="btn" type="submit">${e(ui.inviteSubmit)}</button>
  </form>
  <div id="inviteout" aria-live="polite"></div>
</div>`;
  const page = pageBase('invite', lang, PATHS.invite[lang], PATHS.invite[other(lang)], { indexable: true, draft: false });
  page.title = lang === 'es' ? 'Invítanos a tu restaurante: pagas la visita, no el veredicto' : 'Invite us to your restaurant: you fund the visit, not the verdict';
  page.description = ui.inviteLead.slice(0, 158);
  page.body = body;
  page.crumbs = [{ name: ui.navFunding, path: PATHS.funding[lang] }, { name: lang === 'es' ? 'Invítanos' : 'Fund a visit', path: page.path }];
  page.scripts = [`<script type="module" src="/assets/js/invite.js"></script>`];
  return page;
}

function methodPage(ctx, lang) {
  const ui = UI[lang];
  const es = lang === 'es';
  const kinds = Object.entries(ui.evidenceKinds);
  const defs = es
    ? {
        documental: 'Cartas, webs oficiales, guías y artículos consultados con fecha. No implica haber comido allí.',
        visita_propia: 'Comida pagada por nosotros, con ticket. Todavía no hay ninguna.',
        opinion_usuario: 'Reseñas de clientes, con plataforma, fecha relativa y tamaño de la muestra. Una muestra pequeña es una señal, no un patrón.',
        premio_externo: 'Reconocimiento de otra guía o certamen, con año, categoría y entidad premiada. Un premio pasado no prueba el servicio de hoy.',
      }
    : {
        documental: 'Menus, official websites, guides and articles checked on a stated date. It does not mean we ate there.',
        visita_propia: 'A meal we paid for, with a receipt. There are none yet.',
        opinion_usuario: 'Customer reviews, with platform, relative date and sample size. A small sample is a signal, not a pattern.',
        premio_externo: 'Recognition from another guide or award, with year, category and recipient. A past award does not prove today’s service.',
      };
  const neverList = es
    ? ['Visitas, catas o fotos de restaurantes que no hemos hecho.', 'Puntuaciones de sabor sacadas de reseñas.', 'Precios, horarios o servicios infantiles que no constan.', 'Minutos andando: el trayecto lo calcula Maps.', 'Valoraciones con estrellas en datos estructurados.', 'Críticas para parecer independientes.']
    : ['Visits, tastings or restaurant photos we haven’t done.', 'Taste scores derived from reviews.', 'Prices, hours or children’s facilities that aren’t documented.', 'Walking times: Maps calculates the route.', 'Star ratings in structured data.', 'Criticism made up to look independent.'];
  const priceRules = es
    ? ['Mostramos precio por persona y total del grupo.', 'Separamos bebida, pan, postre, café, suplementos, mínimos de raciones y costes infantiles.', 'Solo enseñamos lo que el local publica o lo que cuentan las reseñas; lo que no consta no ocupa sitio en la ficha.', 'Si faltan conceptos por sumar, el total se llama «suma parcial», nunca «total completo».']
    : ['We show price per person and the total for the group.', 'We separate drinks, bread, dessert, coffee, supplements, minimum portions and children’s costs.', 'We only show what the venue publishes or what reviews report; anything not on record takes up no space on the card.', 'If items are left to add, the total is called a “partial total”, never a “full total”.'];
  const rankRules = es
    ? ['Primero se descartan incompatibilidades conocidas: zona, cerrado a la hora de llegada, base por encima del presupuesto, fuera de la ciudad.', '«Sin pantallas» es un requisito duro: los sitios que no lo anuncian salen aparte, con el consejo de preguntarlo.', 'Después se ordena por encaje con el antojo, la compañía y el plan; un sitio del que sabemos más pesa más.', 'Pago, invitación o comisión no forman parte de la fórmula.']
    : ['First we rule out known incompatibilities: area, closed at arrival time, base price above budget, outside the city.', '“No screens” is a hard requirement: places that don’t advertise it are listed separately, with a tip to ask.', 'Then we order by fit with the craving, company and plan; a place we know more about weighs more.', 'Payment, hosting or commission are not part of the formula.'];
  const body = `
<div class="wrap prose">
  <h1 class="pagetitle">${e(ui.methodH1)}</h1>
  <section class="block"><h2>${es ? 'Cuatro tipos de evidencia, siempre separados' : 'Four kinds of evidence, always kept apart'}</h2><dl class="glossary">${kinds.map(([k, v]) => `<dt>${e(v)}</dt><dd>${e(defs[k])}</dd>`).join('')}</dl></section>
  <section class="block"><h2>${es ? 'Cómo explicamos un precio' : 'How we explain a price'}</h2><ul>${priceRules.map((x) => `<li>${e(x)}</li>`).join('')}</ul></section>
  <section class="block"><h2>${es ? 'Cómo ordenamos las recomendaciones' : 'How we order recommendations'}</h2><ul>${rankRules.map((x) => `<li>${e(x)}</li>`).join('')}</ul><p class="small">${e(ui.rulesVersion)}: ${RULES_VERSION}</p></section>
  <section class="block"><h2>${es ? 'Etiquetas francas' : 'Frank labels'}</h2><p>${es ? 'Cada etiqueta lleva motivo, fuente y fecha de revisión. Caduca sola: si no la revisamos a tiempo, desaparece de la ficha. Ninguna se compra.' : 'Every label carries a reason, a source and a review date. It expires on its own: if we don’t review it in time, it disappears from the card. None can be bought.'}</p><dl class="glossary">${Object.values(ctx.data.labels.definitions).map((d) => `<dt><span class="tag tag--${d.tone}">${e(d.name[lang])}</span></dt><dd>${e(d.def[lang])} <span class="small">${e(d.evidence[lang])}</span></dd>`).join('')}</dl></section>
  <section class="block"><h2>${es ? 'Lo que nunca inventamos' : 'What we never invent'}</h2><ul>${neverList.map((x) => `<li>${e(x)}</li>`).join('')}</ul></section>
  <section class="block"><h2>${es ? 'Valencia ciudad y excursiones' : 'Valencia city and day trips'}</h2><p>${es ? 'Los locales del área metropolitana o de excursión (como Fernandet, en Sueca, o Hankook, en Alfafar) llevan su etiqueta y no aparecen en el selector salvo que lo pidas.' : 'Venues in the metro area or on a day trip (such as Fernandet in Sueca, or Hankook in Alfafar) carry their label and are left out of the picker unless you ask for them.'}</p></section>
</div>`;
  const page = pageBase('method', lang, PATHS.method[lang], PATHS.method[other(lang)], { indexable: true, draft: false });
  page.title = es ? 'Cómo trabajamos: evidencias, precios y recomendaciones' : 'How we work: evidence, prices and recommendations';
  page.description = es ? 'Qué es investigación documental, visita propia, opinión de usuario y premio externo, y cómo calculamos precios y recomendaciones.' : 'What documentary research, our own visits, user reviews and outside awards mean, and how we calculate prices and recommendations.';
  page.body = body;
  page.crumbs = [{ name: ui.methodH1, path: page.path }];
  return page;
}

// ——— Mi plan (guardar y compartir sin registro, #24) ———
function savedPage(ctx, lang) {
  const ui = UI[lang];
  const catalog = Object.fromEntries(ctx.data.places.map((p) => [p.id, { name: p.name, url: PATHS.place[lang](p.id), type: typeLabel(p, lang), zone: zoneName(p, ctx, lang), fits: p.text[lang].fits, checked: p.checked_on, maps: p.maps.search }]));
  const body = `
<div class="wrap prose">
  <h1 class="pagetitle">${e(ui.savedH1)}</h1>
  <p class="lead">${e(ui.savedLead)}</p>
  <noscript><p>${e(ui.savedNoJs)}</p></noscript>
  <div id="saved" aria-live="polite"></div>
  <p class="printrow" hidden><button type="button" class="btn btn--ghost" data-print>${e(ui.printPlan)}</button></p>
</div>`;
  const page = pageBase('saved', lang, PATHS.saved[lang], PATHS.saved[other(lang)], { indexable: false, draft: false });
  page.title = ui.savedH1;
  page.description = ui.savedLead;
  page.body = body;
  page.crumbs = [{ name: ui.savedH1, path: page.path }];
  page.navKey = 'saved';
  page.keepQuery = true;
  page.scripts = [
    `<script type="application/json" id="saved-catalog">${JSON.stringify(catalog).replace(/</g, '\\u003c')}</script>`,
    `<script type="application/json" id="saved-ui">${JSON.stringify({ lang, empty: ui.savedEmpty, shared: ui.savedShared, keep: ui.savedKeep, remove: ui.savedRemove, share: ui.savedShare, copied: ui.savedCopied, changed: ui.savedChanged, maps: ui.maps }).replace(/</g, '\\u003c')}</script>`,
    `<script type="module" src="/assets/js/saved.js"></script>`,
  ];
  return page;
}

// ——— Correcciones y registro de cambios (#22) ———
function fixesPage(ctx, lang) {
  const ui = UI[lang];
  const F = ui.fixFields;
  const log = JSON.parse(readFileSync(join(ctx.data.root, 'data/changelog.json'), 'utf8')).entries;
  const opts = [...ctx.data.places].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((p) => `<option value="${e(p.id)}">${e(p.name)}</option>`).join('');
  const body = `
<div class="wrap prose">
  <h1 class="pagetitle">${e(ui.fixH1)}</h1>
  <p class="lead">${e(ui.fixLead)}</p>
  <p class="notice notice--pending">${e(ui.fixChannel)}</p>
  <form id="fixform" class="inviteform" novalidate>
    <div class="field field--wide"><label for="x-place">${e(F.place)}</label><select id="x-place" name="place">${opts}</select></div>
    <div class="field field--wide"><label for="x-what">${e(F.what)}</label><textarea id="x-what" name="what" rows="4" required aria-describedby="err-what"></textarea><p class="err" id="err-what"></p></div>
    <div class="field field--wide"><label for="x-source">${e(F.source)}</label><input id="x-source" name="source" type="url" inputmode="url"></div>
    <fieldset class="field field--wide"><legend>${e(F.who)}</legend>${Object.entries(ui.fixWho).map(([k, v], i) => `<label class="check"><input type="radio" name="who" value="${k}"${i === 0 ? ' checked' : ''}> <span>${e(v)}</span></label>`).join('')}</fieldset>
    <div class="field field--wide"><label for="x-email">${e(F.email)}</label><input id="x-email" name="email" type="email" autocomplete="email" aria-describedby="err-email"><p class="err" id="err-email"></p></div>
    <button class="btn" type="submit">${e(ui.fixSubmit)}</button>
  </form>
  <div id="fixout" aria-live="polite"></div>
  <section class="block"><h2>${e(ui.fixLog)}</h2><p class="small">${e(ui.fixLogLead)}</p><ul>${log.map((x) => `<li><strong>${e(dateLabel(x.date, lang))}</strong>: ${e(x[lang])}</li>`).join('')}</ul></section>
</div>`;
  const page = pageBase('fixes', lang, PATHS.fixes[lang], PATHS.fixes[other(lang)], { indexable: false, draft: false });
  page.title = ui.fixH1;
  page.description = ui.fixLead.slice(0, 158);
  page.body = body;
  page.crumbs = [{ name: ui.fixH1, path: page.path }];
  page.keepQuery = true;
  page.scripts = [`<script type="module" src="/assets/js/fixes.js"></script>`];
  return page;
}

function notFoundPage(ctx, lang) {
  const ui = UI[lang];
  const page = pageBase('404', lang, lang === 'es' ? '/404.html' : '/en/404.html', null, { indexable: false, draft: false });
  page.title = lang === 'es' ? 'Página no encontrada' : 'Page not found';
  page.description = ui.notFound;
  page.body = `<div class="wrap prose"><h1 class="pagetitle">${e(page.title)}</h1><p>${e(ui.notFound)}</p><p><a class="btn" href="${PATHS.home[lang]}">${e(ui.home)}</a> <a class="btn btn--ghost" href="${PATHS.selector[lang]}">${e(ui.navSelector)}</a></p></div>`;
  return page;
}

export function allPages(ctx) {
  const pages = [];
  for (const lang of LANGS) {
    pages.push(homePage(ctx, lang), selectorPage(ctx, lang), familiesPage(ctx, lang), routesIndex(ctx, lang), fundingPage(ctx, lang), invitePage(ctx, lang), methodPage(ctx, lang), savedPage(ctx, lang), fixesPage(ctx, lang), notFoundPage(ctx, lang));
    for (const p of ctx.data.places) pages.push(placePage(ctx, lang, p));
    for (const z of zonePagesList(ctx)) pages.push(zonePage(ctx, lang, z));
    for (const c of ctx.data.categories) pages.push(categoryPage(ctx, lang, c));
    for (const r of ctx.data.routes.filter((x) => routeLive(ctx, x))) pages.push(routePage(ctx, lang, r));
  }
  return pages;
}
