import Phaser from 'phaser';

/** Crea un juego Phaser que ocupa todo el contenedor y se adapta al tamaño. */
export function createGame(host: HTMLElement, key: string, scene: Phaser.Scene, data: object, extra: Partial<Phaser.Types.Core.GameConfig> = {}): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    backgroundColor: '#fff7ec',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: host.clientWidth || window.innerWidth,
      height: host.clientHeight || window.innerHeight,
    },
    render: { antialias: true, roundPixels: false },
    input: { activePointers: 3 },
    banner: false,
    audio: { noAudio: true },
    ...extra,
  });
  const pause = (event: Event) => {
    const value = (event as CustomEvent<boolean>).detail;
    game.scene.getScenes(false).forEach(s => {
      if (value) { if (s.sys.isActive()) s.scene.pause(); }
      else if (s.sys.isPaused()) s.scene.resume();
    });
  };
  host.addEventListener('game-pause', pause);
  game.events.once('destroy', () => host.removeEventListener('game-pause', pause));
  // Phaser inicializa los eventos de Scene durante el arranque, no en el constructor.
  const instance = scene as Phaser.Scene & { create(...args: unknown[]): void };
  const createScene = instance.create;
  instance.create = function (...args: unknown[]) {
    createScene.apply(this, args);
    if (host.dataset.paused === 'true') this.scene.pause();
  };
  game.scene.add(key, scene, true, data);
  return game;
}

/** Espera a que carguen las fuentes (Fredoka / Playwrite MX) para que Phaser las use. */
export async function fontsReady() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('700 40px Fredoka'), document.fonts.load("40px 'Playwrite MX'")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* sin fuentes: usa la de respaldo */
  }
}

export const FONT = 'Fredoka, "Arial Rounded MT Bold", sans-serif';
export const CURSIVE = '"Playwrite MX", cursive';
