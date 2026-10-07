// Navegación entre pantallas + reloj de tiempo diario.
import { activeProfile, addPlaySeconds, remainingTodaySec } from './state';
import { stopVoice } from './voice';

export type ScreenFn = (root: HTMLElement, params: any) => void | (() => void);

const screens = new Map<string, ScreenFn>();
let cleanup: (() => void) | null = null;
let currentName = '';

export function register(name: string, fn: ScreenFn) {
  screens.set(name, fn);
}

export function current() {
  return currentName;
}

export function go(name: string, params: any = {}) {
  const fn = screens.get(name);
  if (!fn) throw new Error('Pantalla desconocida: ' + name);
  stopVoice();
  if (cleanup) {
    try {
      cleanup();
    } catch (e) {
      console.error(e);
    }
    cleanup = null;
  }
  const app = document.getElementById('app')!;
  app.innerHTML = '';
  const root = document.createElement('div');
  app.append(root);
  currentName = name;
  const r = fn(root, params);
  if (typeof r === 'function') cleanup = r;
}

// ---- Reloj: cuenta tiempo en hub, niveles y juego; corta al llegar al límite ----
const TIMED = new Set(['hub', 'levels', 'play']);
const listeners = new Set<(remaining: number) => void>();
let pending = 0;

export function onTick(fn: (remaining: number) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function startClock() {
  setInterval(() => {
    const p = activeProfile();
    if (!p || !TIMED.has(currentName) || document.visibilityState !== 'visible') return;
    pending++;
    if (pending >= 5) {
      addPlaySeconds(p.id, pending);
      pending = 0;
    }
    const rem = remainingTodaySec(p.id) - pending;
    listeners.forEach((f) => f(rem));
    if (rem <= 0) {
      addPlaySeconds(p.id, pending);
      pending = 0;
      go('mission');
    }
  }, 1000);
  window.addEventListener('pagehide', flushClock);
  document.addEventListener('visibilitychange', flushClock);
}

export function flushClock() {
  const p = activeProfile();
  if (p && pending > 0) {
    addPlaySeconds(p.id, pending);
    pending = 0;
  }
}
