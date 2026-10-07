import { h, ICONS } from '../core/ui';
import { avatarSvg } from '../core/avatars';
import { activeProfile, getStars, remainingTodaySec, settings, totalStars } from '../core/state';
import { go, onTick } from '../core/nav';
import { say } from '../core/voice';
import { GAMES } from '../games/registry';
import { iconButton, soundToggle } from './common';

export function hubScreen(root: HTMLElement) {
  const p = activeProfile();
  if (!p) return go('profiles');
  if (remainingTodaySec(p.id) <= 0) return go('mission');
  root.className = 'screen';

  const timeFill = h('div');
  const timeLabel = h('span');
  const updTime = (rem: number) => {
    if (!settings.dailyLimitMin) {
      timeLabel.textContent = 'Sin límite de tiempo';
      timeFill.style.width = '100%';
      return;
    }
    const total = settings.dailyLimitMin * 60;
    const m = Math.max(0, Math.ceil(rem / 60));
    timeLabel.textContent = `Te quedan ${m} min de juego hoy`;
    timeFill.style.width = Math.max(0, Math.min(100, (rem / total) * 100)) + '%';
  };
  updTime(remainingTodaySec(p.id));
  const off = onTick(updTime);

  root.append(
    h(
      'div',
      { class: 'topbar' },
      h('button', { class: 'who', onTap: () => go('profiles') }, h('span', { html: avatarSvg(p.avatar, 56) }), h('span', { class: 'n' }, p.name)),
      h('span', { class: 'pill' }, '⭐ ' + totalStars(p.id)),
      h('div', { class: 'spacer' }),
      soundToggle(),
      iconButton(ICONS.lock, 'Padres', () => go('parents'))
    ),
    h('div', { class: 'counter' }, '5 juegos hoy · +15 para fin de año'),
    h('div', { class: 'col', style: { gap: '4px', marginBottom: '14px', width: '100%' } }, h('div', { class: 'timebar' }, timeFill), h('small', { class: 'sub' }, timeLabel)),
    h(
      'div',
      { class: 'games' },
      ...GAMES.map((g) => {
        const stars = getStars(p.id, g.id).reduce((a, b) => a + (b || 0), 0);
        return h(
          'button',
          {
            class: 'game-card' + (g.ready ? '' : ' soon'),
            onTap: () => {
              if (!g.ready) {
                say('muy_pronto');
                return;
              }
              go('levels', { game: g.id });
            },
          },
          h('div', { class: 'art', html: g.art, style: { background: g.color } }),
          g.ready ? null : h('span', { class: 'soon-tag' }, 'Muy pronto'),
          h('div', { class: 'info' }, h('div', { class: 't' }, g.name), h('div', { class: 'd' }, g.desc), g.ready ? h('div', { class: 'stars' }, `★ ${stars} / ${g.levels.length * 3}`) : null)
        );
      })
    )
  );
  setTimeout(() => say('hola_nombre', { nombre: p.name }), 250);
  return () => off();
}
