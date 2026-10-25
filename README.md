# Dónde comer en Valencia

Guía gastronómica independiente ES/EN para decidir dónde comer en Valencia, cuánto costará de verdad y cómo seguir el plan. Nombre de trabajo pendiente de #2. **No está publicada ni desplegada.**

## Uso

```bash
npm install          # solo dependencias de desarrollo (Playwright, axe-core)
npm run build        # genera dist/ (sin dependencias de ejecución)
npm run serve        # http://127.0.0.1:4173/ para revisar en local
npm test             # datos, escenarios de #26, SEO y enlaces del sitio generado
npm run a11y         # axe-core + recorridos en navegador (móvil 360 px y escritorio)
npm run check        # build + test + a11y
npm run screenshots  # capturas reales en docs/capturas/
npm run revision     # cola de revisión de datos en docs/revision-datos.md
```

La CI (`.github/workflows/check.yml`) ejecuta build, pruebas y accesibilidad en cada PR.

`SITE_ORIGIN=https://… npm run build` fija el dominio de canonical, hreflang y sitemap. Mientras no haya dominio decidido se usa `https://donde-comer-valencia.example`.

## Estructura

| Ruta | Qué contiene |
|---|---|
| `data/places/*.json` | Locales por lote de investigación. Datos compartidos entre idiomas; textos en `text.es` / `text.en`. |
| `data/reviews.json` | Lo que cuentan las reseñas por local: veredicto en una frase y puntos a favor / en contra por aspecto (cocina, servicio, reserva, ambiente, niños, precio), cada uno con la plataforma donde se leyó. Se resume, no se copia. |
| `data/categories.json` | Páginas por intención (arroces, sushi, pizzas, burgers, citas, barrios, alta cocina, esmorzar, playa, barbacoa coreana, visitantes). |
| `data/routes.json` | Rutas. Solo se genera página para las que tienen todas las paradas esenciales con horario documentado (hoy R06, R09 y R10). |
| `data/festivos.json` | Festivos de Valencia ciudad 2026 (comunes y locales), con fuentes. |
| `data/funding.json` | Estado económico versionado. La declaración pública se deriva de aquí. |
| `src/lib/` | Lógica compartida por build, pruebas y navegador: precio, horarios, recomendador, rutas, financiación. |
| `src/render/` | Plantillas HTML. `src/i18n.js` tiene la interfaz por idioma y las URLs. |
| `investigacion/` | Investigación del propietario. No se modifica desde el código. |

## Reglas que el código hace cumplir

- **Atributos de tres estados** (y más): `declarado`, `terceros`, `contrastado`, `no`, `desconocido`, `contradictorio`. Desconocido nunca significa no.
- **Precio**: `includes` marca bebida, pan, postre, café y suplementos. Un total solo es «completo» sin conceptos desconocidos; si no, es «suma parcial». Importes de terceros (`third_party`) no cuentan como confirmados.
- **Presupuesto**: con presupuesto pedido, un local sin precio verificable va a «pendientes», no a recomendaciones.
- **Sin pantallas**: requisito duro; solo cuenta `juego_sin_pantallas` declarado o contrastado. «Sin pantalla en la mesa» exige `pedir_sin_movil` confirmado (hoy ninguno: todo queda pendiente).
- **Gustos** (`likes`: pescado, salsas, mucha_hambre, cita_tranquila, vegano): preferencias, nunca requisitos; solo se asignan con base en la investigación.
- **Alternativas**: dos por ficha, con antojo o espacio de juego en común y mismo ámbito; el precio solo se compara si ambas bases cubren los mismos conceptos.
- **Horarios**: se comprueba la hora de llegada; `weekly` admite intervalos, `[]` (cerrado) o `{ "slots": [...] }` (franja declarada sin horas).
- **Festivos**: con fecha, `hours.holidays: "cerrado"` cierra el local; sin dato, el horario semanal pasa a «probable». `price.base_overrides` (`sat`, `sun`, `festivo`) cambia la base solo donde está documentado; `null` = sin precio ese día.
- **Caducidad**: `npm run revision` marca precios de más de 30 días, horarios de 30 y servicios infantiles de 60.
- **Ámbito**: `scope` separa `valencia`, `area_metropolitana` y `excursion`; fuera de la ciudad solo aparece si se pide.
- **Indexación**: una página es indexable solo si su contenido está revisado (`publication_ready` en locales, `status: "revisado"` en categorías). Los borradores llevan `noindex`, no tienen hreflang y no entran en el sitemap.
- **Financiación**: si `funding.json` registra una entrada, «Aquí no nos paga nadie» se sustituye automáticamente. Ningún campo de pago entra en el recomendador.
- **Nunca**: visitas, puntuaciones, fotos de locales, minutos andando ni `aggregateRating` inventados.

## Publicar una ficha tras revisarla

1. Completar precio, horario y datos pendientes con fuente y fecha.
2. Poner `"status": "revisado"` y `"publication_ready": true` en el local (o `"status": "revisado"` en la categoría).
3. `npm run check`.
