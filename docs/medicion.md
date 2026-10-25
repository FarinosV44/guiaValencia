# Medición de decisiones útiles y captación (#27)

## Qué se mide en la web (preparado, apagado)

`src/assets/js/site.js` expone `track(evento, props)`. No envía nada mientras `data/site.json → metrics_endpoint` sea `null`. Cuando el propietario elija proveedor (Plausible, Umami, un endpoint propio…), basta con poner la URL que acepte `sendBeacon` con JSON.

| Evento | Cuándo | Datos (lista cerrada) |
|---|---|---|
| `recomendar` | Se pulsa «Recomendar» o se entiende una frase | zona, antojo, compañía, plan, presupuesto (tramo) |
| `encaja` | Respuesta a «¿Os encaja alguno de estos planes?» | sí / no |
| `maps` | Clic en un enlace de Google Maps | id del local |
| `guardar` | Guardar o quitar de «Mi plan» | id del local |
| `compartir_busqueda` | Copiar el enlace de una búsqueda | — |

Nunca se envían texto libre, coordenadas, edades, correo ni identificadores de persona. Sin cookies. El clic en Maps es «salida hacia el local», no una reserva: no hay integración de reservas.

## Panel agregado propuesto

- Recomendaciones completadas por zona, antojo y compañía (qué planes se buscan).
- Tasa de «sí, encaja» por tipo de plan (dónde falla el catálogo).
- Salidas a Maps y fichas guardadas por local (qué se decide de verdad).
- Búsquedas sin resultado por combinación (qué falta cubrir).

El éxito no se mide por visitas ni tiempo en página, sino por planes que encajan y salidas a un local.

## Search Console (cuando haya dominio)

1. Verificar el dominio y enviar `sitemap.xml` (solo páginas revisadas e indexables).
2. A los 30 días: consultas con impresiones por intención (arroces, sushi, niños, esmorzar…), marca frente a no marca.
3. A los 60 días: páginas con impresiones y CTR bajo → revisar title y descripción, no inflar texto.
4. A los 90 días: decidir qué borradores pasan a indexables según contenido completo, no según tráfico prometido.

No se prometen posiciones ni clientes. Los volúmenes de búsqueda se registrarán cuando haya datos reales de Search Console o de una herramienta contratada.
