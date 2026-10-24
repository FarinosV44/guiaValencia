// Comportamiento común, mejora progresiva: sin JS todo sigue siendo navegable.
// 1) El cambio de idioma conserva filtros y plan (#42).
const lang = document.querySelector('a.lang[data-keep-query="1"]');
if (lang) {
  lang.addEventListener('click', () => {
    if (location.search) lang.href = lang.getAttribute('href').split('?')[0] + location.search;
  });
}

// 2) Familias: ocultar pendientes cuando se exige juego sin pantallas confirmado.
for (const box of document.querySelectorAll('input[data-hide]')) {
  const target = document.querySelector(box.dataset.hide);
  const sync = () => { if (target) target.hidden = box.checked; };
  box.addEventListener('change', sync);
  sync();
}
