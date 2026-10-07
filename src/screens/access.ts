import { h } from '../core/ui';
import { ACCESS_CODE } from '../core/config';
import { settings, saveSettings } from '../core/state';
import { go } from '../core/nav';
import { say } from '../core/voice';
import { sfx } from '../core/sound';

export function accessScreen(root: HTMLElement) {
  root.className = 'screen center';
  const input = h('input', {
    class: 'big',
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'characters',
    spellcheck: 'false',
    placeholder: 'Código',
    'aria-label': 'Código de acceso',
  });
  const err = h('div', { class: 'err' });
  const submit = () => {
    const v = input.value.trim().toUpperCase().replace(/\s+/g, '');
    if (v && v === ACCESS_CODE.replace(/\s+/g, '')) {
      settings.unlocked = true;
      saveSettings();
      sfx.good();
      go(settings.device ? 'profiles' : 'device');
    } else {
      sfx.bad();
      err.textContent = 'Ese código no es correcto. Revísalo en tu correo de compra.';
    }
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
  root.append(
    h(
      'div',
      { class: 'card col', style: { maxWidth: '520px', width: '100%' } },
      h('div', { class: 'logo' }, ...['#ff8a5b', '#ffd166', '#4cc38a', '#5b8def'].map((c) => h('span', { class: 'dot', style: { background: c } }))),
      h('h1', {}, 'Montessori Play'),
      h('p', { class: 'sub' }, 'Escribe el código de acceso que recibiste con tu compra.'),
      input,
      err,
      h('button', { class: 'btn green', onTap: submit }, 'Entrar'),
      h('p', { class: 'small-note' }, 'Para mamá o papá: el código llegó en el correo del Kit Caligrafía Montessori.')
    )
  );
  setTimeout(() => say('codigo'), 300);
}
