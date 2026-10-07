import { h, ICONS } from '../core/ui';
import { activeProfile, markLetter, setLevelStars, settings } from '../core/state';
import { go } from '../core/nav';
import { say, stopVoice } from '../core/voice';
import { sfx } from '../core/sound';
import { gameById } from '../games/registry';
import type { GameInstance } from '../games/types';
import { soundToggle } from './common';
import { TUTORIALS } from '../games/tutorials';
import { sayText } from '../core/voice';

/** Pantalla completa + orientación horizontal (Android; en iOS no se puede forzar). */
function tryLandscape() {
  try {
    const el = document.documentElement as any;
    const lock = () => (screen.orientation as any)?.lock?.('landscape').catch(() => {});
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(lock).catch(() => {});
    else lock();
  } catch {
    /* no soportado */
  }
}

export function playScreen(root: HTMLElement, params: { game: string; level: number; tutorial?: boolean }) {
  const p0 = activeProfile();
  const g0 = gameById(params.game);
  if (!p0 || !g0) return go('hub');
  const p = p0;
  const g = g0;
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
    h('button', { class: 'icon-btn help-btn', 'aria-label': 'Cómo se juega', onTap: () => showTutorial(false) }, '?'),
    soundToggle()
  );
  root.append(host, hud);
  let tutorialOpen = false;
  let inst: GameInstance | null = null;
  let dead = false;
  let finished = false;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
    timers.add(id); return id;
  };
  const syncPause = () => {
    const paused = tutorialOpen || rot.style.display === 'flex' || document.hidden || finished;
    host.dataset.paused = String(paused);
    host.dispatchEvent(new CustomEvent('game-pause', { detail: paused }));
    inst?.setPaused?.(paused);
  };
  document.addEventListener('visibilitychange', syncPause);
  // En celular: se juega en horizontal. Si está vertical, pantalla clara para girar.
  const isPhone = () => !location.search.includes('rec') && (settings.device === 'phone' || Math.min(window.screen.width, window.screen.height) < 600);
  let rotDismissed = false;
  const rot = h(
    'div',
    { class: 'rotate-overlay' },
    h('div', { class: 'rot-phone', html: '<svg viewBox="0 0 60 100" width="70" height="116"><rect x="4" y="4" width="52" height="92" rx="10" fill="#fff" stroke="#3a3f6b" stroke-width="5"/><rect x="11" y="14" width="38" height="66" rx="3" fill="#5b8def"/><circle cx="30" cy="88" r="3.5" fill="#3a3f6b"/></svg>' }),
    h('h1', {}, 'Gira tu teléfono'),
    h('p', {}, 'Los juegos se juegan con el teléfono acostado (horizontal).'),
    h('button', { class: 'btn green', onTap: () => tryLandscape() }, '↻ Girar pantalla'),
    h('button', { class: 'btn ghost small', onTap: () => ((rotDismissed = true), updRot()) }, 'Jugar así igual')
  );
  const updRot = () => {
    const show = isPhone() && window.innerHeight > window.innerWidth && !rotDismissed;
    rot.style.display = show ? 'flex' : 'none';
    syncPause();
  };
  updRot();
  window.addEventListener('resize', updRot);
  root.append(rot);
  if (rot.style.display === 'flex') later(() => sayText('Gira tu teléfono para jugar.'), 400);

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
    for (let i = 0; i < stars; i++) later(() => sfx.star(i), 300 + i * 250);
    later(() => say(key), 250);
  };

  const levelBanner = () => {
    const b = h('div', { class: 'level-banner' }, h('small', {}, `Nivel ${params.level + 1}`), h('span', {}, g.levels[params.level] || ''));
    root.append(b);
    later(() => b.remove(), 2200);
  };

  const tut = TUTORIALS[g.id];
  let started = false;
  function showTutorial(first: boolean) {
    if (!tut) return startGame();
    if (tutorialOpen) return;
    tutorialOpen = true;
    syncPause();
    const ov = h(
      'div',
      { class: 'overlay tutorial' },
      h(
        'div',
        { class: 'card' },
        h('div', { class: 'tut-head', style: { background: g.color }, html: g.art }),
        h('div', { class: 'tut-kicker' }, 'Cómo se juega'),
        h('h1', {}, g.name),
        h('p', { class: 'tut-goal' }, tut.goal),
        h('ol', { class: 'tut-steps' }, ...tut.steps.map(([ic, tx]) => h('li', {}, h('span', { class: 'ic' }, ic), h('span', {}, tx)))),
        h('p', { class: 'tut-levels' }, '🗺️ ' + tut.levels),
        h(
          'button',
          {
            class: 'btn green tut-go',
            onTap: () => {
              ov.remove();
              tutorialOpen = false;
              syncPause();
              stopVoice();
              if (first) startGame();
            },
          },
          first ? '¡A jugar! ▶' : 'Seguir jugando'
        )
      )
    );
    root.append(ov);
    sayText(tut.goal);
  }

  function startGame() {
  if (started) return;
  started = true;
  if (isPhone()) tryLandscape();
  levelBanner();
  g!.load()
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
          syncPause();
          const s = Math.max(1, Math.min(3, Math.round(stars)));
          setLevelStars(p.id, g.id, params.level, s);
          letters?.forEach((l) => markLetter(p.id, l));
          later(() => !dead && showComplete(s), 500);
        },
        setTitle(t) {
          title.textContent = t;
        },
        setRepeat(fn) {
          repeatFn = fn;
          repeatBtn.style.visibility = fn ? 'visible' : 'hidden';
        },
      });
      syncPause();
    })
    .catch((e) => {
      if (dead) return;
      console.error(e);
      host.append(h('div', { style: { color: '#fff', padding: '120px 20px', textAlign: 'center' } }, 'No se pudo cargar el juego. Revisa tu conexión a internet.'));
    });
  }

  if (params.tutorial) showTutorial(true);
  else startGame();

  return () => {
    window.removeEventListener('resize', updRot);
    dead = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('visibilitychange', syncPause);
    stopVoice();
    try {
      inst?.destroy();
    } catch (e) {
      console.error(e);
    }
  };
}
