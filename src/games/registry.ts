import type { GameDef } from './types';
import { SNAKE_LEVELS } from './snake/levels';
import { NINJA_LEVELS } from './ninja/levels';
import { CRASH_LEVELS } from './crash/levels';
import { ANGRY_LEVELS } from './angry/levels';
import { CRAFT_LEVELS } from './craft/levels';
import { glyph, isCursive } from '../core/letters';
import { ART } from './art';
import { tr } from '../core/i18n';

const letterTitle = (k: string) => (isCursive(k) ? tr(`${glyph(k)} cursiva`, `cursive ${glyph(k)}`, `${glyph(k)} en cursive`) : glyph(k));

export const GAMES: GameDef[] = [
  {
    id: 'snake',
    name: tr('Snake Lecto', 'Letter Snake', 'Le Serpent des lettres'),
    desc: tr('Lleva a la viborita por el trazo de cada letra.', 'Guide the little snake along each letter.', 'Guide le petit serpent sur le tracé de chaque lettre.'),
    color: '#4cc38a',
    ready: true,
    levels: SNAKE_LEVELS.map(letterTitle),
    art: ART.snake,
    load: () => import('./snake/snake'),
  },
  {
    id: 'ninja',
    name: tr('Trazo Ninja', 'Trace Ninja', 'Ninja du tracé'),
    desc: tr('Dibuja la letra con tu dedo para cortarla.', 'Draw the letter with your finger to cut it.', 'Dessine la lettre avec ton doigt pour la couper.'),
    color: '#ff8a5b',
    ready: true,
    levels: NINJA_LEVELS.map((l) => l.title),
    art: ART.ninja,
    load: () => import('./ninja/ninja'),
  },
  {
    id: 'crash',
    name: 'CaliCrash',
    desc: tr('Junta letras iguales y forma palabras.', 'Match letters and make words.', 'Assemble des lettres identiques et forme des mots.'),
    color: '#a98bff',
    ready: true,
    levels: CRASH_LEVELS.map((l) => l.title),
    art: ART.crash,
    load: () => import('./crash/crash'),
  },
  {
    id: 'angry',
    name: tr('Angry Forms', 'Angry Shapes', 'Lance-formes'),
    desc: tr('Lanza formas y derriba torres.', 'Throw shapes and knock down towers.', 'Lance des formes et fais tomber les tours.'),
    color: '#5b8def',
    ready: true,
    levels: ANGRY_LEVELS.map((l) => l.title),
    art: ART.angry,
    load: () => import('./angry/angry'),
  },
  {
    id: 'craft',
    name: 'Montecraft',
    desc: tr('Construye letras y torres con bloques en 3D.', 'Build letters and towers with 3D blocks.', 'Construis des lettres et des tours avec des blocs en 3D.'),
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
