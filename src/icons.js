// Iconos dibujados para la guía (temas genéricos, sin marcas ni fotos de locales).
// Trazo tinta, rellenos naranja/menta; decorativos (aria-hidden) porque siempre van junto a texto.
const S = (inner) => `<svg class="ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;

export const ICONS = {
  arroz: S('<ellipse cx="24" cy="27" rx="17" ry="9" fill="var(--naranja)"/><path d="M7 27h-3M44 27h-3"/><circle cx="18" cy="25" r="2" fill="var(--menta)"/><circle cx="28" cy="29" r="2" fill="var(--menta)"/><path d="M23 23l3 2M31 24l2 2"/>'),
  tapas: S('<path d="M8 30h32l-4 8H12z" fill="var(--crema)"/><path d="M14 30c0-5 4-9 10-9s10 4 10 9" fill="var(--naranja)"/><path d="M24 21V11"/><path d="M21 13h6"/>'),
  asiatico: S('<path d="M8 24h32c0 9-7 15-16 15S8 33 8 24z" fill="var(--naranja)"/><path d="M14 20c2-4 6-6 10-6s8 2 10 6"/><path d="M30 6l-8 16M36 8l-10 15"/>'),
  sushi: S('<ellipse cx="24" cy="30" rx="15" ry="6" fill="var(--crema)"/><path d="M9 30v-6c0-3 7-6 15-6s15 3 15 6v6"/><path d="M11 22c4 2 9 3 13 3s9-1 13-3" fill="var(--naranja)"/>'),
  parrilla: S('<ellipse cx="24" cy="28" rx="16" ry="8" fill="var(--naranja)"/><path d="M12 25l24 6M12 31l24-6M18 22l14 12M30 22L16 34"/><path d="M19 15c-2-3 0-5 0-7M27 15c-2-3 0-5 0-7"/>'),
  pizza: S('<path d="M24 41L8 12c10-5 22-5 32 0z" fill="var(--naranja)"/><path d="M10 16c9-4 19-4 28 0"/><circle cx="21" cy="21" r="2.4" fill="var(--crema)"/><circle cx="28" cy="27" r="2.4" fill="var(--crema)"/><circle cx="23" cy="31" r="2" fill="var(--menta)"/>'),
  burger: S('<path d="M9 21c0-7 7-11 15-11s15 4 15 11z" fill="var(--naranja)"/><path d="M8 26h32"/><path d="M10 26c3 3 6 3 9 0s6-3 9 0 6 3 9 0" stroke="var(--menta)"/><path d="M9 31h30c0 4-3 7-7 7H16c-4 0-7-3-7-7z" fill="var(--naranja)"/>'),
  valenciano: S('<circle cx="24" cy="27" r="13" fill="var(--naranja)"/><path d="M24 14c0-4 3-7 7-7"/><path d="M26 11c4-3 9-2 11 1-4 3-8 3-11-1z" fill="var(--menta)"/><circle cx="20" cy="24" r="1" fill="currentColor"/><circle cx="28" cy="30" r="1" fill="currentColor"/>'),
  nuevo: S('<path d="M24 6l3 11 11 3-11 3-3 11-3-11-11-3 11-3z" fill="var(--naranja)"/><path d="M38 32l1.5 4 4 1.5-4 1.5L38 43l-1.5-4-4-1.5 4-1.5z" fill="var(--menta)"/>'),
  dulce: S('<path d="M16 22l8 20 8-20" fill="var(--crema)"/><path d="M18 27l10 6M20 33l6 4"/><circle cx="24" cy="16" r="9" fill="var(--naranja)"/><path d="M16 20c3 2 13 2 16 0"/>'),
  cafe: S('<path d="M10 18h24v10c0 7-5 12-12 12S10 35 10 28z" fill="var(--naranja)"/><path d="M34 21h3c3 0 4 2 4 4s-1 5-5 5h-2"/><path d="M17 12c-1-2 1-3 0-5M24 12c-1-2 1-3 0-5"/>'),
  esmorzar: S('<path d="M5 26c0-5 5-9 19-9s19 4 19 9-5 7-19 7S5 31 5 26z" fill="var(--naranja)"/><path d="M8 25c5 2 27 2 32 0" stroke="var(--menta)"/><path d="M12 21l2 2M22 19l2 2M32 20l2 2"/>'),
  alta_cocina: S('<path d="M8 33h32"/><path d="M11 33c0-8 6-14 13-14s13 6 13 14" fill="var(--crema)"/><circle cx="24" cy="16" r="2.5" fill="var(--naranja)"/><path d="M17 27c1-3 3-4 5-5"/>'),
  estrella: S('<path d="M24 7l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="var(--naranja)"/>'),
  cita: S('<path d="M13 8h10c0 8-2 13-5 13s-5-5-5-13z" fill="var(--naranja)"/><path d="M18 21v14M13 35h10"/><path d="M27 10h10c0 8-2 13-5 13s-5-5-5-13z" fill="var(--menta)"/><path d="M32 23v14M27 37h10"/>'),
  lupa: S('<circle cx="21" cy="21" r="11" fill="var(--crema)"/><path d="M29 29l11 11"/><path d="M17 24c1-3 3-6 7-7"/><path d="M15 17h12" stroke="var(--naranja)"/>'),
  ola: S('<path d="M5 30c5-5 9-5 13 0s9 5 13 0 9-5 13 0" /><path d="M5 37c5-5 9-5 13 0s9 5 13 0 9-5 13 0" stroke="var(--menta)"/><circle cx="34" cy="14" r="6" fill="var(--naranja)"/>'),
  maleta: S('<rect x="9" y="16" width="30" height="22" rx="4" fill="var(--naranja)"/><path d="M18 16v-4c0-1 1-2 2-2h8c1 0 2 1 2 2v4"/><path d="M9 25h30"/><circle cx="31" cy="31" r="3" fill="var(--crema)"/>'),
  bebe: S('<circle cx="24" cy="21" r="11" fill="var(--crema)"/><circle cx="20" cy="20" r="1.2" fill="currentColor"/><circle cx="28" cy="20" r="1.2" fill="currentColor"/><path d="M21 25c2 1.5 4 1.5 6 0"/><path d="M14 38c2-4 6-6 10-6s8 2 10 6" fill="var(--menta)"/><path d="M24 10c1-2 3-2 4-1"/>'),
  nino: S('<circle cx="24" cy="12" r="5" fill="var(--naranja)"/><path d="M24 17v12M24 29l-6 10M24 29l6 10M24 21l-9-5M24 21l9 3"/><circle cx="38" cy="38" r="4" fill="var(--menta)"/>'),
  pin: S('<path d="M24 42s13-12 13-22a13 13 0 0 0-26 0c0 10 13 22 13 22z" fill="var(--naranja)"/><circle cx="24" cy="20" r="5" fill="var(--crema)"/>'),
  ruta: S('<circle cx="10" cy="36" r="4" fill="var(--naranja)"/><circle cx="38" cy="12" r="4" fill="var(--menta)"/><path d="M14 36c10 0 6-10 14-12s6-8 6-8" stroke-dasharray="3 4"/>'),
  moneda: S('<circle cx="24" cy="24" r="15" fill="var(--naranja)"/><circle cx="24" cy="24" r="10" fill="none" stroke="var(--crema)"/><path d="M27 19c-1-1.5-2.5-2-4-2-3 0-5 2.5-5 7s2 7 5 7c1.5 0 3-.5 4-2M16 22h8M16 26h8" stroke="var(--crema)"/>'),
  ticket: S('<path d="M12 6h24v36l-4-3-4 3-4-3-4 3-4-3-4 3z" fill="var(--crema)"/><path d="M17 15h14M17 21h14M17 27h8"/>'),
};

export function icon(name) {
  return ICONS[name] || ICONS.pin;
}

export const CRAVING_ICON = {
  arroz: 'arroz', tapas: 'tapas', asiatico: 'asiatico', japones: 'sushi', coreano: 'parrilla', buffet: 'sushi', pizza: 'pizza', italiano: 'pizza', burger: 'burger', valenciano: 'valenciano', nuevo: 'nuevo', dulce: 'dulce', cafe: 'cafe', esmorzar: 'esmorzar', alta_cocina: 'alta_cocina', mediterranea: 'valenciano', griega: 'nuevo', vegano: 'valenciano',
};
