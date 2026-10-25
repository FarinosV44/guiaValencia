// «Mi plan» (#24): lee lo guardado en este navegador o un enlace compartido (?l=id1,id2).
// El enlace solo lleva identificadores de locales: ni ubicación, ni edades, ni datos personales.
import { readSaved, writeSaved, copyLink } from './site.js';

const catalog = JSON.parse(document.getElementById('saved-catalog').textContent);
const ui = JSON.parse(document.getElementById('saved-ui').textContent);
const box = document.getElementById('saved');
const e = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sharedIds = (new URLSearchParams(location.search).get('l') || '').split(',').filter((id) => catalog[id]).slice(0, 20);

function render() {
  const shared = sharedIds.length > 0;
  const list = shared ? sharedIds.map((id) => ({ id })) : readSaved().filter((x) => catalog[x.id]);
  if (!list.length) { box.innerHTML = `<p>${e(ui.empty)}</p>`; return; }
  const items = list.map((x) => {
    const p = catalog[x.id];
    const changed = x.checked && x.checked !== p.checked ? `<p class="small notice">${e(ui.changed)}</p>` : '';
    return `<li class="famcard"><h2 class="ticket__name"><a href="${p.url}">${e(p.name)}</a></h2><p class="ticket__meta">${e(p.type)}${p.zone ? ', ' + e(p.zone) : ''}</p><p>${e(p.fits)}</p>${changed}<p><a href="${e(p.maps)}" rel="nofollow noopener">${e(ui.maps)}</a>${shared ? '' : ` · <button type="button" class="linkbtn" data-remove="${e(x.id)}">${e(ui.remove)}</button>`}</p></li>`;
  }).join('');
  const shareUrl = location.origin + location.pathname + '?l=' + list.map((x) => x.id).join(',');
  box.innerHTML = `${shared ? `<p><strong>${e(ui.shared)}</strong></p>` : ''}<ul class="savedlist famgrid">${items}</ul>
  <p>${shared ? `<button type="button" class="btn" data-keep>${e(ui.keep)}</button>` : `<button type="button" class="btn" data-share>${e(ui.share)}</button>`}</p><p class="small" role="status" data-status></p>`;
  box.querySelector('[data-share]')?.addEventListener('click', () => copyLink(shareUrl, box.querySelector('[data-status]'), ui.copied));
  box.querySelector('[data-keep]')?.addEventListener('click', () => {
    const mine = readSaved();
    for (const id of sharedIds) if (!mine.some((x) => x.id === id)) mine.push({ id, checked: catalog[id].checked, savedOn: new Date().toISOString().slice(0, 10) });
    writeSaved(mine);
    history.replaceState(null, '', location.pathname);
    location.reload();
  });
  for (const b of box.querySelectorAll('[data-remove]')) b.addEventListener('click', () => { writeSaved(readSaved().filter((x) => x.id !== b.dataset.remove)); render(); });
}
render();
