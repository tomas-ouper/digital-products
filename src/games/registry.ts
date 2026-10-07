import type { GameDef } from './types';
import { SNAKE_LEVELS } from './snake/levels';
import { NINJA_LEVELS } from './ninja/levels';
import { CRASH_LEVELS } from './crash/levels';
import { ANGRY_LEVELS } from './angry/levels';
import { CRAFT_LEVELS } from './craft/levels';
import { glyph, isCursive } from '../core/letters';

const letterTitle = (k: string) => (isCursive(k) ? `${glyph(k)} cursiva` : glyph(k));

export const GAMES: GameDef[] = [
  {
    id: 'snake',
    name: 'Snake Lecto',
    desc: 'Lleva a la viborita por el trazo de cada letra.',
    color: '#4cc38a',
    ready: true,
    levels: SNAKE_LEVELS.map(letterTitle),
    art: `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#c8f0d8"/>
      <text x="80" y="100" font-family="Fredoka" font-weight="700" font-size="104" text-anchor="middle" fill="#fff" stroke="#9fdcb8" stroke-width="3">a</text>
      <path d="M30 96 Q50 70 70 90 T110 84" stroke="#2fa36b" stroke-width="13" fill="none" stroke-linecap="round"/>
      <circle cx="112" cy="83" r="11" fill="#2fa36b"/><circle cx="115" cy="79" r="3.2" fill="#fff"/><circle cx="116" cy="79" r="1.6" fill="#3a3f6b"/>
      <circle cx="132" cy="64" r="5" fill="#ff8a5b"/><circle cx="140" cy="44" r="5" fill="#ff8a5b"/></svg>`,
    load: () => import('./snake/snake'),
  },
  {
    id: 'ninja',
    name: 'Trazo Ninja',
    desc: 'Dibuja la letra con tu dedo para cortarla.',
    color: '#ff8a5b',
    ready: true,
    levels: NINJA_LEVELS.map((l) => l.title),
    art: `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#ffe0cf"/>
      <circle cx="52" cy="58" r="26" fill="#ffd166"/><text x="52" y="70" font-family="Fredoka" font-weight="700" font-size="34" text-anchor="middle" fill="#3a3f6b">M</text>
      <circle cx="112" cy="40" r="22" fill="#a98bff"/><text x="112" y="51" font-family="Fredoka" font-weight="700" font-size="30" text-anchor="middle" fill="#fff">o</text>
      <path d="M20 104 L140 18" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M20 104 L140 18" stroke="#ff8a5b" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    load: () => import('./ninja/ninja'),
  },
  {
    id: 'crash',
    name: 'CaliCrash',
    desc: 'Junta letras iguales y forma palabras.',
    color: '#a98bff',
    ready: true,
    levels: CRASH_LEVELS.map((l) => l.title),
    art: `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#e6ddff"/>
      ${[0, 1, 2]
        .map((r) =>
          [0, 1, 2, 3]
            .map((c) => {
              const cols = ['#ff8a5b', '#5b8def', '#4cc38a', '#ffc93c'];
              const ch = ['S', 'O', 'L', 'A'];
              const i = (r + c) % 4;
              const x = 22 + c * 30, y = 18 + r * 30;
              return `<rect x="${x}" y="${y + 3}" width="26" height="26" rx="7" fill="#0002"/><rect x="${x}" y="${y}" width="26" height="26" rx="7" fill="${cols[i]}"/><rect x="${x + 3}" y="${y + 3}" width="20" height="8" rx="4" fill="#fff6"/><text x="${x + 13}" y="${y + 20}" font-family="Fredoka" font-weight="700" font-size="17" text-anchor="middle" fill="#fff">${ch[i]}</text>`;
            })
            .join('')
        )
        .join('')}</svg>`,
    load: () => import('./crash/crash'),
  },
  {
    id: 'angry',
    name: 'Angry Forms',
    desc: 'Lanza formas y derriba torres.',
    color: '#5b8def',
    ready: false,
    levels: ANGRY_LEVELS.map((l) => l.title),
    art: `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#d4e6ff"/><rect y="100" width="160" height="20" fill="#7fcf8f"/>
      <path d="M26 100 L32 64 M40 100 L34 64" stroke="#9a6a45" stroke-width="6" stroke-linecap="round"/>
      <circle cx="33" cy="58" r="10" fill="#ff8a5b"/>
      <rect x="100" y="70" width="12" height="30" fill="#ffc93c"/><rect x="128" y="70" width="12" height="30" fill="#ffc93c"/>
      <rect x="96" y="60" width="48" height="10" fill="#5b8def"/><path d="M120 34 L134 60 L106 60Z" fill="#4cc38a"/>
      <circle cx="120" cy="88" r="9" fill="#a98bff"/></svg>`,
    load: () => import('./angry/angry'),
  },
  {
    id: 'craft',
    name: 'Montecraft',
    desc: 'Construye letras y torres con bloques en 3D.',
    color: '#ffc93c',
    ready: false,
    levels: CRAFT_LEVELS.map((l) => l.title),
    art: `<svg viewBox="0 0 160 120"><rect width="160" height="120" fill="#fff0c2"/>
      ${[
        [58, 70, '#7fcf6a'], [82, 70, '#7fcf6a'], [70, 52, '#d96c4a'], [94, 52, '#5b8def'], [82, 34, '#ffc93c'],
      ]
        .map(([x, y, c]) => `<path d="M${x} ${+y + 7} l12 -7 l12 7 l-12 7z" fill="#fff8"/><path d="M${x} ${+y + 7} l12 7 v14 l-12 -7z" fill="${c}"/><path d="M${+x + 12} ${+y + 14} l12 -7 v14 l-12 7z" fill="${c}" opacity=".75"/><path d="M${x} ${+y + 7} l12 -7 l12 7 l-12 7z" fill="${c}" opacity=".55"/>`)
        .join('')}</svg>`,
    load: () => import('./craft/craft'),
  },
];

export function gameById(id: string) {
  return GAMES.find((g) => g.id === id);
}
