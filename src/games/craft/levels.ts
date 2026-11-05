import { tr } from '../../core/i18n';

export interface CraftLevel {
  title: string;
  kind: 'letra' | 'apilar' | 'colores' | 'inicial' | 'nombre' | 'libre';
  letter?: string;
}

export const CRAFT_LEVELS: CraftLevel[] = [
  { title: tr('Letra L', 'Letter L', 'Lettre L'), kind: 'letra', letter: 'L' },
  { title: tr('Torre de 10', 'Tower of 10', 'Tour de 10'), kind: 'apilar' },
  { title: tr('Colores', 'Colors', 'Couleurs'), kind: 'colores' },
  { title: tr('Letra T', 'Letter T', 'Lettre T'), kind: 'letra', letter: 'T' },
  { title: tr('Tu inicial', 'Your initial', 'Ton initiale'), kind: 'inicial' },
  { title: tr('Tu nombre', 'Your name', 'Ton prénom'), kind: 'nombre' },
  { title: tr('Modo libre', 'Free mode', 'Mode libre'), kind: 'libre' },
];
