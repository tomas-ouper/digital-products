import { pick } from '../../core/i18n';

export interface CrashLevel {
  title: string;
  kind: 'tacha' | 'palabra';
  /** tacha: letra objetivo y cantidad */
  letter?: string;
  count: number;
  /** palabra: palabra a formar `count` veces */
  word?: string;
  pool: string[];
  moves: number;
  cursive?: boolean;
}

const CRASH_ES: CrashLevel[] = [
  { title: 'Tacha 6 A', kind: 'tacha', letter: 'A', count: 6, pool: ['A', 'E', 'O', 'S'], moves: 16 },
  { title: 'Tacha 9 O', kind: 'tacha', letter: 'O', count: 9, pool: ['A', 'E', 'O', 'S', 'L'], moves: 18 },
  { title: 'Forma SOL', kind: 'palabra', word: 'SOL', count: 2, pool: ['S', 'O', 'L', 'A', 'E'], moves: 20 },
  { title: 'Tacha 12 M', kind: 'tacha', letter: 'M', count: 12, pool: ['M', 'A', 'S', 'O', 'E'], moves: 20 },
  { title: 'Forma MESA', kind: 'palabra', word: 'MESA', count: 2, pool: ['M', 'E', 'S', 'A', 'O'], moves: 22 },
  { title: 'Tacha 12 L', kind: 'tacha', letter: 'L', count: 12, pool: ['L', 'U', 'N', 'A', 'S', 'O'], moves: 20 },
  { title: 'Forma LUNA', kind: 'palabra', word: 'LUNA', count: 2, pool: ['L', 'U', 'N', 'A', 'S'], moves: 22 },
  { title: 'Tacha 9 a cursiva', kind: 'tacha', letter: 'a', count: 9, pool: ['a', 'e', 'o', 's', 'm'], moves: 18, cursive: true },
  { title: 'Forma sol cursiva', kind: 'palabra', word: 'sol', count: 2, pool: ['s', 'o', 'l', 'a', 'e'], moves: 22, cursive: true },
  { title: 'Forma casa cursiva', kind: 'palabra', word: 'casa', count: 2, pool: ['c', 'a', 's', 'o', 'e'], moves: 24, cursive: true },
];

// Inglés: mismas letras para tachar; palabras de lectura inicial en inglés en vez de SOL, MESA, LUNA, sol y casa.
const CRASH_EN: CrashLevel[] = [
  { title: 'Cross out 6 A', kind: 'tacha', letter: 'A', count: 6, pool: ['A', 'E', 'O', 'S'], moves: 16 },
  { title: 'Cross out 9 O', kind: 'tacha', letter: 'O', count: 9, pool: ['A', 'E', 'O', 'S', 'L'], moves: 18 },
  { title: 'Make SUN', kind: 'palabra', word: 'SUN', count: 2, pool: ['S', 'U', 'N', 'A', 'E'], moves: 20 },
  { title: 'Cross out 12 M', kind: 'tacha', letter: 'M', count: 12, pool: ['M', 'A', 'S', 'O', 'E'], moves: 20 },
  { title: 'Make STAR', kind: 'palabra', word: 'STAR', count: 2, pool: ['S', 'T', 'A', 'R', 'O'], moves: 22 },
  { title: 'Cross out 12 L', kind: 'tacha', letter: 'L', count: 12, pool: ['L', 'I', 'O', 'N', 'S', 'A'], moves: 20 },
  { title: 'Make LION', kind: 'palabra', word: 'LION', count: 2, pool: ['L', 'I', 'O', 'N', 'S'], moves: 22 },
  { title: 'Cross out 9 cursive a', kind: 'tacha', letter: 'a', count: 9, pool: ['a', 'e', 'o', 's', 'm'], moves: 18, cursive: true },
  { title: 'Make cursive sun', kind: 'palabra', word: 'sun', count: 2, pool: ['s', 'u', 'n', 'a', 'e'], moves: 22, cursive: true },
  { title: 'Make cursive cake', kind: 'palabra', word: 'cake', count: 2, pool: ['c', 'a', 'k', 'e', 's'], moves: 24, cursive: true },
];

// Francés: mismas letras para tachar (la L con LUNE); palabras de lectura inicial sin tildes: AMI, ROSE, LUNE, ami y chat.
const CRASH_FR: CrashLevel[] = [
  { title: 'Barre 6 A', kind: 'tacha', letter: 'A', count: 6, pool: ['A', 'E', 'O', 'S'], moves: 16 },
  { title: 'Barre 9 O', kind: 'tacha', letter: 'O', count: 9, pool: ['A', 'E', 'O', 'S', 'L'], moves: 18 },
  { title: 'Forme AMI', kind: 'palabra', word: 'AMI', count: 2, pool: ['A', 'M', 'I', 'E', 'S'], moves: 20 },
  { title: 'Barre 12 M', kind: 'tacha', letter: 'M', count: 12, pool: ['M', 'A', 'S', 'O', 'E'], moves: 20 },
  { title: 'Forme ROSE', kind: 'palabra', word: 'ROSE', count: 2, pool: ['R', 'O', 'S', 'E', 'A'], moves: 22 },
  { title: 'Barre 12 L', kind: 'tacha', letter: 'L', count: 12, pool: ['L', 'U', 'N', 'E', 'S', 'A'], moves: 20 },
  { title: 'Forme LUNE', kind: 'palabra', word: 'LUNE', count: 2, pool: ['L', 'U', 'N', 'E', 'S'], moves: 22 },
  { title: 'Barre 9 a en cursive', kind: 'tacha', letter: 'a', count: 9, pool: ['a', 'e', 'o', 's', 'm'], moves: 18, cursive: true },
  { title: 'Forme ami en cursive', kind: 'palabra', word: 'ami', count: 2, pool: ['a', 'm', 'i', 'e', 's'], moves: 22, cursive: true },
  { title: 'Forme chat en cursive', kind: 'palabra', word: 'chat', count: 2, pool: ['c', 'h', 'a', 't', 's'], moves: 24, cursive: true },
];

export const CRASH_LEVELS: CrashLevel[] = pick(CRASH_ES, CRASH_EN, CRASH_FR);
