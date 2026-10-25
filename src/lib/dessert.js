// ¿Postre aquí o fuera? (#13). Microveredicto documental: nunca dos dulces por sistema, nunca sabor sin cata.
import { isEatingVenue } from './recommend.js';

export function dessertVerdict(place, places) {
  if (!isEatingVenue(place)) return null;
  const included = place.price?.includes?.postre === 'incluido';
  const line = (place.price?.lines || []).find((l) => l.unit === 'postre');
  const sweet = places.filter((x) => x.id !== place.id && x.zone && x.zone === place.zone && (x.role || []).includes('postre'));
  const sweetInfo = sweet.map((s) => ({ place: s, hoursKnown: s.hours?.status === 'documentado' }));
  if (included) return { kind: 'quedate', sweet: sweetInfo };
  if (line && sweet.length) return { kind: 'elige', line, sweet: sweetInfo };
  if (line) return { kind: 'aqui', line, sweet: [] };
  if (sweet.length) return { kind: 'fuera', sweet: sweetInfo };
  return { kind: 'sin_dato', sweet: [] };
}
