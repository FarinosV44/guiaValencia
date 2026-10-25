// Formato por idioma. Mismo dato, presentación local: ES «12,50 €», EN «€12.50».
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_NAMES = {
  es: { mon: 'lunes', tue: 'martes', wed: 'miércoles', thu: 'jueves', fri: 'viernes', sat: 'sábado', sun: 'domingo' },
  en: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
};

export const DAY_SHORT = {
  es: { mon: 'L', tue: 'M', wed: 'X', thu: 'J', fri: 'V', sat: 'S', sun: 'D' },
  en: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' },
};

export function money(amount, lang) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '';
  const rounded = Math.round(amount * 100) / 100;
  const hasCents = Math.abs(rounded % 1) > 0.001;
  const opts = { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 };
  if (lang === 'en') return '€' + rounded.toLocaleString('en-GB', opts);
  return rounded.toLocaleString('es-ES', { ...opts, useGrouping: rounded >= 10000 }) + ' €';
}

// Horas en formato 24 h para ambos idiomas (explicación inequívoca, #42). «24:30» se muestra como «00:30».
export function clock(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const hh = h >= 24 ? h - 24 : h;
  return String(hh).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function dateLabel(iso, lang) {
  const [y, mo, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function t(obj, lang) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] ?? '';
}
