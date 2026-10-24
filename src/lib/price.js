// Desglose de precio (#8). Regla central: un importe con extras desconocidos NUNCA es «precio completo».
export const COMPONENTS = ['bebida', 'pan', 'postre', 'cafe', 'suplementos'];

// Estados que no dejan dinero sin contar.
const SETTLED = new Set(['incluido', 'en_ejemplo', 'no_aplica']);
// Estados que dejan un coste pendiente (importe desconocido).
const OPEN_COST = new Set(['aparte', 'obligatoria_aparte', 'desconocido']);

export function componentStatus(price, key) {
  const v = price?.includes?.[key];
  return v || 'desconocido';
}

export function exampleTotal(example) {
  if (!example || !Array.isArray(example.items) || example.items.length === 0) return null;
  return example.items.reduce((sum, it) => sum + it.qty * it.amount, 0);
}

export function summarize(price) {
  const p = price || {};
  const total = exampleTotal(p.example);
  const party = p.example?.party ?? null;
  const components = COMPONENTS.map((key) => ({ key, status: componentStatus(p, key) }));
  const open = components.filter((c) => OPEN_COST.has(c.status));
  const knownExtras = components.filter((c) => c.status === 'aparte_conocido');
  const compulsoryUnknown = components.filter((c) => c.status === 'obligatoria_aparte');
  const hasAnyAmount = p.per_adult_base != null || total != null || (p.lines || []).length > 0;
  const baseConfirmed = p.base_confirmed !== false && !(p.lines || []).some((l) => l.third_party);

  // Completo solo si: hay pedido sumado, todo componente está resuelto, sin extras conocidos fuera de la suma,
  // importes de fuente propia del local y sin mínimos/costes infantiles abiertos.
  const complete =
    total != null &&
    open.length === 0 &&
    knownExtras.length === 0 &&
    baseConfirmed &&
    components.every((c) => SETTLED.has(c.status));

  let label = 'sin_precio';
  if (complete) label = 'completo';
  else if (hasAnyAmount) label = 'parcial';

  return {
    label,
    complete,
    base: p.per_adult_base ?? null,
    baseConfirmed,
    basis: p.basis ?? null,
    exampleTotal: total,
    exampleParty: party,
    perPerson: total != null && party ? total / party : null,
    components,
    openComponents: open.map((c) => c.key),
    compulsoryUnknown: compulsoryUnknown.map((c) => c.key),
    knownExtras: knownExtras.map((c) => c.key),
  };
}

// Base efectiva según el día (#16): festivo > día de la semana > base general. Un override null significa
// «para ese día no hay precio documentado» (p. ej. un menú solo de laborables).
export function effectiveBase(price, ctx = {}) {
  const o = price?.base_overrides || {};
  if (ctx.holiday && 'festivo' in o) return o.festivo;
  if (ctx.day && ctx.day in o) return o[ctx.day];
  return price?.per_adult_base ?? null;
}

// Encaje con presupuesto por persona. «cumple» solo existe cuando el precio es completo (#7: no marcar
// como dentro de presupuesto una opción con extras obligatorios desconocidos).
export function budgetFit(price, budgetPerPerson, ctx = {}) {
  if (budgetPerPerson == null) return { state: 'sin_filtro' };
  const s = summarize(price);
  const base = effectiveBase(price, ctx);
  const changed = base !== (price?.per_adult_base ?? null);
  if (base == null) return { state: 'desconocido', dayRule: changed };
  if (base > budgetPerPerson) return { state: 'excede', base, dayRule: changed };
  if (s.complete) return { state: 'cumple', base, dayRule: changed };
  return { state: 'base_dentro_extras_pendientes', base, open: s.openComponents, dayRule: changed };
}

// Banda de precio para navegación. Basada en la base documentada; los extras siguen aparte.
export const BANDS = [
  { id: 'hasta-15', max: 15 },
  { id: '15-30', min: 15, max: 30 },
  { id: '30-60', min: 30, max: 60 },
  { id: 'mas-60', min: 60 },
];

export function bandOf(price) {
  const b = price?.per_adult_base;
  if (b == null) return 'pendiente';
  const band = BANDS.find((x) => b <= (x.max ?? Infinity));
  return band.id;
}
