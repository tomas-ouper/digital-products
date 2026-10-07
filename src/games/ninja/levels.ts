export interface NinjaLevel {
  title: string;
  /** letras (claves de LETTERS) o sílabas (se dibuja la primera letra) */
  pool: string[];
  syllables?: boolean;
  /** cortes correctos para ganar */
  goal: number;
}

export const NINJA_LEVELS: NinjaLevel[] = [
  { title: 'Vocales A E I O U', pool: ['A', 'E', 'I', 'O', 'U'], goal: 6 },
  { title: 'vocales a e i o u', pool: ['a', 'e', 'i', 'o', 'u'], goal: 6 },
  { title: 'Consonantes L T M', pool: ['L', 'T', 'M', 'N', 'S', 'V'], goal: 7 },
  { title: 'consonantes m s t', pool: ['l', 'm', 'n', 's', 't', 'c'], goal: 7 },
  { title: 'Sílabas', pool: ['MA', 'ME', 'LO', 'LU', 'SA', 'TE', 'NO', 'PA'], syllables: true, goal: 6 },
  { title: 'Cursiva', pool: ['c:a', 'c:e', 'c:i', 'c:o', 'c:u', 'c:l'], goal: 6 },
];
