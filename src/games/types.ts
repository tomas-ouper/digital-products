import type { Profile } from '../core/state';

export interface GameContext {
  host: HTMLElement;
  level: number;
  profile: Profile;
  /** true para 3-5 años: más lento, más tolerante, menos elementos */
  easy: boolean;
  /** Llamar al superar el nivel (1-3 estrellas). `letters`: letras dominadas para el panel de padres. */
  complete(stars: number, letters?: string[]): void;
  /** Cambia el texto de la consigna arriba */
  setTitle(text: string): void;
  /** Botón 🔊 de repetir consigna */
  setRepeat(fn: (() => void) | null): void;
}

export interface GameInstance {
  destroy(): void;
}

export interface GameModule {
  start(ctx: GameContext): GameInstance;
}

export interface GameDef {
  id: string;
  name: string;
  desc: string;
  color: string;
  art: string;
  ready: boolean;
  levels: string[];
  load: () => Promise<GameModule>;
}
