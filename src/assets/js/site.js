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
