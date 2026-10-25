# Rendimiento (móvil emulado)

Generado con `npm run perf`: 360×780, red 4G lenta (150 ms, 1,6 Mbit/s) y CPU ×4. Servidor local, sin CDN: en producción con caché y compresión será igual o mejor. Interacción medida: pulsar «Recomendar» en el selector.

| Página | LCP | CLS | Interacción | Peso transferido | Objetivo |
|---|---|---|---|---|---|
| / | 752 ms | 0 | — | 87 KB | cumple |
| /estoy-por-aqui/ | 784 ms | 0 | 94 ms | 260 KB | cumple |
| /locales/anyora/ | 748 ms | 0 | — | 78 KB | cumple |
| /mejores-arroces-valencia/ | 688 ms | 0 | — | 75 KB | cumple |
| /en/places/la-salita/ | 756 ms | 0 | — | 79 KB | cumple |
| /rutas/cabanyal-comida-paseo-helado/ | 788 ms | 0 | — | 143 KB | cumple |
