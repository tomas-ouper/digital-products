import { h, ICONS, starsText } from '../core/ui';
import { activeProfile, getStars } from '../core/state';
import { go } from '../core/nav';
import { say } from '../core/voice';
import { gameById } from '../games/registry';
import { iconButton, soundToggle } from './common';

export function levelsScreen(root: HTMLElement, params: { game: string }) {
  const p = activeProfile();
  const g = gameById(params.game);
  if (!p || !g) return go('hub');
  root.className = 'screen';
  const stars = getStars(p.id, g.id);
  // Desbloqueado: el primero, los ya jugados y el siguiente al último superado.
  // "Modo libre" de Montecraft siempre está abierto.
  const unlocked = (i: number) => i === 0 || (stars[i - 1] || 0) > 0 || (stars[i] || 0) > 0 || (g.id === 'craft' && i === g.levels.length - 1);
  root.append(
    h('div', { class: 'topbar' }, iconButton(ICONS.home, 'Inicio', () => go('hub')), h('h2', { style: { margin: '0 8px' } }, g.name), h('div', { class: 'spacer' }), soundToggle()),
    h(
      'div',
      { class: 'levels' },
      ...g.levels.map((title, i) =>
        h(
          'button',
          {
            class: 'level' + (unlocked(i) ? '' : ' locked'),
            onTap: () => unlocked(i) && go('play', { game: g.id, level: i, tutorial: true }),
          },
          h('span', { class: 'num' }, unlocked(i) ? String(i + 1) : '🔒'),
          h('span', { class: 'lt' }, title),
          h('span', { class: 'st', style: { color: '#e0a800' } }, starsText(stars[i] || 0))
        )
      )
    )
  );
  setTimeout(() => root.isConnected && say('elige_nivel'), 250);
}
