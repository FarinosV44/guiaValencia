# Mapa consulta → intención → URL canónica (#20, #37)

Una URL por intención. Las variantes de una misma consulta comparten página; no se crean páginas por año, filtro, barrio × cocina ni combinaciones vacías. Las consultas son las previstas, no volúmenes medidos: se validarán con Search Console cuando haya dominio.

| Consultas previstas (ejemplos) | Intención | URL ES | URL EN |
|---|---|---|---|
| dónde comer en Valencia, restaurantes Valencia | elegir según plan | `/` | `/en/` |
| dónde comer cerca de mí, estoy en Ruzafa dónde como | decidir desde una zona | `/estoy-por-aqui/` | `/en/im-around-here/` |
| mejor paella Valencia, dónde comer arroz, arrocerías | arroz | `/mejores-arroces-valencia/` | `/en/best-rice-restaurants-valencia/` |
| buffet sushi Valencia, mejor buffet japonés | buffet japonés | `/mejores-buffets-sushi-valencia/` | `/en/best-sushi-buffets-valencia/` |
| restaurantes asiáticos Valencia, japonés Valencia | asiático en general | `/restaurantes-asiaticos-valencia/` | `/en/asian-restaurants-valencia/` |
| barbacoa coreana Valencia | coreano | `/barbacoa-coreana-valencia/` | `/en/korean-bbq-valencia/` |
| mejores pizzerías Valencia, pizza napolitana | pizza | `/mejores-pizzerias-valencia/` | `/en/best-pizza-valencia/` |
| mejores hamburguesas Valencia | hamburguesa | `/mejores-hamburguesas-valencia/` | `/en/best-burgers-valencia/` |
| tapas Valencia, bravas Valencia, tapear | tapas | `/tapas-bravas-valencia/` | `/en/tapas-valencia/` |
| restaurante cita Valencia, cena romántica | pareja | `/restaurantes-cita-valencia/` | `/en/date-night-restaurants-valencia/` |
| comer barato Valencia, menú del día | precio | `/comer-barato-valencia/` | `/en/cheap-eats-valencia/` |
| alta cocina Valencia, restaurantes estrella | ocasión | `/restaurantes-alta-cocina-valencia/` | `/en/fine-dining-valencia/` |
| esmorzar Valencia, almuerzo valenciano | esmorzar | `/esmorzar-valencia/` | `/en/esmorzar-valencia/` |
| comer cerca de la playa Valencia | playa | `/restaurantes-playa-valencia/` | `/en/restaurants-near-valencia-beach/` |
| heladerías Valencia, horchata Valencia, cafeterías | dulce y café | `/heladerias-horchaterias-cafes-valencia/` | `/en/ice-cream-horchata-coffee-valencia/` |
| comer con niños Valencia, restaurantes zona infantil, con bebé | familias | `/comer-con-ninos-valencia/` | `/en/eating-out-with-kids-valencia/` |
| qué comer en Valencia, Valencia food guide | visitantes | `/guia-gastronomica-valencia/` | `/en/valencia-food-guide/` |
| restaurantes por barrios, sorpresas fuera del centro | barrios | `/restaurantes-barrios-valencia/` | `/en/valencia-neighbourhood-restaurants/` |
| rutas comer y pasear Valencia | rutas | `/rutas/` | `/en/routes/` |
| [nombre del local] Valencia | ficha | `/locales/{id}/` | `/en/places/{id}/` |

Decisiones:

- «Comer con bebés» y «restaurantes con zona infantil» comparten `/comer-con-ninos-valencia/` hasta que haya contenido distinto suficiente para separarlas.
- Paella y arroz comparten `/mejores-arroces-valencia/`; «paella valenciana» no tiene URL propia para no canibalizarla.
- Los parámetros del selector (`?zona=…`) no son páginas SEO: el selector tiene una sola canónica y no entra combinaciones en el sitemap.
- Los borradores llevan `noindex,follow`, no tienen hreflang y no entran en el sitemap hasta su revisión.

## Política de redirecciones

- Un cambio de slug deja una redirección 301 de la URL vieja a la nueva, registrada en `data/redirects.json` (pendiente de crear con el primer cambio) y aplicada por el hosting.
- Una ficha de un local que cierra no se borra: queda con aviso de cierre, sale de recomendaciones y rutas, y pasa a `noindex`.
- Un local eliminado del catálogo (como Goisushi) responde 410 o redirige a su categoría, según el hosting.
