// Calendario: día de la semana de una fecha y festivos (#16). Fechas ISO (AAAA-MM-DD) en Europe/Madrid;
// se calculan en UTC a mediodía para que el cambio de hora no desplace el día.
import { DAYS } from './format.js';

export function dayOfDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const js = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0 = domingo
  return DAYS[(js + 6) % 7];
}

// Devuelve { known, holiday, localUnknown }:
// - known: hay calendario cargado para ese año.
// - holiday: { date, name, kind } si es festivo en Valencia ciudad (o común), si no null.
// - localUnknown: fuera de Valencia ciudad solo conocemos los festivos comunes.
export function holidayInfo(festivos, iso, { scope = 'valencia' } = {}) {
  const year = festivos?.years?.[iso.slice(0, 4)];
  if (!year) return { known: false, holiday: null, localUnknown: true };
  const common = year.comunes.find((h) => h.date === iso);
  if (common) return { known: true, holiday: { ...common, kind: 'comun' }, localUnknown: false };
  if (scope !== 'valencia') return { known: true, holiday: null, localUnknown: true };
  const local = (year.locales.valencia || []).find((h) => h.date === iso);
  return { known: true, holiday: local ? { ...local, kind: 'local' } : null, localUnknown: false };
}
