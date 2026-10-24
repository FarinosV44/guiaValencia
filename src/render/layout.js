// Estructura común: <head> con canonical por versión, hreflang recíproco solo entre versiones indexables,
// robots noindex para borradores, cabecera con logo + nombre en texto HTML y pie con la declaración vigente.
import { escapeHtml as e } from '../lib/format.js';
import { SITE, UI, PATHS } from '../i18n.js';
import { statement } from '../lib/funding.js';

export const ORIGIN = 'https://example.invalid'; // Sin dominio decidido (#2): el build usa SITE_ORIGIN si se define.

export function abs(origin, path) {
  return origin.replace(/\/$/, '') + path;
}

function hreflangLinks(page, origin) {
  if (!page.indexable || !page.alt || !page.altIndexable) return '';
  const own = `<link rel="alternate" hreflang="${page.lang}" href="${abs(origin, page.path)}">`;
  const other = page.lang === 'es' ? 'en' : 'es';
  const alt = `<link rel="alternate" hreflang="${other}" href="${abs(origin, page.alt)}">`;
  return page.lang === 'es' ? own + '\n' + alt : alt + '\n' + own;
}

function breadcrumbs(page, lang) {
  if (!page.crumbs?.length) return '';
  const items = [{ name: UI[lang].home, path: PATHS.home[lang] }, ...page.crumbs];
  const li = items
    .map((c, i) => (i === items.length - 1 ? `<li><span aria-current="page">${e(c.name)}</span></li>` : `<li><a href="${c.path}">${e(c.name)}</a></li>`))
    .join('');
  return `<nav class="crumbs" aria-label="${e(UI[lang].breadcrumb)}"><ol>${li}</ol></nav>`;
}

export function breadcrumbJsonLd(page, lang, origin) {
  if (!page.crumbs?.length) return null;
  const items = [{ name: UI[lang].home, path: PATHS.home[lang] }, ...page.crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(origin, c.path) })),
  };
}

export function layout(page, ctx) {
  const { lang } = page;
  const ui = UI[lang];
  const site = SITE[lang];
  const origin = ctx.origin;
  const stmt = statement(ctx.data.funding, lang);
  const robots = page.indexable ? 'index,follow' : 'noindex,follow';
  const jsonld = [...(page.jsonld || [])];
  const bc = breadcrumbJsonLd(page, lang, origin);
  if (bc && page.indexable) jsonld.push(bc);
  const otherLang = lang === 'es' ? 'en' : 'es';
  const switchHref = page.alt || PATHS.home[otherLang];

  const nav = [
    [PATHS.selector[lang], ui.navSelector, 'selector'],
    [PATHS.families[lang], ui.navFamilies, 'families'],
    [PATHS.routes[lang], ui.navRoutes, 'routes'],
    [PATHS.funding[lang], ui.navFunding, 'funding'],
  ]
    .map(([href, label, key]) => `<li><a href="${href}"${page.navKey === key ? ' aria-current="page"' : ''}>${e(label)}</a></li>`)
    .join('');

  return `<!doctype html>
<html lang="${site.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(page.title)}</title>
<meta name="description" content="${e(page.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${abs(origin, page.path)}">
${hreflangLinks(page, origin)}
<meta property="og:title" content="${e(page.title)}">
<meta property="og:description" content="${e(page.description)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:type" content="website">
<meta property="og:url" content="${abs(origin, page.path)}">
<meta property="og:image" content="${abs(origin, '/assets/img/logo-512.png')}">
<meta name="theme-color" content="#260421">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/logo-180.png">
<link rel="stylesheet" href="/assets/css/site.css">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="page-${page.bodyClass || 'default'}">
<a class="skip" href="#main">${e(ui.skip)}</a>
<header class="masthead">
  <div class="wrap masthead__row">
    <a class="brand" href="${PATHS.home[lang]}">
      <img src="/assets/img/logo-96.png" srcset="/assets/img/logo-96.png 1x, /assets/img/logo-192.png 2x" width="48" height="48" alt="">
      <span class="brand__name">${e(site.name)}</span>
    </a>
    <a class="lang" href="${switchHref}" hreflang="${otherLang}" lang="${otherLang}" data-keep-query="${page.keepQuery ? '1' : ''}">${e(ui.langSwitch)}</a>
  </div>
  <nav class="wrap mainnav" aria-label="${e(ui.menu)}"><ul>${nav}</ul></nav>
</header>
${page.draft ? `<div class="draftbar" role="note"><div class="wrap">${e(ui.draftBanner)}</div></div>` : ''}
<main id="main" tabindex="-1">
<div class="wrap">${breadcrumbs(page, lang)}</div>
${page.body}
</main>
<footer class="foot">
  <div class="wrap foot__grid">
    <div>
      <p class="foot__claim">${e(stmt.headline)}</p>
      <p>${e(ui.footerResearch)}</p>
      <p><a href="${PATHS.funding[lang]}">${e(ui.independenceLink)}</a></p>
      <p><a href="${PATHS.invite[lang]}">${e(ui.inviteLinkText)}</a></p>
    </div>
    <div>
      <p><a href="${PATHS.method[lang]}">${e(ui.methodH1)}</a></p>
      <p class="foot__muted">${e(ui.footerLegal)}</p>
    </div>
  </div>
</footer>
<script type="module" src="/assets/js/site.js"></script>
${(page.scripts || []).map((s) => s).join('\n')}
</body>
</html>
`;
}
