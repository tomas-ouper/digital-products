import { h, ICONS } from '../core/ui';
import { activeProfile, markLetter, setLevelStars } from '../core/state';
import { go } from '../core/nav';
import { say, stopVoice } from '../core/voice';
import { sfx } from '../core/sound';
import { gameById } from '../games/registry';
import type { GameInstance } from '../games/types';
import { soundToggle } from './common';

export function playScreen(root: HTMLElement, params: { game: string; level: number }) {
  const p = activeProfile();
  const g = gameById(params.game);
  if (!p || !g) return go('hub');
  root.className = 'game-wrap';
  const host = h('div', { class: 'game-host' });
  const title = h('div', { class: 'title' }, g.levels[params.level] || g.name);
  let repeatFn: (() => void) | null = null;
  const repeatBtn = h('button', { class: 'icon-btn', 'aria-label': 'Repetir consigna', html: ICONS.speak, onTap: () => repeatFn?.() });
  repeatBtn.style.visibility = 'hidden';
  const hud = h(
    'div',
    { class: 'game-hud' },
    h('button', { class: 'icon-btn', 'aria-label': 'Volver', html: ICONS.back, onTap: () => go('levels', { game: g.id }) }),
    title,
    h('div', { class: 'spacer' }),
    repeatBtn,
    soundToggle()
  );
  root.append(host, hud);
  // En celular vertical: sugerir girar (no bloquea)
  const rot = h('div', { class: 'rotate-hint' }, '📱↻ Gira el teléfono para jugar mejor');
  const updRot = () => (rot.style.display = window.innerWidth < 600 && window.innerHeight > window.innerWidth && g.id !== 'snake' ? 'block' : 'none');
  updRot();
  window.addEventListener('resize', updRot);
  root.append(rot);
  setTimeout(() => (rot.style.display = 'none'), 6000);

  let inst: GameInstance | null = null;
  let dead = false;
  let finished = false;

  const showComplete = (stars: number) => {
    const last = params.level >= g.levels.length - 1;
    const key = stars >= 3 ? 'nivel_superado_3' : stars === 2 ? 'nivel_superado_2' : 'nivel_superado';
    const ov = h(
      'div',
      { class: 'overlay' },
      h(
        'div',
        { class: 'card' },
        h('h1', {}, '¡Nivel superado!'),
        h('div', { class: 'big-stars' }, ...[0, 1, 2].map((i) => {
          const s = h('span', { html: ICONS.star(i < stars) });
          (s.firstChild as HTMLElement).style.animationDelay = i * 0.25 + 's';
          return s;
        })),
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn ghost', onTap: () => go('levels', { game: g.id }) }, 'Niveles'),
          h('button', { class: 'btn yellow', onTap: () => go('play', { game: g.id, level: params.level }) }, 'Repetir'),
          last ? null : h('button', { class: 'btn green', onTap: () => go('play', { game: g.id, level: params.level + 1 }) }, 'Siguiente ▶')
        )
      )
    );
    root.append(ov);
    sfx.win();
    for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 300 + i * 250);
    setTimeout(() => say(key), 250);
  };

  g.load()
    .then((mod) => {
      if (dead) return;
      inst = mod.start({
        host,
        level: params.level,
        profile: p,
        easy: p.age === '3-5',
        complete(stars, letters) {
          if (finished || dead) return;
          finished = true;
          const s = Math.max(1, Math.min(3, Math.round(stars)));
          setLevelStars(p.id, g.id, params.level, s);
          letters?.forEach((l) => markLetter(p.id, l));
          setTimeout(() => !dead && showComplete(s), 500);
        },
        setTitle(t) {
          title.textContent = t;
        },
        setRepeat(fn) {
          repeatFn = fn;
          repeatBtn.style.visibility = fn ? 'visible' : 'hidden';
        },
      });
    })
    .catch((e) => {
      console.error(e);
      host.append(h('div', { style: { color: '#fff', padding: '120px 20px', textAlign: 'center' } }, 'No se pudo cargar el juego. Revisa tu conexión a internet.'));
    });

  return () => {
    window.removeEventListener('resize', updRot);
    dead = true;
    stopVoice();
    try {
      inst?.destroy();
    } catch (e) {
      console.error(e);
    }
  };
}
