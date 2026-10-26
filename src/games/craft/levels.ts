import { tr } from '../../core/i18n';

export interface CraftLevel {
  title: string;
  kind: 'letra' | 'apilar' | 'colores' | 'inicial' | 'nombre' | 'libre';
  letter?: string;
}

export const CRAFT_LEVELS: CraftLevel[] = [
  { title: tr('Letra L', 'Letter L'), kind: 'letra', letter: 'L' },
  { title: tr('Torre de 10', 'Tower of 10'), kind: 'apilar' },
  { title: tr('Colores', 'Colors'), kind: 'colores' },
  { title: tr('Letra T', 'Letter T'), kind: 'letra', letter: 'T' },
  { title: tr('Tu inicial', 'Your initial'), kind: 'inicial' },
  { title: tr('Tu nombre', 'Your name'), kind: 'nombre' },
  { title: tr('Modo libre', 'Free mode'), kind: 'libre' },
];
