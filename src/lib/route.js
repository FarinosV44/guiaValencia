// Comprobación de rutas restaurante → paseo → postre (#12, #13, #16).
// No inventamos minutos andando: si el usuario no introduce su estimación (p. ej. la de Maps),
// solo calculamos la última hora útil para llegar a la parada dulce.
import { DAYS, toMinutes, fromMinutes } from './format.js';
import { statusAt } from './hours.js';
import { exampleTotal } from './price.js';

export function dayTable(route, placesById) {
  const rest = placesById[route.stops.find((s) => s.kind === 'place' && s.role === 'comer').place];
  const sweetStop = route.stops.find((s) => s.kind === 'place' && s.role === 'postre');
  const sweet = sweetStop ? placesById[sweetStop.place] : null;
  return DAYS.map((day) => {
    const r = rest.hours?.weekly?.[day];
    const s = sweet?.hours?.weekly?.[day];
    const restOpen = Array.isArray(r) && r.length > 0;
    const sweetOpen = Array.isArray(s) && s.length > 0;
    let verdict;
    if (!restOpen) verdict = r === undefined ? 'restaurante_desconocido' : 'restaurante_cerrado';
    else if (!sweet) verdict = 'solo_restaurante';
    else if (!sweetOpen) verdict = s === undefined ? 'postre_desconocido' : 'solo_quedarse';
    else verdict = 'ambas';
    return { day, rest: r, sweet: s, verdict };
  });
}

export function lastSeatedArrival(sweet, day) {
  const s = sweet.hours?.weekly?.[day];
  if (!Array.isArray(s) || s.length === 0) return null;
  const last = s[s.length - 1];
  const takeaway = sweet.hours.takeaway_only_last_min || 0;
  return fromMinutes(toMinutes(last[1]) - takeaway);
}

export function checkRoute(route, placesById, { day, arrival, stayMin = null, walkMin = null, dessert = 'out', dessertQty = 1 }) {
  const restStop = route.stops.find((s) => s.kind === 'place' && s.role === 'comer');
  const sweetStop = route.stops.find((s) => s.kind === 'place' && s.role === 'postre');
  const rest = placesById[restStop.place];
  const sweet = sweetStop ? placesById[sweetStop.place] : null;

  const restStatus = statusAt(rest.hours, day, arrival);
  const result = { day, arrival, restStatus, sweetStatus: null, sweetEta: null, lastSeated: null, warnings: [] };

  if (restStatus.state !== 'abierto') result.warnings.push('restaurante_no_abierto');

  if (sweet && dessert === 'out') {
    result.lastSeated = lastSeatedArrival(sweet, day);
    if (!result.lastSeated) result.warnings.push('postre_cerrado_ese_dia');
    if (stayMin != null && walkMin != null && restStatus.state === 'abierto') {
      const eta = fromMinutes(toMinutes(arrival) + Number(stayMin) + Number(walkMin));
      result.sweetEta = eta;
      result.sweetStatus = statusAt(sweet.hours, day, eta);
      if (result.sweetStatus.state === 'solo_llevar') result.warnings.push('postre_solo_llevar');
      else if (result.sweetStatus.state !== 'abierto') result.warnings.push('postre_cerrado_a_esa_hora');
    } else {
      result.warnings.push('sin_estimacion_paseo');
    }
  }

  // Coste: el pedido base del restaurante + UN postre (dentro o fuera), nunca los dos.
  const base = exampleTotal(rest.price.example);
  const party = rest.price.example?.party ?? 2;
  let dessertCost = null;
  let dessertKnown = false;
  if (dessert === 'stay') {
    const opt = route.dessert_options.stay;
    dessertCost = opt.amount * dessertQty;
    dessertKnown = true;
  } else if (dessert === 'out') {
    dessertKnown = route.dessert_options.out.amount != null;
    dessertCost = dessertKnown ? route.dessert_options.out.amount * dessertQty : null;
  }
  result.cost = {
    base,
    party,
    dessert,
    dessertCost,
    dessertKnown,
    knownTotal: base + (dessertKnown ? dessertCost : 0),
    perPersonKnown: (base + (dessertKnown ? dessertCost : 0)) / party,
    pending: ['bebida', 'pan', ...(dessertKnown ? [] : ['postre_fuera'])],
    complete: false,
  };
  return result;
}
