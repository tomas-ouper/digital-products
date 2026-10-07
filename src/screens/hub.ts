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

  const floaters = h('div', { class: 'floaters' });
  const items = ['A', 'm', '★', 'o', '▲', 'S', '●', 'e', '◆', 'L', '■', 'u'];
  const cols = ['#ff8a5b', '#5b8def', '#4cc38a', '#ffc93c', '#a98bff', '#ff8fb1'];
  items.forEach((t, i) => {
    const sp = h('span', {}, t);
    sp.style.left = ((i * 83) % 100) + '%';
    sp.style.top = ((i * 37) % 90) + 5 + '%';
    sp.style.color = cols[i % cols.length];
    sp.style.animationDelay = -i * 1.3 + 's';
    sp.style.fontSize = 28 + ((i * 13) % 40) + 'px';
    floaters.append(sp);
  });
  const logo = h(
    'div',
    { class: 'hub-logo' },
    h('span', { class: 'wm' }, ...[...'Montessori'].map((c, i) => h('b', { style: { color: cols[i % cols.length], animationDelay: i * 0.08 + 's' } }, c))),
    h('span', { class: 'wm2' }, 'Play')
  );
  root.append(
    floaters,
    h(
      'div',
      { class: 'topbar' },
      h('button', { class: 'who', onTap: () => go('profiles') }, h('span', { html: avatarSvg(p.avatar, 56) }), h('span', { class: 'n' }, p.name)),
      h('span', { class: 'pill' }, '⭐ ' + totalStars(p.id)),
      h('div', { class: 'spacer' }),
      soundToggle(),
      iconButton(ICONS.lock, 'Padres', () => go('parents'))
    ),
    logo,
    h('div', { class: 'counter' }, '🎮 5 juegos hoy · +15 para fin de año'),
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
          g.ready ? h('span', { class: 'play-badge' }, '▶') : null,
          g.ready ? null : h('span', { class: 'soon-tag' }, 'Muy pronto'),
          h('div', { class: 'info' }, h('div', { class: 't' }, g.name), h('div', { class: 'd' }, g.desc), g.ready ? h('div', { class: 'stars' }, `★ ${stars} / ${g.levels.length * 3}`) : null)
        );
      })
    )
  );
  setTimeout(() => say('hola_nombre', { nombre: p.name }), 250);
  return () => off();
}
