# Instrucciones para Claude: web ES/EN y visitantes
Ampliación de alcance editorial y backlog, sin implementación/publicación automática en esta fase. El propietario pide web en inglés: preparar traducción completa de la futura experiencia, no solo un artículo.

## Arquitectura
Conservar las URLs españolas acordadas y añadir /en/ con slugs naturales. Identificador estable de contenido + locale; precios, horarios, local, evidencia y financiación compartidos como datos, textos por idioma. La ficha no se duplica como negocio distinto por traducirla.

| ES | EN | Intención propuesta |
|---|---|---|
| /guia-gastronomica-valencia/ | /en/valencia-food-guide/ | Valencia food guide, what to eat in Valencia |
| /esmorzar-valencia/ | /en/esmorzar-valencia/ | Valencian brunch, esmorzar Valencia |
| /restaurantes-playa-valencia/ | /en/restaurants-near-valencia-beach/ | where to eat near Valencia beach |
| /restaurantes-barrios-valencia/ | /en/valencia-neighbourhood-restaurants/ | local restaurants Valencia neighbourhoods |
| /mejores-arroces-valencia/ | /en/best-rice-restaurants-valencia/ | paella and rice restaurants |
| /como-nos-financiamos/ | /en/how-we-are-funded/ | confianza editorial |
No duplicar la guía de paella existente si tiene intención equivalente: asignar URL propietaria antes. Las keywords son hipótesis, no volúmenes verificados.

## Idioma y experiencia
Selector Español / English en texto, manteniendo ficha/filtros/plan. Nada de banderas para idiomas. Sin redirección obligatoria por IP o navegador. HTML lang correcto, canonical de cada versión a sí misma, hreflang es/en recíproco incluyéndose a sí mismas solo entre versiones publicadas equivalentes. x-default solo si se define página apropiada. Sitemap, breadcrumbs, metadatos, navegación, mapas, comparador, formularios, errores, accesibilidad y explicación de incertidumbre traducidos. No publicar una URL inglesa cuya sustancia siga en español ni esconder contenido sin traducir bajo etiquetas inglesas.

Formato EUR localizable (EN €12.50; ES 12,50 €) y unidad explícita, reloj de 24 h o explicación inequívoca. Mantener nombres propios y términos como esmorzar con glosario. Revisión humana del humor; tono acogedor, no desprecio a extranjeros o gustos. «Cobardes/valientes» se traduce como aventuras opcionales, nunca como perfil por nacionalidad.

## Transparencia en inglés
“No restaurant pays us at the moment. We work for the people choosing where to eat. If a venue pays for or hosts a visit, we will tell you. You will also see when a recommendation comes from research rather than our own visit.”
CTA: “Fund a visit. We might change our minds — if the food convinces us.”
Subtexto: “You can fund the visit, not the verdict.” Mismas condiciones y actualización del estado económico que en español.

## Rutas para visitantes
Tarjetas con franja, apetito, presupuesto total, ingredientes, reserva y accesibilidad familiar. Preguntas: «familiar o nuevo», «playa o barrio», «cuánto tiempo», «bebé/niño activo», «sin alcohol», «sin usar móvil», «presupuesto de todo el plan». No presuponer capacidad de hablar inglés del personal.
1. La Pascuala → Cabanyal/paseo marítimo: mañana, sujeto a servicio y recorrido verificados; cierre dominical.
2. Cremaet → continuación hacia el puerto usando transporte o paseo comprobado: no llamarlo playa a cinco minutos.
3. Cassalla → barrio de Abastos: alternativa de ciudad, sin forzar salto a playa.
4. Fernandet → playa de Sueca: excursión independiente con vuelta, temporada, horario y precio confirmados. No programar desayuno con la web actual.
5. Comida de arroz junto al paseo → helado solo si el horario y el apetito acompañan; usar fichas previas de playa.
No inventar duraciones andando, inglés del personal, zona de juegos, supervisión, baños adaptados ni necesidad de coche. Datos faltantes visibles.

## Criterios
- Una actualización de precio/sponsor se refleja en ambos idiomas.
- Un cambio de idioma conserva el mismo establecimiento y sucursal.
- No hay hreflang hacia borradores o páginas inexistentes.
- Todas las variantes declaran evidencia documental y pagos con la misma claridad.
- Casos de prueba: pareja en playa, familia sin pantallas, turista que evita cerdo/vísceras/alcohol, domingo buscando esmorzar y visitante que quiere ir a Fernandet.
