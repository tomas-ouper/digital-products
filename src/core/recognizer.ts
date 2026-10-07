// Reconocedor de trazos tipo "nube de puntos" ($P, Vatavu/Anthony/Wobbrock 2012), implementación propia.
// Compara el gesto (uno o varios trazos) con plantillas de letras, sin importar el orden de los trazos.
import type { Pt, Stroke } from './letters';

const N = 40;

type CPt = { x: number; y: number; id: number };

export interface Template {
  name: string;
  points: CPt[];
}

function pathLength(pts: CPt[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

function resampleCloud(strokes: Stroke[], n: number): CPt[] {
  let pts: CPt[] = [];
  strokes.forEach((s, id) => {
    if (s.length === 1) {
      // un punto (ej. el punto de la i): lo convertimos en un trazo diminuto
      pts.push({ x: s[0].x, y: s[0].y, id }, { x: s[0].x + 0.5, y: s[0].y + 0.5, id });
    } else s.forEach((p) => pts.push({ x: p.x, y: p.y, id }));
  });
  const I = pathLength(pts) / (n - 1);
  if (!(I > 0)) return Array.from({ length: n }, () => ({ ...pts[0] }));
  let D = 0;
  const out: CPt[] = [{ ...pts[0] }];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id === pts[i - 1].id) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (D + d >= I) {
        const t = (I - D) / d;
        const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
        out.push(q);
        pts = [...pts.slice(0, i), q, ...pts.slice(i)];
        D = 0;
      } else D += d;
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function normalize(strokes: Stroke[]): CPt[] {
  let pts = resampleCloud(strokes, N);
  // escala uniforme
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  pts = pts.map((p) => ({ x: (p.x - minX) / size, y: (p.y - minY) / size, id: p.id }));
  // centrar
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  return pts.map((p) => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

function cloudDistance(a: CPt[], b: CPt[], start: number) {
  const matched = new Array(a.length).fill(false);
  let sum = 0;
  let i = start;
  do {
    let min = Infinity;
    let idx = -1;
    for (let j = 0; j < b.length; j++) {
      if (matched[j]) continue;
      const d = (a[i].x - b[j].x) ** 2 + (a[i].y - b[j].y) ** 2;
      if (d < min) {
        min = d;
        idx = j;
      }
    }
    matched[idx] = true;
    const weight = 1 - ((i - start + a.length) % a.length) / a.length;
    sum += weight * Math.sqrt(min);
    i = (i + 1) % a.length;
  } while (i !== start);
  return sum;
}

function greedyMatch(a: CPt[], b: CPt[]) {
  const step = Math.floor(Math.pow(a.length, 0.5));
  let min = Infinity;
  for (let i = 0; i < a.length; i += step) {
    min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  }
  return min;
}

export function makeTemplate(name: string, strokes: Stroke[]): Template {
  return { name, points: normalize(strokes) };
}

export interface Match {
  name: string;
  /** distancia (menor = más parecido). Típico: < 2.5 muy bien, > 5 garabato. */
  score: number;
  ranking: { name: string; score: number }[];
}

export function recognize(strokes: Pt[][], templates: Template[]): Match | null {
  const usable = strokes.filter((s) => s.length > 0);
  if (!usable.length || !templates.length) return null;
  const g = normalize(usable);
  const ranking = templates.map((t) => ({ name: t.name, score: greedyMatch(g, t.points) })).sort((x, y) => x.score - y.score);
  return { name: ranking[0].name, score: ranking[0].score, ranking };
}
