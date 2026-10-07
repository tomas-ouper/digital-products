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

export const CRASH_LEVELS: CrashLevel[] = [
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
