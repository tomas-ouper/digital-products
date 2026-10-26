import { tr } from '../../core/i18n';

export type ShapeKind = 'circulo' | 'cuadrado' | 'triangulo' | 'rectangulo' | 'rombo' | 'estrella';

export interface Block {
  k: ShapeKind;
  /** posición en unidades de mundo (x desde la izquierda de la estructura, y desde el piso hacia arriba) */
  x: number;
  y: number;
  /** tamaño en unidades (ancho para rectángulo) */
  s?: number;
  target?: boolean;
  angle?: number;
}

export interface AngryLevel {
  title: string;
  /** formas para elegir (si hay más de una, la consigna indica cuál) */
  tray: ShapeKind[];
  /** forma que hay que lanzar */
  launch: ShapeKind;
  /** consigna */
  say: { key: string; vars?: Record<string, string> };
  blocks: Block[];
  shots: number;
  /** si true, derribar formas que no son objetivo resta estrellas */
  only?: boolean;
}

// Unidad de mundo = 1 cuadrado chico. x: centro horizontal relativo a la estructura; y: base del bloque desde el piso.
// Rectángulo: s = largo (por defecto 2), grosor 0.5; angle 90 = vertical.
export const ANGRY_LEVELS: AngryLevel[] = [
  {
    title: tr('Lanza el círculo', 'Throw the circle'),
    tray: ['circulo'],
    launch: 'circulo',
    say: { key: 'angry_lanza', vars: { forma: tr('círculo', 'circle') } },
    shots: 4,
    blocks: [
      { k: 'cuadrado', x: 0, y: 0, target: true },
      { k: 'cuadrado', x: 0, y: 1, target: true },
      { k: 'cuadrado', x: 0, y: 2, target: true },
    ],
  },
  {
    title: tr('Lanza el cuadrado', 'Throw the square'),
    tray: ['cuadrado'],
    launch: 'cuadrado',
    say: { key: 'angry_lanza', vars: { forma: tr('cuadrado', 'square') } },
    shots: 4,
    blocks: [
      { k: 'rectangulo', x: -1, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 1, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2, s: 3 },
      { k: 'circulo', x: 0, y: 0, target: true },
      { k: 'triangulo', x: 0, y: 2.5, target: true },
    ],
  },
  {
    title: tr('Elige el triángulo', 'Pick the triangle'),
    tray: ['circulo', 'cuadrado', 'triangulo'],
    launch: 'triangulo',
    say: { key: 'angry_elige', vars: { forma: tr('triángulo', 'triangle') } },
    shots: 4,
    blocks: [
      { k: 'cuadrado', x: -0.5, y: 0, target: true },
      { k: 'cuadrado', x: 0.5, y: 0, target: true },
      { k: 'cuadrado', x: 0, y: 1, target: true },
      { k: 'estrella', x: 0, y: 2, target: true },
    ],
  },
  {
    title: tr('Derriba los círculos', 'Knock down the circles'),
    tray: ['cuadrado'],
    launch: 'cuadrado',
    say: { key: 'angry_derriba', vars: { formas: tr('círculos', 'circles') } },
    shots: 5,
    only: true,
    blocks: [
      { k: 'rectangulo', x: -1.5, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 1.5, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2, s: 4 },
      { k: 'circulo', x: -1, y: 2.5, target: true },
      { k: 'circulo', x: 1, y: 2.5, target: true },
      { k: 'triangulo', x: 0, y: 0 },
      { k: 'cuadrado', x: 4, y: 0 },
      { k: 'circulo', x: 4, y: 1, target: true },
    ],
  },
  {
    title: tr('Elige la estrella', 'Pick the star'),
    tray: ['triangulo', 'estrella', 'rombo', 'circulo'],
    launch: 'estrella',
    say: { key: 'angry_elige_f', vars: { forma: tr('estrella', 'star') } },
    shots: 4,
    blocks: [
      { k: 'rectangulo', x: 0, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2, s: 3 },
      { k: 'rombo', x: -1, y: 2.5, target: true },
      { k: 'rombo', x: 1, y: 2.5, target: true },
      { k: 'cuadrado', x: 0, y: 2.5, target: true },
    ],
  },
  {
    title: tr('Derriba los triángulos', 'Knock down the triangles'),
    tray: ['circulo'],
    launch: 'circulo',
    say: { key: 'angry_derriba', vars: { formas: tr('triángulos', 'triangles') } },
    shots: 5,
    only: true,
    blocks: [
      { k: 'cuadrado', x: -1, y: 0 },
      { k: 'cuadrado', x: 1, y: 0 },
      { k: 'triangulo', x: -1, y: 1, target: true },
      { k: 'triangulo', x: 1, y: 1, target: true },
      { k: 'circulo', x: 2.5, y: 0 },
      { k: 'rectangulo', x: 4, y: 0, s: 2, angle: 90 },
      { k: 'triangulo', x: 4, y: 2, target: true },
    ],
  },
  {
    title: tr('Formas de 4 lados', 'Shapes with 4 sides'),
    tray: ['estrella'],
    launch: 'estrella',
    say: { key: 'angry_derriba_lados', vars: { n: '4' } },
    shots: 5,
    only: true,
    blocks: [
      { k: 'circulo', x: -1.5, y: 0 },
      { k: 'cuadrado', x: -0.5, y: 0, target: true },
      { k: 'triangulo', x: 0.5, y: 0 },
      { k: 'rombo', x: 1.5, y: 0, target: true },
      { k: 'rectangulo', x: 0, y: 1.3, s: 4, target: true },
      { k: 'estrella', x: -1, y: 1.8 },
      { k: 'circulo', x: 1, y: 1.8 },
    ],
  },
  {
    title: tr('Elige el rombo', 'Pick the diamond'),
    tray: ['cuadrado', 'rombo', 'rectangulo', 'triangulo', 'estrella'],
    launch: 'rombo',
    say: { key: 'angry_elige', vars: { forma: tr('rombo', 'diamond') } },
    shots: 5,
    blocks: [
      { k: 'rectangulo', x: -1.5, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 1.5, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2, s: 4 },
      { k: 'cuadrado', x: 0, y: 0, target: true },
      { k: 'cuadrado', x: -1, y: 2.5, target: true },
      { k: 'cuadrado', x: 1, y: 2.5, target: true },
      { k: 'triangulo', x: 0, y: 2.5, target: true },
    ],
  },
];
