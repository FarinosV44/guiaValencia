// Avisos de corrección (#22): se validan y se preparan para copiar. No se envían ni se publican solos.
import { UI } from './i18n.js';
import { escapeHtml as e } from './lib/format.js';
import { copyLink } from './site.js';

const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
const ui = UI[lang];
const form = document.getElementById('fixform');
const out = document.getElementById('fixout');
const pre = new URLSearchParams(location.search).get('local');
if (pre && [...form.elements.place.options].some((o) => o.value === pre)) form.elements.place.value = pre;

const setErr = (name, msg) => {
  document.getElementById('err-' + name).textContent = msg || '';
  form.elements[name].setAttribute('aria-invalid', msg ? 'true' : 'false');
};

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const what = form.elements.what.value.trim();
  const email = form.elements.email.value.trim();
  setErr('what', what ? '' : ui.inviteErrors.required);
  setErr('email', !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : ui.inviteErrors.email);
  if (!what) return form.elements.what.focus();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return form.elements.email.focus();
  const F = ui.fixFields;
  const place = form.elements.place.selectedOptions[0].text;
  const text = [`${F.place}: ${place} (${form.elements.place.value})`, `${F.what}: ${what}`, form.elements.source.value ? `${F.source}: ${form.elements.source.value}` : '', `${F.who}: ${ui.fixWho[form.elements.who.value]}`, email ? `${F.email}: ${email}` : ''].filter(Boolean).join('\n');
  out.innerHTML = `<p class="notice">${e(ui.fixReady)}</p><pre class="proposal">${e(text)}</pre><p><button type="button" class="btn btn--ghost" data-copy>${e(ui.inviteCopy)}</button> <span class="small" role="status" data-st></span></p>`;
  out.querySelector('[data-copy]').addEventListener('click', () => copyLink(text, out.querySelector('[data-st]'), ui.fixReady));
});
