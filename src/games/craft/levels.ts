export interface CraftLevel {
  title: string;
  kind: 'letra' | 'apilar' | 'colores' | 'inicial' | 'nombre' | 'libre';
  letter?: string;
}

export const CRAFT_LEVELS: CraftLevel[] = [
  { title: 'Letra L', kind: 'letra', letter: 'L' },
  { title: 'Torre de 10', kind: 'apilar' },
  { title: 'Colores', kind: 'colores' },
  { title: 'Letra T', kind: 'letra', letter: 'T' },
  { title: 'Tu inicial', kind: 'inicial' },
  { title: 'Tu nombre', kind: 'nombre' },
  { title: 'Modo libre', kind: 'libre' },
];
