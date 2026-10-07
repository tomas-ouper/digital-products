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

// Unidad de mundo = 1 cuadrado chico (aprox. 44px a escala 1).
export const ANGRY_LEVELS: AngryLevel[] = [
  {
    title: 'Lanza el círculo',
    tray: ['circulo'],
    launch: 'circulo',
    say: { key: 'angry_lanza', vars: { forma: 'círculo' } },
    shots: 4,
    blocks: [
      { k: 'cuadrado', x: 0, y: 0, target: true },
      { k: 'cuadrado', x: 0, y: 1, target: true },
      { k: 'cuadrado', x: 0, y: 2, target: true },
    ],
  },
  {
    title: 'Lanza el cuadrado',
    tray: ['cuadrado'],
    launch: 'cuadrado',
    say: { key: 'angry_lanza', vars: { forma: 'cuadrado' } },
    shots: 4,
    blocks: [
      { k: 'rectangulo', x: -1, y: 0, s: 1, angle: 90 },
      { k: 'rectangulo', x: 1, y: 0, s: 1, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2.25, s: 3 },
      { k: 'circulo', x: 0, y: 0, target: true },
      { k: 'triangulo', x: 0, y: 2.75, target: true },
    ],
  },
  {
    title: 'Elige el triángulo',
    tray: ['circulo', 'cuadrado', 'triangulo'],
    launch: 'triangulo',
    say: { key: 'angry_elige', vars: { forma: 'triángulo' } },
    shots: 4,
    blocks: [
      { k: 'cuadrado', x: -0.5, y: 0, target: true },
      { k: 'cuadrado', x: 0.5, y: 0, target: true },
      { k: 'cuadrado', x: 0, y: 1, target: true },
      { k: 'estrella', x: 0, y: 2, target: true },
    ],
  },
  {
    title: 'Derriba los círculos',
    tray: ['cuadrado'],
    launch: 'cuadrado',
    say: { key: 'angry_derriba', vars: { formas: 'círculos' } },
    shots: 5,
    only: true,
    blocks: [
      { k: 'rectangulo', x: -1.5, y: 0, s: 1, angle: 90 },
      { k: 'rectangulo', x: 1.5, y: 0, s: 1, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2.25, s: 4 },
      { k: 'circulo', x: -1, y: 2.75, target: true },
      { k: 'circulo', x: 1, y: 2.75, target: true },
      { k: 'triangulo', x: 0, y: 0 },
      { k: 'cuadrado', x: 4.5, y: 0 },
      { k: 'circulo', x: 4.5, y: 1, target: true },
    ],
  },
  {
    title: 'Elige la estrella',
    tray: ['triangulo', 'estrella', 'rombo', 'circulo'],
    launch: 'estrella',
    say: { key: 'angry_elige_f', vars: { forma: 'estrella' } },
    shots: 4,
    blocks: [
      { k: 'rectangulo', x: 0, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2.25, s: 3 },
      { k: 'rombo', x: -1, y: 2.75, target: true },
      { k: 'rombo', x: 1, y: 2.75, target: true },
      { k: 'cuadrado', x: 0, y: 2.75, target: true },
    ],
  },
  {
    title: 'Derriba los triángulos',
    tray: ['circulo'],
    launch: 'circulo',
    say: { key: 'angry_derriba', vars: { formas: 'triángulos' } },
    shots: 5,
    only: true,
    blocks: [
      { k: 'cuadrado', x: -1, y: 0 },
      { k: 'cuadrado', x: 1, y: 0 },
      { k: 'triangulo', x: -1, y: 1, target: true },
      { k: 'triangulo', x: 1, y: 1, target: true },
      { k: 'rectangulo', x: 4, y: 0, s: 2, angle: 90 },
      { k: 'triangulo', x: 4, y: 2.5, target: true },
      { k: 'circulo', x: 2.5, y: 0 },
    ],
  },
  {
    title: 'Formas de 4 lados',
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
      { k: 'rectangulo', x: 0, y: 1.25, s: 4, target: true },
      { k: 'estrella', x: -1, y: 1.75 },
      { k: 'circulo', x: 1, y: 1.75 },
    ],
  },
  {
    title: 'Elige el rombo',
    tray: ['cuadrado', 'rombo', 'rectangulo', 'triangulo', 'estrella'],
    launch: 'rombo',
    say: { key: 'angry_elige', vars: { forma: 'rombo' } },
    shots: 5,
    blocks: [
      { k: 'rectangulo', x: -1.5, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 1.5, y: 0, s: 2, angle: 90 },
      { k: 'rectangulo', x: 0, y: 2.25, s: 4 },
      { k: 'cuadrado', x: 0, y: 0, target: true },
      { k: 'cuadrado', x: -1, y: 2.75, target: true },
      { k: 'cuadrado', x: 1, y: 2.75, target: true },
      { k: 'triangulo', x: 0, y: 3.75, target: true },
    ],
  },
];
