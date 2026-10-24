# Investigación editorial de la guía de Valencia

24/10/2026. Alcance: investigación, datos y tareas para la futura guía; no implementación de web ni compra de dominios.

## Entregables

- [Marca y dominios](marca-y-dominios.md): recomendación, comprobaciones RDAP/OEPM y límites de SEO.
- [Selección por zonas](seleccion-por-zonas.md): 31 locales con motivo de inclusión, dirección, enlace para llegar, oferta, precio documentado y cuestiones pendientes.
- [Datos de locales](seleccion-locales.json): catálogo inicial para importar como borradores, sin visitas ficticias.
- [Análisis de reseñas](reseñas-google.md): 33 reseñas visibles de 11 negocios, cobertura limitada y conclusiones razonadas.
- [Rutas](rutas-editoriales.md): 12 planes por zonas, alternativas y errores que evitar.
- [Datos de rutas](rutas-editoriales.json): IDs enlazados con el catálogo. Propuestas editoriales pendientes de validación completa, no recorridos inspeccionados.
- [Evidencia RDAP](dominios-rdap.json): comprobaciones de candidatos .com. Control posterior: google.com devuelve 200 y dondecomervalencia.com 404; ello respalda ausencia de objeto en esa consulta, no garantiza precio o registro.

## De qué fuentes nos nutrimos y para qué

Valencia Secreta: descubrimiento de heladerías y organización por intención; su artículo de helados consultado es de 2024, no tarifa actual. Guía Hedonista y El Tipo que Nunca Cena en Casa: criterio y atención al pedido real, limitaciones, normalidad y contexto; los artículos encontrados son antiguos y no se trasladan como estado actual del negocio. Por ejemplo, «Los Navarros» de 10/06/2021: https://valenciaplaza.com/valenciaplaza/diario-hedonista-semana-de-reencuentros1 . No es una fuente reciente ni una visita nuestra.

Michelin/Repsol: contraste de selección, dirección y especialidades; no copiar distinciones antiguas ni tomar €€ como ticket. Visit Valencia: localización y descubrimiento, precios turísticos no sustituyen carta. Agenda de Isa y guías de barrio: candidaturas familiares/ubicación, seguidas de contraste oficial. Web de cada local: dirección, carta y condiciones; tampoco es infalible, como muestran las contradicciones detectadas.

Fuentes principales de descubrimiento:
- https://valenciasecreta.com/helados-valencia/
- https://valenciaplaza.com/guiahedonista/
- https://agendadeisa.com/comer-con-ninos-en-valencia/
- https://www.guiarepsol.com/es/fichas/solete/antigua-lecheria-335606/
- https://benimacletentra.org/portfolio-item/la-ola-fresca/
- https://guiadebenimaclet.com/categorias-empresas/restaurantes-bares/

No se usan resúmenes automáticos de agregadores como si fueran una auditoría propia de todas las reseñas. No se han adoptado puntuaciones comerciales de directorios de helados ni sus afirmaciones de acreditación como hechos independientes. No se copian fotografías, cartas completas o reseñas completas. Los Maps URLs se generan conforme a https://developers.google.com/maps/documentation/urls/get-started ; tienen nombre y dirección, sin inventar Place IDs ni minutos caminando.

## Selección inteligente y límite de extensión

Portada de cada zona: 3–5 opciones según plan, no todas las fichas a la vez. Añadir variedad real de función: comida ajustada, cocina interesante, ocasión especial y parada dulce o infantil cuando exista evidencia. Una alternativa solo entra si aporta algo: cercanía, presupuesto, producto o necesidad familiar. No se incluyen todas las apariciones de un blog. No rellenar barrios con supuestas recomendaciones sin comprobar.

No hay «timo» demostrado ni un chollo acreditado por visita propia. Sí hay señales útiles: mínimos de gasto, postre ya incluido, menú más interesante que carta, límites de mesa, falta de supervisión acreditada y cierre temprano de cafeterías. Esas razones tienen más valor que inventar contundencia.

## Antes de activar fichas y rutas públicas

1. Resolver tarifas contradictorias en Petit Niu y horarios de Kuzina, Hippolatte, La Ola Fresca y Els Sariers.
2. Confirmar horarios de las paradas dulces, tamaños y extras; calcular el presupuesto completo del grupo.
3. Verificar trayectos reales, cruces y accesos con carrito. Cercanía no implica seguridad infantil.
4. Ampliar reseñas con un método documentado; las 33 observadas son exploratorias. Las otras 20 fichas tienen auditoría Google pendiente.
5. Completar revisión de marca y registrar solo tras decisión del propietario. Las disponibilidades son temporales.
6. Importar como borradores y revisar: `not_publication_ready: true` es intencional.

## Ampliación: sushi, pizza, hamburguesas y citas

[Entrega para Claude](ampliacion-2026-10-24/LEEME-CLAUDE.md): cinco artículos documentales, 14 candidatos adicionales, doce reseñas visibles de cuatro fichas, propuesta SEO, logo original transparente y viñeta de formatos. No son catas propias ni rankings sensoriales definitivos. Consultado el 24/10/2026. Los candidatos por marca sin sucursal concreta no deben convertirse en rutas hasta resolver su dirección.
