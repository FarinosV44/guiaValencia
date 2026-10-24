// Escenarios de aceptación de #26 con los datos reales del catálogo, y lógica de precio/horario/ruta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../src/data.js';
import { recommend, continuation } from '../src/lib/recommend.js';
import { summarize, budgetFit, exampleTotal } from '../src/lib/price.js';
import { statusAt } from '../src/lib/hours.js';
import { dayTable, checkRoute } from '../src/lib/route.js';
import { money } from '../src/lib/format.js';

const data = loadData();
const P = data.places;

function noHardViolations(res) {
  for (const pick of res.picks) assert.deepEqual(pick.exclusions, [], pick.place.id);
}

test('precio: suma de ejemplo, por persona y etiqueta parcial', () => {
  const s = summarize(data.byId.anyora.price);
  assert.equal(s.exampleTotal, 39);
  assert.equal(s.perPerson, 19.5);
  assert.equal(s.label, 'parcial');
  assert.ok(s.openComponents.includes('bebida'));
});

test('precio: «completo» solo cuando no queda nada desconocido', () => {
  const base = { per_adult_base: 10, example: { party: 2, items: [{ qty: 2, amount: 10 }] } };
  assert.equal(summarize({ ...base, includes: { bebida: 'incluido', pan: 'no_aplica', postre: 'incluido', cafe: 'incluido', suplementos: 'no_aplica' } }).complete, true);
  assert.equal(summarize({ ...base, includes: { bebida: 'aparte', pan: 'no_aplica', postre: 'incluido', cafe: 'incluido', suplementos: 'no_aplica' } }).complete, false);
  assert.equal(summarize({ ...base, includes: {} }).complete, false);
});

test('precio: un arroz a 25 €/ración con mínimo dos son 50 €, no 25 €', () => {
  assert.equal(exampleTotal({ party: 2, items: [{ qty: 2, amount: 25 }] }), 50);
});

test('presupuesto: nunca «cumple» con extras obligatorios desconocidos', () => {
  const f = budgetFit(data.byId['aoyama-joaquin'].price, 30);
  assert.equal(f.state, 'base_dentro_extras_pendientes');
  assert.ok(f.open.includes('bebida'));
  assert.equal(budgetFit(data.byId.nozomi.price, 30).state, 'excede');
  assert.equal(budgetFit(data.byId.principal.price, 30).state, 'desconocido');
});

test('formato de moneda por idioma', () => {
  assert.equal(money(12.5, 'es'), '12,50 €');
  assert.equal(money(12.5, 'en'), '€12.50');
  assert.equal(money(39, 'es'), '39 €');
});

test('horario: hora de llegada, no «abierto ahora»', () => {
  const g = data.byId.gelatica.hours;
  assert.equal(statusAt(g, 'wed', '17:00').state, 'abierto');
  assert.equal(statusAt(g, 'wed', '17:45').state, 'solo_llevar');
  assert.equal(statusAt(g, 'wed', '21:00').state, 'cerrado');
  assert.equal(statusAt(g, 'mon', '12:00').state, 'cerrado');
  assert.equal(statusAt(data.byId.kuzina.hours, 'fri', '21:00').state, 'contradictorio');
  assert.equal(statusAt(data.byId.negri.hours, 'sun', '21:00').state, 'cerrado');
  assert.equal(statusAt(data.byId.negri.hours, 'sun', '14:00').state, 'probable');
  assert.equal(statusAt(data.byId.principal.hours, 'tue', '21:30').state, 'cerrado');
  assert.equal(statusAt(data.byId.principal.hours, 'mon', '24:00').state, 'abierto');
});

test('A) dos personas, asiático, 30 € por persona (60 € total), algo distinto', () => {
  const res = recommend(P, { craving: 'asiatico', budget: 30, company: 'pareja' });
  noHardViolations(res);
  assert.ok(res.picks.length >= 3);
  assert.ok(!res.picks.some((p) => p.place.id === 'nozomi'), 'omakase 70 € excluido');
  for (const p of res.picks) assert.ok(p.place.price.per_adult_base <= 30);
  assert.ok(res.picks.slice(0, 2).every((p) => p.place.cravings.includes('asiatico')));
  assert.ok(res.picks.some((p) => p.slot === 'descubrimiento'));
});

test('B) dos adultos con bebé, sin pantallas: solo juego sin pantallas declarado', () => {
  const res = recommend(P, { company: 'familia_bebe', noScreens: true });
  noHardViolations(res);
  assert.ok(res.picks.length > 0);
  for (const p of res.picks) assert.ok(['declarado', 'contrastado'].includes(p.place.kids.juego_sin_pantallas), p.place.id);
  assert.ok(res.pending.some((p) => p.place.id === 'linaje'), 'Linaje queda pendiente, no como cumplimiento');
  assert.ok(!res.picks.some((p) => p.place.id === 'ola'), 'libros citados por terceros no cuentan');
});

test('C) niño de 3 años activo, cero pantallas, sábado a mediodía', () => {
  const res = recommend(P, { company: 'nino_activo', noScreens: true, day: 'sat', time: '13:30' });
  noHardViolations(res);
  const ids = res.picks.map((p) => p.place.id).sort();
  assert.deepEqual(ids, ['gato', 'petit']);
  assert.equal(res.enough, false);
});

test('D) zona actual con tapas: se queda en la zona y explica la escasez', () => {
  const res = recommend(P, { zone: 'carmen', craving: 'tapas' });
  noHardViolations(res);
  assert.ok(res.picks.every((p) => p.place.zone === 'carmen'));
  assert.equal(res.picks[0].place.id, 'rentaora');
});

test('E) paella con encargo y mínimo: domingo Casa Carmela excluida; Pepica muestra mínimo de 2', () => {
  const res = recommend(P, { craving: 'arroz', day: 'sun', time: '14:00' });
  assert.ok(!res.picks.some((p) => p.place.id === 'carmela'));
  assert.match(data.byId.pepica.price.minimum.es, /mínimo 2 raciones/);
  assert.match(data.byId.carmela.price.minimum.es, /24 h/);
});

test('F) cena → heladería: Gelática no encaja de noche; la ruta lo detecta', () => {
  const r = data.routes.find((x) => x.id === 'R09');
  const res = checkRoute(r, data.byId, { day: 'fri', arrival: '21:00', stayMin: 90, walkMin: 10, dessert: 'out' });
  assert.ok(res.warnings.includes('postre_cerrado_a_esa_hora'));
});

test('G) postre ya incluido: se dice antes de sugerir otro dulce', () => {
  const res = recommend(P, { zone: 'carmen', craving: 'mediterranea' });
  const pick = res.picks.find((p) => p.place.id === 'blanqueries');
  assert.ok(pick.reasons.some((r) => r.code === 'postre_incluido'));
  assert.equal(continuation(P, pick, {}).dessertIncluded, true);
});

test('H) buffet con bebida obligatoria y coste infantil', () => {
  const s = summarize(data.byId['aoyama-joaquin'].price);
  assert.ok(s.compulsoryUnknown.includes('bebida'));
  assert.match(data.byId['aoyama-joaquin'].price.kids_cost.es, /3–5: 8 €/);
  assert.match(data.byId['hankook-alfafar'].price.kids_cost.es, /altura/);
});

test('I) ningún resultado compatible: explica y propone cambios voluntarios', () => {
  const res = recommend(P, { zone: 'mestalla', day: 'mon', time: '10:00' });
  assert.equal(res.picks.length, 0);
  assert.ok(res.suggestions.includes('cambiar_hora'));
  assert.ok(res.suggestions.includes('quitar_zona'));
});

test('con presupuesto pedido, un precio desconocido no se recomienda como si cumpliera', () => {
  const res = recommend(P, { zone: 'cabanyal', budget: 30 });
  assert.ok(!res.picks.some((p) => p.place.price.per_adult_base == null));
  assert.ok(res.pending.some((p) => p.place.id === 'beak-cabanyal'));
});

test('la financiación no altera el orden', () => {
  const q = { craving: 'asiatico', budget: 30 };
  const before = recommend(P, q).picks.map((p) => p.place.id);
  const tampered = P.map((p) => (p.id === 'kyoto-valladolid' ? { ...p, funding: { paid: 9999 }, sponsored: true } : p));
  assert.deepEqual(recommend(tampered, q).picks.map((p) => p.place.id), before);
});

test('excursiones fuera salvo que se pidan', () => {
  assert.ok(!recommend(P, { craving: 'coreano' }).picks.some((p) => p.place.id === 'hankook-alfafar'));
  assert.ok(recommend(P, { craving: 'coreano', includeOutside: true }).picks.some((p) => p.place.id === 'hankook-alfafar'));
});

test('ruta R09: compatibilidad por día y un solo postre', () => {
  const r = data.routes.find((x) => x.id === 'R09');
  const t = Object.fromEntries(dayTable(r, data.byId).map((x) => [x.day, x.verdict]));
  assert.equal(t.mon, 'solo_quedarse');
  assert.equal(t.tue, 'solo_quedarse');
  assert.equal(t.sat, 'ambas');
  assert.equal(t.sun, 'restaurante_cerrado');
  const stay = checkRoute(r, data.byId, { day: 'sat', arrival: '13:30', dessert: 'stay', dessertQty: 1 });
  assert.equal(stay.cost.knownTotal, 45);
  const out = checkRoute(r, data.byId, { day: 'sat', arrival: '13:30', dessert: 'out' });
  assert.equal(out.cost.knownTotal, 39, 'el postre fuera no se suma como cero ni se duplica');
  assert.ok(out.cost.pending.includes('postre_fuera'));
  assert.equal(out.lastSeated, '19:00');
  const ok = checkRoute(r, data.byId, { day: 'sat', arrival: '13:30', stayMin: 90, walkMin: 15, dessert: 'out' });
  assert.equal(ok.sweetStatus.state, 'abierto');
});

test('gustos: «quiero pescado» sube locales con base documental, sin excluir al resto', () => {
  const res = recommend(P, { craving: 'asiatico', likes: ['pescado'] });
  noHardViolations(res);
  assert.equal(res.picks[0].place.id, 'aoyama-joaquin');
  assert.ok(res.picks[0].reasons.some((r) => r.code === 'gusto' && r.like === 'pescado'));
  assert.ok(res.picks.some((p) => !(p.place.likes || []).includes('pescado')), 'un gusto es preferencia, no requisito');
});

test('«sin pantalla en la mesa»: sin pedido sin móvil confirmado, todo queda pendiente', () => {
  const res = recommend(P, { zone: 'eixample', noPhone: true });
  assert.equal(res.picks.length, 0);
  assert.ok(res.pending.length > 0);
  assert.ok(res.pending.every((p) => p.pendingReasons.includes('pedir_sin_movil')));
  assert.ok(res.suggestions.includes('ver_pendientes'));
});

test('alternativas: comparables, mismo ámbito y precio comparado solo si cubren lo mismo', async () => {
  const { alternativesFor } = await import('../src/lib/alternatives.js');
  const raices = alternativesFor(data.byId.raices, P);
  assert.equal(raices.length, 2);
  assert.ok(raices.every((a) => a.shared.includes('pizza')));
  const cassalla = alternativesFor(data.byId.cassalla, P);
  assert.ok(cassalla.every((a) => a.price === 'no_comparable'), 'esmorzar completo frente a bocadillo solo');
  const gato = alternativesFor(data.byId.gato, P).map((a) => a.place.id);
  assert.ok(gato.includes('petit') && gato.includes('linaje'));
  assert.deepEqual(alternativesFor(data.byId.fernandet, P), [], 'una excursión no se compara con locales de la ciudad');
});
