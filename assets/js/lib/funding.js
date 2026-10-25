// Declaración de independencia derivada del estado económico (#29, #41).
// Si entra financiación, «Aquí no nos paga nadie» desaparece sola y se muestra la declaración vigente.
const NOBODY = {
  es: {
    headline: 'Aquí no nos paga nadie.',
    body: 'Esta guía es para ti, que consumes y miras la cuenta. De momento trabajamos para ti. Si un restaurante nos paga o nos invita, lo diremos: quién pone la mesa, quién paga la visita y qué relación tenemos.',
    body2: 'Nos puede gustar un bar barato y decepcionar una cena de lujo. También al revés. Te contamos lo que sabemos, lo que opinamos y lo que todavía no hemos comprobado. Cuando una ficha se basa en cartas y reseñas, lo verás; investigar no es fingir que hemos comido allí.',
  },
  en: {
    headline: 'No restaurant pays us at the moment.',
    body: 'We work for the people choosing where to eat. If a venue pays for or hosts a visit, we will tell you: who set the table, who paid for the visit and what our relationship is.',
    body2: 'We might love a cheap bar and be let down by a luxury dinner. Or the other way round. We tell you what we know, what we think and what we have not checked yet. When a venue card is based on menus and reviews, you will see it; research is not pretending we ate there.',
  },
};

const FUNDED = {
  es: {
    headline: 'Trabajamos para quien consume.',
    body: 'Aquí puedes ver quién ha financiado cada visita, con fecha, modalidad y local. Pagar una visita no compra el veredicto ni la posición en ninguna lista.',
  },
  en: {
    headline: 'We work for the people who eat.',
    body: 'Here you can see who has funded each visit, with date, type and venue. Paying for a visit does not buy the verdict or a place in any list.',
  },
};

export function isFunded(funding) {
  return funding.current.state !== 'sin_financiacion' || (funding.entries || []).length > 0;
}

export function statement(funding, lang) {
  const funded = isFunded(funding);
  const base = funded ? FUNDED[lang] : NOBODY[lang];
  return { funded, since: funding.current.since, ...base };
}

export function placeDisclosures(funding, place) {
  const entries = (funding.entries || []).filter((e) => e.place === place.id);
  if (entries.length) return { kind: 'financiada', entries };
  if (place.own_visit) return { kind: 'visita_propia', entries: [] };
  return { kind: 'documental', entries: [] };
}
