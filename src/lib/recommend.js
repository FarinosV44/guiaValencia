// Recomendador por plan (#6, #7, #15). Reglas versionadas y explicables:
// 1) Excluir incompatibilidades conocidas (zona elegida, cerrado a esa hora, base documentada por encima del presupuesto,
//    fuera de Valencia ciudad salvo que se pida).
// 2) «Sin pantallas» es requisito duro: lo no confirmado no se cuela como cumplimiento; va a «pendientes».
// 3) Ordenar por encaje con razones visibles. La financiación NO interviene (no existe ningún campo de pago en la fórmula).
// 4) Tres opciones —la más ajustada, una alternativa y un descubrimiento— solo si hay candidatos válidos suficientes.
import { statusAt, isClosed } from './hours.js';
import { budgetFit, summarize } from './price.js';

export const RULES_VERSION = '2026-10-24.2';

const SCREEN_FREE_OK = new Set(['declarado', 'contrastado']);

export function isEatingVenue(p) {
  return (p.role || []).includes('comer') && !p.candidate_only && !!p.address;
}

export function screenFreeState(p) {
  const v = p.kids?.juego_sin_pantallas || 'desconocido';
  return SCREEN_FREE_OK.has(v) ? 'confirmado_declarado' : v;
}

function evaluate(p, q) {
  const exclusions = [];
  const reasons = [];
  const limits = [];
  let score = 0;

  if (!q.includeOutside && p.scope !== 'valencia') exclusions.push({ code: 'fuera_ciudad', scope: p.scope });
  if (q.zone && p.zone !== q.zone) exclusions.push({ code: 'zona' });

  let hours = null;
  if (q.day && q.time) {
    hours = statusAt(p.hours, q.day, q.time);
    if (isClosed(hours)) exclusions.push({ code: 'cerrado', reason: hours.reason });
    else if (hours.state === 'abierto') {
      score += 2;
      reasons.push({ code: 'abierto', closes: hours.closes, kitchen: hours.kitchen, partial: hours.partial });
      if (hours.minutesLeft != null && hours.minutesLeft < 60) limits.push({ code: 'cierra_pronto', closes: hours.closes });
    } else if (hours.state === 'solo_llevar') {
      exclusions.push({ code: 'solo_llevar' });
    } else if (hours.state === 'probable') {
      score += 1;
      reasons.push({ code: 'franja_declarada' });
      limits.push({ code: 'horas_sin_confirmar' });
    } else {
      score -= 1;
      limits.push({ code: hours.state === 'contradictorio' ? 'horario_contradictorio' : 'horario_desconocido' });
    }
  }

  const budget = budgetFit(p.price, q.budget ?? null);
  if (budget.state === 'excede') exclusions.push({ code: 'presupuesto', base: budget.base });
  else if (budget.state === 'base_dentro_extras_pendientes') {
    score += 1;
    reasons.push({ code: 'base_en_presupuesto', base: budget.base });
    limits.push({ code: 'extras_pendientes', open: budget.open });
  } else if (budget.state === 'cumple') {
    score += 2;
    reasons.push({ code: 'presupuesto_completo', base: budget.base });
  } else if (budget.state === 'desconocido') {
    // Con presupuesto pedido, un precio desconocido no puede contarse como cumplimiento: va a pendientes.
    limits.push({ code: 'presupuesto_desconocido' });
  }
  const budgetPending = budget.state === 'desconocido';

  const screen = screenFreeState(p);
  let screenPending = false;
  if (q.noScreens) {
    if (screen === 'confirmado_declarado') {
      score += 3;
      reasons.push({ code: 'juego_sin_pantallas_declarado' });
    } else {
      screenPending = true;
    }
  }

  if (q.craving) {
    if ((p.cravings || []).includes(q.craving)) {
      score += 5;
      reasons.push({ code: 'antojo', craving: q.craving });
    } else {
      limits.push({ code: 'otro_antojo', craving: q.craving });
    }
  }

  if (q.company) {
    const kidsCompany = q.company === 'familia_bebe' || q.company === 'nino_activo';
    if ((p.tags || []).includes(q.company)) {
      score += 3;
      reasons.push({ code: 'compania', company: q.company });
    }
    if (kidsCompany) {
      if (p.kids?.espacio_juego === 'declarado') {
        score += 3;
        reasons.push({ code: 'espacio_juego_declarado' });
      } else {
        score -= 1;
        limits.push({ code: 'sin_info_juego' });
      }
    }
  }

  if (q.plan && (p.tags || []).includes(q.plan)) {
    score += 2;
    reasons.push({ code: 'plan', plan: q.plan });
  }

  // Gustos del contrato visual: preferencias, nunca requisitos. Solo puntúan donde la investigación da base.
  for (const like of q.likes || []) {
    if ((p.likes || []).includes(like)) {
      score += 2;
      reasons.push({ code: 'gusto', like });
    }
  }

  // «Sin pantalla en la mesa»: requisito duro. Solo cuenta pedir sin móvil declarado o contrastado.
  const phonePending = !!q.noPhone && !SCREEN_FREE_OK.has(p.kids?.pedir_sin_movil || 'desconocido');

  if (p.reviews_sample) score += 0.5;
  if (p.price?.per_adult_base == null && q.budget == null) score -= 0.5;

  const ps = summarize(p.price);
  if (p.price?.includes?.postre === 'incluido') reasons.push({ code: 'postre_incluido' });

  const pendingReasons = [...(screenPending ? ['sin_pantallas'] : []), ...(phonePending ? ['pedir_sin_movil'] : []), ...(budgetPending ? ['presupuesto'] : [])];
  return { place: p, score, exclusions, reasons, limits, screenPending, pendingReasons, hours, priceSummary: ps };
}

function isDiscovery(p) {
  return (p.tags || []).includes('descubrimiento') || (p.cravings || []).includes('nuevo');
}

export function recommend(places, query) {
  const q = { adults: 2, kids: 0, ...query };
  const evaluated = places.filter(isEatingVenue).map((p) => evaluate(p, q));

  const valid = evaluated.filter((e) => e.exclusions.length === 0 && e.pendingReasons.length === 0);
  const pending = evaluated.filter((e) => e.exclusions.length === 0 && e.pendingReasons.length > 0);
  const excluded = evaluated.filter((e) => e.exclusions.length > 0);

  const byScore = (a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'es');
  valid.sort(byScore);
  pending.sort(byScore);

  const picks = [];
  if (valid[0]) picks.push({ slot: 'ajustada', ...valid[0] });
  const rest = valid.slice(1);
  const discovery = rest.find((e) => isDiscovery(e.place));
  const alternative = rest.find((e) => e !== discovery);
  if (alternative) picks.push({ slot: 'alternativa', ...alternative });
  if (discovery) picks.push({ slot: 'descubrimiento', ...discovery });
  else if (rest[1]) picks.push({ slot: 'otra', ...rest.find((e) => e !== alternative) });

  const exclusionCounts = {};
  for (const e of excluded) for (const x of e.exclusions) exclusionCounts[x.code] = (exclusionCounts[x.code] || 0) + 1;

  const suggestions = [];
  if (picks.length < 3) {
    if (q.zone && exclusionCounts.zona) suggestions.push('quitar_zona');
    if (exclusionCounts.cerrado || exclusionCounts.solo_llevar) suggestions.push('cambiar_hora');
    if (exclusionCounts.presupuesto) suggestions.push('subir_presupuesto');
    if (pending.length) suggestions.push('ver_pendientes');
    if (q.craving) suggestions.push('quitar_antojo');
    if (!q.includeOutside && exclusionCounts.fuera_ciudad) suggestions.push('incluir_fuera');
  }

  return {
    rulesVersion: RULES_VERSION,
    query: q,
    picks,
    enough: picks.length >= 3,
    validCount: valid.length,
    pending: pending.slice(0, 6),
    exclusionCounts,
    suggestions,
  };
}

// Continuación dulce en la misma zona (#13). Si la comida ya incluye postre, se dice antes de sugerir gasto.
export function continuation(places, pick, query) {
  if (!pick) return null;
  const p = pick.place;
  const dessertIncluded = p.price?.includes?.postre === 'incluido';
  const sweet = places.filter((x) => (x.role || []).includes('postre') && x.zone === p.zone && x.id !== p.id);
  return {
    dessertIncluded,
    options: sweet.map((s) => ({ place: s, hoursKnown: !!s.hours?.weekly, day: query?.day ?? null })),
  };
}
