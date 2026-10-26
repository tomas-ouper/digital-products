import { pick } from '../../core/i18n';

export interface NinjaLevel {
  title: string;
  /** letras (claves de LETTERS) o sílabas/palabras (se dibuja la primera letra) */
  pool: string[];
  syllables?: boolean;
  /** cortes correctos para ganar */
  goal: number;
}

const NINJA_ES: NinjaLevel[] = [
  { title: 'Vocales A E I O U', pool: ['A', 'E', 'I', 'O', 'U'], goal: 6 },
  { title: 'vocales a e i o u', pool: ['a', 'e', 'i', 'o', 'u'], goal: 6 },
  { title: 'Consonantes L T M', pool: ['L', 'T', 'M', 'N', 'S', 'V'], goal: 7 },
  { title: 'consonantes m s t', pool: ['l', 'm', 'n', 's', 't', 'c'], goal: 7 },
  { title: 'Sílabas', pool: ['MA', 'ME', 'LO', 'LU', 'SA', 'TE', 'NO', 'PA'], syllables: true, goal: 6 },
  { title: 'Cursiva', pool: ['c:a', 'c:e', 'c:i', 'c:o', 'c:u', 'c:l'], goal: 6 },
];

// Inglés: las sílabas españolas (MA, ME…) no son naturales; se usan palabras CVC de lectura inicial.
const NINJA_EN: NinjaLevel[] = [
  { title: 'Vowels A E I O U', pool: ['A', 'E', 'I', 'O', 'U'], goal: 6 },
  { title: 'vowels a e i o u', pool: ['a', 'e', 'i', 'o', 'u'], goal: 6 },
  { title: 'Consonants L T M', pool: ['L', 'T', 'M', 'N', 'S', 'V'], goal: 7 },
  { title: 'consonants m s t', pool: ['l', 'm', 'n', 's', 't', 'c'], goal: 7 },
  { title: 'First words', pool: ['CAT', 'DOG', 'SUN', 'HAT', 'PIG', 'TEN', 'MOP', 'FAN'], syllables: true, goal: 6 },
  { title: 'Cursive', pool: ['c:a', 'c:e', 'c:i', 'c:o', 'c:u', 'c:l'], goal: 6 },
];

export const NINJA_LEVELS: NinjaLevel[] = pick(NINJA_ES, NINJA_EN);
