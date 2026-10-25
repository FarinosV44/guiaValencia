// Propuesta de visita financiada (#29, #41). Sin pasarela de pago y, mientras no haya canal configurado,
// sin envío: valida y prepara el texto para copiarlo.
import { UI } from './i18n.js';
import { escapeHtml as e } from './lib/format.js';

const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
const ui = UI[lang];
const form = document.getElementById('inviteform');
const out = document.getElementById('inviteout');

function setErr(name, msg) {
  const el = document.getElementById('err-' + name);
  const input = form.elements[name];
  if (el) el.textContent = msg || '';
  if (input && input.setAttribute) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  let first = null;
  for (const name of ['venue', 'address', 'contact', 'email', 'what']) {
    const v = form.elements[name].value.trim();
    let msg = v ? '' : ui.inviteErrors.required;
    if (!msg && name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = ui.inviteErrors.email;
    setErr(name, msg);
    if (msg && !first) first = form.elements[name];
  }
  const ack = form.elements.ack.checked;
  setErr('ack', ack ? '' : ui.inviteErrors.ack);
  if (!ack && !first) first = form.elements.ack;
  if (first) { first.focus(); return; }

  const F = ui.inviteFields;
  const fd = new FormData(form);
  const text = [
    `${F.venue}: ${fd.get('venue')}`,
    `${F.address}: ${fd.get('address')}`,
    `${F.contact}: ${fd.get('contact')} <${fd.get('email')}>`,
    `${F.support}: ${ui.inviteSupport[fd.get('support')]}`,
    `${F.what}: ${fd.get('what')}`,
    '',
    F.ack,
  ].join('\n');
  out.innerHTML = `<p role="status"><strong>${e(ui.inviteReady)}</strong></p><pre id="proposal">${e(text)}</pre><button class="btn btn--ghost" type="button" id="copy">${e(ui.inviteCopy)}</button>`;
  document.getElementById('copy').addEventListener('click', () => navigator.clipboard?.writeText(text));
});
