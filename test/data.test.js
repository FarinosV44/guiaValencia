import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData, validate } from '../src/data.js';
import { summarize } from '../src/lib/price.js';
import { statement, isFunded } from '../src/lib/funding.js';

const data = loadData();

test('los datos pasan la validación estructural', () => {
  assert.deepEqual(validate(data), []);
});

test('El Baret de la Tòfona es Ador 47 (Castellar), no La Tòfona de Cánovas', () => {
  const b = data.byId['baret-tofona'];
  assert.equal(b.address, 'Ador, 47');
  assert.equal(b.zone, 'castellar');
  const all = JSON.stringify(data.places);
  // La Tòfona de Comte d'Altea 9 solo puede aparecer como advertencia, nunca como local.
  assert.ok(!data.places.some((p) => /Comte d'Altea, ?9\b/.test(p.address || '')));
  assert.ok(all.includes('Comte d\'Altea 9'), 'la ficha advierte de la confusión');
});

test('Valencia ciudad separada de área metropolitana y excursiones', () => {
  assert.equal(data.byId.fernandet.scope, 'excursion');
  assert.equal(data.byId.fernandet.city, 'Sueca');
  assert.equal(data.byId['hankook-alfafar'].scope, 'area_metropolitana');
  for (const p of data.places) if (p.scope === 'valencia') assert.ok(!p.city || p.city === 'Valencia', p.id);
});

test('no hay visitas propias inventadas ni fichas listas para publicar sin revisión', () => {
  for (const p of data.places) {
    assert.equal(p.own_visit, false, p.id);
    assert.equal(p.publication_ready, false, p.id);
    assert.ok(!p.evidence.some((e) => e.kind === 'visita_propia'), p.id);
  }
});

test('ninguna ficha tiene hoy un precio completo (siempre hay extras desconocidos)', () => {
  for (const p of data.places) assert.equal(summarize(p.price).complete, false, p.id);
});

test('premios con año o pendiente explícito; Gastroadictos es premio al grupo', () => {
  for (const id of ['cassalla', 'cremaet']) {
    const a = data.byId[id].evidence_awards[0];
    assert.equal(a.year, 2024);
    assert.match(a.label.es, /grupo Gastroadictos/);
    assert.match(a.label.es, /no premio individual/);
  }
  assert.match(data.byId.hundred.evidence_awards[0].label.es, /Burgerdudes/);
  assert.ok(!JSON.stringify(data.byId.hundred).includes('Michelin\"'));
});

test('Fernandet no promete esmorzar matinal', () => {
  const f = data.byId.fernandet;
  for (const [, v] of Object.entries(f.hours.weekly)) for (const [open] of v) assert.ok(open >= '13:00');
  assert.match(f.text.es.not_for, /no confirma esmorzar/);
});

test('la declaración «nadie nos paga» cambia sola al registrar financiación', () => {
  assert.equal(isFunded(data.funding), false);
  assert.equal(statement(data.funding, 'es').headline, 'Aquí no nos paga nadie.');
  const funded = { ...data.funding, entries: [{ place: 'anyora', kind: 'comida_invitada', date: '2026-11-01' }] };
  const s = statement(funded, 'es');
  assert.equal(s.funded, true);
  assert.notEqual(s.headline, 'Aquí no nos paga nadie.');
  assert.notEqual(statement(funded, 'en').headline, 'No restaurant pays us at the moment.');
});

test('los textos ES y EN no son copias (traducción real)', () => {
  for (const p of data.places) {
    for (const k of ['fits', 'not_for', 'order']) assert.notEqual(p.text.es[k], p.text.en[k], `${p.id}.${k}`);
  }
});

test('ninguna dirección de ruta sale de una sucursal sin identificar', () => {
  for (const r of data.routes) {
    const ids = r.places || r.stops.filter((s) => s.kind === 'place').map((s) => s.place);
    for (const id of ids) assert.ok(data.byId[id].address, `${r.id}/${id}`);
  }
});

test('datos verificados el 25/10/2026: precios oficiales y reglas por día', () => {
  const pas = data.byId.pascuala;
  assert.equal(pas.price.per_adult_base, 14);
  assert.equal(pas.price.base_overrides.sat, null, 'sábados sin menú de almuerzo');
  assert.equal(pas.hours.weekly.sun.length, 0);
  const pri = data.byId.principal.price;
  assert.match(pri.minimum.es, /mínimo 2 raciones/);
  assert.ok(pri.lines.some((l) => l.amount === 17 && /por encargo/.test(l.label.es)));
  assert.equal(data.byId.riff.price.lines.find((l) => l.amount === 158.8).third_party, false);
  assert.equal(data.byId.riff.price.base_confirmed, false, 'el menú de mediodía sigue siendo de TheFork');
  assert.equal(data.byId.hundred.zone, 'mercat');
  assert.ok(data.byId.hundred.address_source.includes('visitvalencia.com'));
  assert.equal(data.byId.hundred.hours.status, 'desconocido', 'no usamos horario de agregadores');
});
