// Comportamiento común, mejora progresiva: sin JS todo sigue siendo navegable.
// 1) El cambio de idioma conserva filtros y plan (#42).
const lang = document.querySelector('a.lang[data-keep-query="1"]');
if (lang) {
  lang.addEventListener('click', () => {
    if (location.search) lang.href = lang.getAttribute('href').split('?')[0] + location.search;
  });
}

// 2) Familias: ocultar pendientes cuando se exige juego sin pantallas confirmado.
for (const box of document.querySelectorAll('input[data-hide]')) {
  const target = document.querySelector(box.dataset.hide);
  const sync = () => { if (target) target.hidden = box.checked; };
  box.addEventListener('change', sync);
  sync();
}

// 3) Imprimir o guardar en PDF: el botón solo aparece con JavaScript.
for (const btn of document.querySelectorAll('[data-print]')) {
  btn.closest('[hidden]')?.removeAttribute('hidden');
  btn.addEventListener('click', () => window.print());
}

// 4) Guardar en «Mi plan» (#24): solo en este navegador, sin cuenta ni envío.
export const STORE_KEY = 'dcv-mi-plan';
export function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}
export function writeSaved(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch { return false; }
}
for (const btn of document.querySelectorAll('[data-save]')) {
  const id = btn.dataset.save;
  const paint = () => {
    const on = readSaved().some((x) => x.id === id);
    btn.textContent = on ? btn.dataset.labelSaved : btn.dataset.label;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
  btn.closest('[hidden]')?.removeAttribute('hidden');
  btn.addEventListener('click', () => {
    const list = readSaved();
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list.splice(i, 1); else list.push({ id, checked: btn.dataset.checked, savedOn: new Date().toISOString().slice(0, 10) });
    writeSaved(list);
    paint();
  });
  paint();
}

// 5) Copiar el enlace de una búsqueda o plan: solo al pulsar, nunca se envía nada.
export async function copyLink(url, statusEl, msg) {
  try { await navigator.clipboard.writeText(url); } catch {
    const ta = document.createElement('textarea'); ta.value = url; document.body.append(ta); ta.select();
    try { document.execCommand('copy'); } catch {} ta.remove();
  }
  if (statusEl) statusEl.textContent = msg;
}

// 6) Medición de decisiones útiles (#27), privada por diseño (#25):
//    - Solo eventos con valores de una lista cerrada (zona, antojo, compañía, plan, tramo de presupuesto, id de local).
//    - Nunca texto libre, coordenadas, edades ni identificadores de persona. Sin cookies.
//    - Sin proveedor configurado (data/site.json → metrics_endpoint = null) no se envía nada.
const ENDPOINT = document.querySelector('script[data-metrics]')?.dataset.metrics || '';
const ALLOWED = new Set(['zona', 'antojo', 'con', 'plan', 'presupuesto', 'local', 'ruta', 'respuesta', 'lang', 'pagina']);
export function track(event, props = {}) {
  if (!ENDPOINT) return;
  const clean = { e: String(event).slice(0, 40), lang: document.documentElement.lang, pagina: location.pathname };
  for (const [k, v] of Object.entries(props)) if (ALLOWED.has(k) && v != null && /^[a-z0-9_-]{1,40}$/i.test(String(v))) clean[k] = String(v);
  try { navigator.sendBeacon(ENDPOINT, JSON.stringify(clean)); } catch {}
}
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a[href*="google.com/maps"]');
  if (a) track('maps', { local: location.pathname.split('/').filter(Boolean).pop() });
  const s = ev.target.closest('[data-save]');
  if (s) track('guardar', { local: s.dataset.save });
});
