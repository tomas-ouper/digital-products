import type { GameDef } from './types';
import { SNAKE_LEVELS } from './snake/levels';
import { NINJA_LEVELS } from './ninja/levels';
import { CRASH_LEVELS } from './crash/levels';
import { ANGRY_LEVELS } from './angry/levels';
import { CRAFT_LEVELS } from './craft/levels';
import { glyph, isCursive } from '../core/letters';
import { ART } from './art';

const letterTitle = (k: string) => (isCursive(k) ? `${glyph(k)} cursiva` : glyph(k));

export const GAMES: GameDef[] = [
  {
    id: 'snake',
    name: 'Snake Lecto',
    desc: 'Lleva a la viborita por el trazo de cada letra.',
    color: '#4cc38a',
    ready: true,
    levels: SNAKE_LEVELS.map(letterTitle),
    art: ART.snake,
    load: () => import('./snake/snake'),
  },
  {
    id: 'ninja',
    name: 'Trazo Ninja',
    desc: 'Dibuja la letra con tu dedo para cortarla.',
    color: '#ff8a5b',
    ready: true,
    levels: NINJA_LEVELS.map((l) => l.title),
    art: ART.ninja,
    load: () => import('./ninja/ninja'),
  },
  {
    id: 'crash',
    name: 'CaliCrash',
    desc: 'Junta letras iguales y forma palabras.',
    color: '#a98bff',
    ready: true,
    levels: CRASH_LEVELS.map((l) => l.title),
    art: ART.crash,
    load: () => import('./crash/crash'),
  },
  {
    id: 'angry',
    name: 'Angry Forms',
    desc: 'Lanza formas y derriba torres.',
    color: '#5b8def',
    ready: true,
    levels: ANGRY_LEVELS.map((l) => l.title),
    art: ART.angry,
    load: () => import('./angry/angry'),
  },
  {
    id: 'craft',
    name: 'Montecraft',
    desc: 'Construye letras y torres con bloques en 3D.',
    color: '#ffc93c',
    ready: true,
    levels: CRAFT_LEVELS.map((l) => l.title),
    art: ART.craft,
    load: () => import('./craft/craft'),
  },
];

export function gameById(id: string) {
  return GAMES.find((g) => g.id === id);
}
