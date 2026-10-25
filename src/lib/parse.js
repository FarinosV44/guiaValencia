// «Cuéntanos el plan en una frase» (#23). Traduce una frase a los MISMOS filtros del selector, sin IA externa:
// reglas deterministas, solo valores que existen en el catálogo y en el formulario. Nunca inventa reserva, horario
// ni locales; si falta un dato material, devuelve UNA pregunta. El resultado se muestra como chips editables.

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

const ZONES = [
  ['colon', 'eixample'], ['canovas', 'eixample'], ['eixample', 'eixample'], ['ensanche', 'eixample'], ['gran via', 'eixample'], ['joaquin costa', 'eixample'],
  ['ruzafa', 'ruzafa'], ['russafa', 'ruzafa'],
  ['carmen', 'carmen'], ['la seu', 'carmen'], ['catedral', 'carmen'], ['barrio del carmen', 'carmen'],
  ['mercado central', 'mercat'], ['mercat', 'mercat'], ['sant francesc', 'mercat'], ['ayuntamiento', 'mercat'], ['plaza de la reina', 'mercat'], ['centro', 'mercat'], ['city centre', 'mercat'], ['old town', 'carmen'],
  ['mestalla', 'mestalla'], ['alameda', 'mestalla'], ['benimaclet', 'benimaclet'],
  ['cabanyal', 'cabanyal'], ['canyamelar', 'cabanyal'], ['malvarrosa', 'malvarrosa'], ['playa', 'malvarrosa'], ['beach', 'malvarrosa'], ['paseo maritimo', 'malvarrosa'],
  ['zaidia', 'zaidia'], ['viveros', 'zaidia'], ['trinitat', 'zaidia'], ['petxina', 'petxina'], ['extramurs', 'petxina'], ['torrefiel', 'torrefiel'],
  ['abastos', 'abastos'], ['arrancapins', 'abastos'], ['castellar', 'castellar'], ['estacion del norte', 'xativa'], ['estacion', 'xativa'], ['xativa', 'xativa'], ['train station', 'xativa'],
  ['avenida del puerto', 'puerto'], ['port', 'puerto'], ['ciudad de las artes', 'ciencias'], ['ciencias', 'ciencias'], ['city of arts', 'ciencias'],
];
const CRAVINGS = [
  [/\b(sushi|japones|japonesa|japanese|ramen|omakase)\b/, 'japones'], [/\b(coreano|coreana|korean|barbacoa coreana)\b/, 'coreano'],
  [/\b(asiatico|asiatica|asian|oriental)\b/, 'asiatico'], [/\b(pizza|pizzeria|pizzas)\b/, 'pizza'], [/\b(hamburguesa|hamburguesas|burger|burgers)\b/, 'burger'],
  [/\b(paella|arroz|arroces|rice)\b/, 'arroz'], [/\b(tapas|tapear|bravas|tapeo)\b/, 'tapas'], [/\b(esmorzar|almuerzo valenciano|almorzar|bocadillo)\b/, 'esmorzar'],
  [/\b(tipico|tipica|valenciano|valenciana|local food|traditional)\b/, 'valenciano'], [/\b(alta cocina|fine dining|menu degustacion|tasting menu)\b/, 'alta_cocina'],
  [/\b(algo nuevo|distinto|diferente|probar algo|something new|something different)\b/, 'nuevo'], [/\b(mediterranea|mediterraneo|mediterranean)\b/, 'mediterranea'],
];
const COMPANY = [
  [/\b(bebe|bebes|carrito|baby|pushchair|stroller)\b/, 'familia_bebe'],
  [/\b(nino|nina|ninos|ninas|hijo|hija|hijos|peque|peques|crio|kid|kids|child|children|toddler|\d+ anos|\d+ years?)\b/, 'nino_activo'],
  [/\b(pareja|cita|novio|novia|aniversario|date|couple|romantic)\b/, 'pareja'], [/\b(amigos|amigas|friends)\b/, 'amigos'],
  [/\b(turista|turistas|de visita|visitando|visiting|tourist|first time)\b/, 'visitante'],
];
const PLANS = [
  [/\b(rapido|rapida|algo rapido|quick|fast)\b/, 'rapido'], [/\b(sobremesa|sin prisa|comida larga|long lunch)\b/, 'sobremesa'],
  [/\b(ocasion|especial|aniversario|cumpleanos|celebrar|celebration|birthday|anniversary)\b/, 'ocasion'],
];
const LIKES = [
  [/\b(pescado|fish|marisco|seafood)\b/, 'pescado'], [/\b(salsas|sauces)\b/, 'salsas'], [/\b(mucha hambre|muy hambrientos|hambre|starving|very hungry)\b/, 'mucha_hambre'],
  [/\b(tranquila|tranquilo|hablar|conversar|quiet)\b/, 'cita_tranquila'], [/\b(vegano|vegana|veganos|vegan)\b/, 'vegano'],
];
const DAYS = [
  [/\b(lunes|monday)\b/, 'mon'], [/\b(martes|tuesday)\b/, 'tue'], [/\b(miercoles|wednesday)\b/, 'wed'], [/\b(jueves|thursday)\b/, 'thu'],
  [/\b(viernes|friday)\b/, 'fri'], [/\b(sabado|saturday)\b/, 'sat'], [/\b(domingo|sunday)\b/, 'sun'],
];
const TIMES = ['10:00', '13:30', '14:30', '17:30', '20:30', '21:30'];
const BUDGETS = [15, 20, 30, 40, 60, 100];
const NUM_WORDS = { un: 1, una: 1, uno: 1, one: 1, dos: 2, two: 2, tres: 3, three: 3, cuatro: 4, four: 4, cinco: 5, five: 5, seis: 6, six: 6 };

function nearestTime(h, m = 0) {
  const t = h * 60 + m;
  return TIMES.reduce((best, x) => {
    const [a, b] = x.split(':').map(Number);
    return Math.abs(a * 60 + b - t) < Math.abs(best.v - t) ? { x, v: a * 60 + b } : best;
  }, { x: TIMES[0], v: 600 }).x;
}

export function parsePlan(text, { today } = {}) {
  const s = ' ' + norm(text || '') + ' ';
  const f = {};
  const notes = [];

  for (const [k, z] of ZONES) if (s.includes(' ' + k + ' ') || s.includes(' ' + k + ',') || s.includes(' ' + k + '.')) { f.zona = z; break; }
  const crav = CRAVINGS.filter(([re]) => re.test(s)).map(([, c]) => c);
  if (crav.length) { f.antojo = crav[0]; if (crav.length > 1) notes.push({ code: 'antojo_extra', values: crav.slice(1) }); }
  for (const [re, c] of COMPANY) if (re.test(s)) { f.con = c; break; }
  for (const [re, p] of PLANS) if (re.test(s)) { f.plan = p; break; }
  const likes = LIKES.filter(([re]) => re.test(s)).map(([, l]) => l);
  if (likes.length) f.gusto = [...new Set(likes)];
  for (const [re, d] of DAYS) if (re.test(s)) { f.dia = d; break; }
  if (!f.dia && today && /\b(hoy|today|esta noche|tonight)\b/.test(s)) f.dia = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(today + 'T12:00:00').getDay()];
  if (!f.dia && today && /\b(manana|tomorrow)\b/.test(s) && !/\bpor la manana\b/.test(s)) f.dia = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][(new Date(today + 'T12:00:00').getDay() + 1) % 7];

  const hm = s.match(/\ba las (\d{1,2})(?:[:.h](\d{2}))?\b|\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (hm) {
    let h = Number(hm[1] ?? hm[3]); const mi = Number(hm[2] ?? hm[4] ?? 0);
    if (hm[5] === 'pm' && h < 12) h += 12;
    if (!hm[5] && h >= 1 && h <= 4) h += 12; // «a las 2» = 14:00 en una guía de comidas
    if (!hm[5] && h >= 8 && h <= 11 && /\b(cena|cenar|noche|dinner)\b/.test(s)) h += 12;
    f.hora = nearestTime(h, mi);
  } else if (/\b(cena|cenar|esta noche|dinner|tonight)\b/.test(s)) f.hora = '21:30';
  else if (/\b(comida|comer a mediodia|mediodia|lunch)\b/.test(s)) f.hora = '14:30';
  else if (/\b(desayuno|desayunar|almorzar|esmorzar|breakfast|brunch)\b/.test(s)) f.hora = '10:00';

  if (/\bsin pantallas|no screens|screen.free|cero pantallas\b/.test(s)) f.sinpantallas = '1';
  if (/\bsin movil|sin tablet|without a phone|no phone\b/.test(s)) f.sinmovil = '1';
  if (/\b(fuera de valencia|alrededores|excursion|day trip|sueca|alfafar)\b/.test(s)) f.fuera = '1';

  // Presupuesto: «60 €» o «60 euros»; si es «todo el plan» o «en total», se reparte entre las personas indicadas.
  const bm = s.match(/(\d{1,4})\s*(?:€|euros?\b|eur\b)|€\s*(\d{1,4})\b/);
  if (bm) {
    const amount = Number(bm[1] ?? bm[2]);
    const total = /\b(todo el plan|en total|entre todos|para todos|in total|total|for the whole plan|all in)\b/.test(s);
    const pm = s.match(/\b(\d|un|una|uno|dos|tres|cuatro|cinco|seis|one|two|three|four|five|six)\s+(personas|adultos|people|adults|of us)\b|\b(somos|we are|we're)\s+(\d|dos|tres|cuatro|cinco|seis|two|three|four|five|six)\b/);
    const people = pm ? (Number(pm[1] ?? pm[4]) || NUM_WORDS[pm[1] ?? pm[4]]) : (/\b(pareja|couple|dos|two)\b/.test(s) ? 2 : 1);
    const perPerson = total ? amount / people : amount;
    const fit = [...BUDGETS].reverse().find((b) => b <= perPerson);
    if (fit) { f.presupuesto = String(fit); if (total) notes.push({ code: 'reparto', amount, people, perPerson: Math.round(perPerson) }); }
    else notes.push({ code: 'presupuesto_bajo', perPerson: Math.round(perPerson) });
  }

  // Una sola pregunta si falta lo material: sin zona ni antojo no hay forma de acotar.
  const question = !f.zona && !f.antojo ? 'zona_o_antojo' : null;
  return { fields: f, notes, question };
}
