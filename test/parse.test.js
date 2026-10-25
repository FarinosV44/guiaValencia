import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlan } from '../src/lib/parse.js';
import { recommend } from '../src/lib/recommend.js';
import { loadData } from '../src/data.js';

const data = loadData();

test('«Estamos en Colón, dos adultos y bebé, cena rápida sin pantallas»', () => {
  const r = parsePlan('Estamos en Colón, dos adultos y bebé, cena rápida sin pantallas');
  assert.deepEqual(r.fields, { zona: 'eixample', con: 'familia_bebe', plan: 'rapido', hora: '21:30', sinpantallas: '1' });
  assert.equal(r.question, null);
});

test('«Dos personas, asiático o algo nuevo, 60 € todo el plan» reparte el presupuesto', () => {
  const r = parsePlan('Dos personas, asiático o algo nuevo, 60 € todo el plan');
  assert.equal(r.fields.antojo, 'asiatico');
  assert.equal(r.fields.presupuesto, '30');
  assert.ok(r.notes.some((n) => n.code === 'reparto' && n.people === 2));
  assert.ok(r.notes.some((n) => n.code === 'antojo_extra' && n.values.includes('nuevo')));
});

test('inglés: «We are two, sushi in Ruzafa tonight, 40 euros each»', () => {
  const r = parsePlan('We are two, sushi in Ruzafa tonight, 40 euros each', { today: '2026-10-25' });
  assert.equal(r.fields.zona, 'ruzafa');
  assert.equal(r.fields.antojo, 'japones');
  assert.equal(r.fields.hora, '21:30');
  assert.equal(r.fields.dia, 'sun');
  assert.equal(r.fields.presupuesto, '40');
});

test('sin zona ni antojo hace una sola pregunta', () => {
  const r = parsePlan('mañana con mi pareja');
  assert.equal(r.question, 'zona_o_antojo');
  assert.equal(r.fields.con, 'pareja');
});

test('la frase y el formulario dan el mismo resultado (mismo filtro estructurado)', () => {
  const r = parsePlan('Tapas en Cabanyal el sábado a las 14');
  const q = { zone: r.fields.zona, craving: r.fields.antojo, day: r.fields.dia, time: r.fields.hora, likes: [] };
  const viaForm = recommend(data.places, { zone: 'cabanyal', craving: 'tapas', day: 'sat', time: '14:30', likes: [] });
  assert.deepEqual(recommend(data.places, q).picks.map((p) => p.place.id), viaForm.picks.map((p) => p.place.id));
  for (const p of recommend(data.places, q).picks) assert.ok(data.byId[p.place.id], 'solo IDs del catálogo');
});
