import { h } from '../core/ui';
import { settings, saveSettings, type Device } from '../core/state';
import { go } from '../core/nav';
import { say } from '../core/voice';

const ICON = {
  phone: `<svg width="56" height="56" viewBox="0 0 48 48"><rect x="14" y="4" width="20" height="40" rx="4" fill="#5b8def"/><rect x="17" y="9" width="14" height="27" rx="1.5" fill="#d9e6ff"/><circle cx="24" cy="40" r="2" fill="#fff"/></svg>`,
  tablet: `<svg width="56" height="56" viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="4" fill="#4cc38a"/><rect x="10" y="12" width="28" height="24" rx="1.5" fill="#d8f5e5"/></svg>`,
  desktop: `<svg width="56" height="56" viewBox="0 0 48 48"><rect x="4" y="8" width="40" height="26" rx="3" fill="#a98bff"/><rect x="8" y="12" width="32" height="18" rx="1.5" fill="#ece5ff"/><rect x="18" y="36" width="12" height="4" fill="#a98bff"/><rect x="12" y="40" width="24" height="3" rx="1.5" fill="#a98bff"/></svg>`,
};

export function deviceScreen(root: HTMLElement) {
  root.className = 'screen center';
  const opts: { id: Device; label: string; note: string }[] = [
    { id: 'tablet', label: 'Tablet', note: 'La mejor opción' },
    { id: 'phone', label: 'Celular', note: 'Mejor en horizontal' },
    { id: 'desktop', label: 'Computadora', note: 'Con mouse o touch' },
  ];
  const pick = (id: Device) => {
    settings.device = id;
    saveSettings();
    go('profiles');
  };
  root.append(
    h('h1', {}, '¿Desde dónde juegas?'),
    h('p', { class: 'sub' }, 'Recomendamos tablet: la pantalla es grande y los dedos trazan mejor las letras.'),
    h(
      'div',
      { class: 'choice', style: { marginTop: '18px' } },
      ...opts.map((o) =>
        h(
          'button',
          { class: 'opt' + (settings.device === o.id ? ' sel' : ''), onTap: () => pick(o.id) },
          o.id === 'tablet' ? h('span', { class: 'tag' }, 'Recomendado') : null,
          h('span', { html: ICON[o.id] }),
          o.label,
          h('small', {}, o.note)
        )
      )
    )
  );
  setTimeout(() => say('desde_donde'), 300);
}
