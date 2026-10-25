// Comprobador de ruta: recalcula horario y coste al cambiar día, llegada, estimaciones o dónde va el postre.
import { UI } from './i18n.js';
import { checkRoute } from './lib/route.js';
import { money, escapeHtml as e } from './lib/format.js';

const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
const ui = UI[lang];
const { route, places } = JSON.parse(document.getElementById('routedata').textContent);
const form = document.getElementById('routeform');
const out = document.getElementById('routeresult');

function update() {
  const fd = new FormData(form);
  const num = (k) => (fd.get(k) === '' || fd.get(k) == null ? null : Number(fd.get(k)));
  const res = checkRoute(route, places, {
    day: fd.get('dia'),
    arrival: fd.get('llegada') || '13:30',
    stayMin: num('estancia'),
    walkMin: num('paseo'),
    dessert: fd.get('postre'),
    dessertQty: 1,
  });
  const lines = [];
  if (res.lastSeated) lines.push(`<p>${e(ui.routeLastSeated(res.lastSeated))}</p>`);
  if (res.sweetEta) lines.push(`<p>${e(ui.routeEta(res.sweetEta))}</p>`);
  for (const w of res.warnings) lines.push(`<p class="${w === 'sin_estimacion_paseo' ? 'small' : 'pick__catch'}">${e(ui.routeWarnings[w])}</p>`);
  if (!res.warnings.some((w) => w !== 'sin_estimacion_paseo') && (res.sweetEta || fd.get('postre') === 'stay')) {
    lines.push(`<p><strong>${e(ui.routeVerdicts.ambas)}</strong></p>`);
  }
  const c = res.cost;
  const fmt = (x) => (x == null ? ui.unknownMark : money(x, lang));
  lines.push(`<p class="num">${e(ui.receiptPartial)} ${e(ui.receiptGroup(c.party))}: ${fmt(c.knownTotal)} (${fmt(c.perPersonKnown)} ${e(ui.receiptPerPerson)}). ${e(ui.receiptNotFull)}</p>`);
  out.innerHTML = lines.join('');
}

form.addEventListener('input', update);
form.addEventListener('change', update);
update();
