// Plantillas de trazo de letras (originales). Coordenadas en una caja de 100x100, y hacia abajo.
// Cada letra = lista de trazos en el orden y la dirección correctos de escritura.
// Imprenta minúscula: zona media 42..88; ascendentes desde 10. Mayúscula: 12..88.
// Claves: "a" (minúscula), "A" (mayúscula), "c:a" (cursiva).
export type Pt = { x: number; y: number };
export type Stroke = Pt[];

type Seg = Pt[];

const P = (x: number, y: number): Pt => ({ x, y });

function line(x1: number, y1: number, x2: number, y2: number): Seg {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(2, Math.ceil(d / 2));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) out.push(P(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n));
  return out;
}

/** Arco elíptico. Ángulos en grados, 0 = derecha, 90 = abajo (y hacia abajo). a0 > a1 = antihorario visual. */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Seg {
  const len = (Math.abs(a1 - a0) * Math.PI * Math.max(rx, ry)) / 180;
  const n = Math.max(6, Math.ceil(len / 2));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push(P(cx + rx * Math.cos(a), cy + ry * Math.sin(a)));
  }
  return out;
}

/** Bézier cúbica */
function bez(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Seg {
  const n = 24;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(
      P(
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      )
    );
  }
  return out;
}

/** Une segmentos en un trazo continuo */
function S(...segs: Seg[]): Stroke {
  const out: Pt[] = [];
  for (const s of segs) {
    for (const p of s) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.01) out.push(p);
    }
  }
  return out;
}

const dot = (x: number, y: number): Stroke => [P(x, y)];

export const LETTERS: Record<string, Stroke[]> = {
  // ---------- Imprenta minúscula ----------
  a: [S(arc(48, 65, 22, 23, -30, -390)), S(line(70, 42, 70, 88))],
  b: [S(line(30, 10, 30, 88)), S(arc(51, 66, 21, 22, 180, 540))],
  c: [S(arc(52, 65, 23, 23, -40, -320))],
  d: [S(arc(48, 66, 21, 22, -30, -390)), S(line(70, 10, 70, 88))],
  e: [S(line(28, 65, 72, 65), arc(50, 65, 22, 23, 0, -320))],
  h: [S(line(30, 10, 30, 88)), S(line(30, 62, 30, 60), arc(50, 60, 20, 18, 180, 360), line(70, 60, 70, 88))],
  i: [S(line(50, 42, 50, 88)), dot(50, 26)],
  l: [S(line(50, 10, 50, 88))],
  m: [
    S(line(22, 42, 22, 88)),
    S(arc(35, 58, 13, 14, 180, 360), line(48, 58, 48, 88)),
    S(arc(61, 58, 13, 14, 180, 360), line(74, 58, 74, 88)),
  ],
  n: [S(line(30, 42, 30, 88)), S(arc(50, 60, 20, 18, 180, 360), line(70, 60, 70, 88))],
  o: [S(arc(50, 65, 23, 23, -90, -450))],
  r: [S(line(34, 42, 34, 88)), S(arc(52, 62, 18, 18, 180, 300))],
  s: [S(arc(50, 53, 14, 11, -20, -270), arc(50, 76, 15, 12, -90, 150))],
  t: [S(line(48, 18, 48, 88)), S(line(32, 44, 64, 44))],
  u: [S(line(30, 42, 30, 68), arc(50, 68, 20, 20, 180, 0)), S(line(70, 42, 70, 88))],
  v: [S(line(26, 42, 50, 88), line(50, 88, 74, 42))],
  z: [S(line(28, 42, 72, 42), line(72, 42, 28, 88), line(28, 88, 72, 88))],

  // ---------- Imprenta mayúscula ----------
  A: [S(line(50, 12, 24, 88)), S(line(50, 12, 76, 88)), S(line(35, 60, 65, 60))],
  C: [S(arc(52, 50, 30, 38, -40, -320))],
  D: [S(line(30, 12, 30, 88)), S(line(30, 12, 42, 12), arc(42, 50, 30, 38, -90, 90), line(42, 88, 30, 88))],
  E: [S(line(30, 12, 30, 88)), S(line(30, 12, 70, 12)), S(line(30, 50, 64, 50)), S(line(30, 88, 70, 88))],
  F: [S(line(32, 12, 32, 88)), S(line(32, 12, 72, 12)), S(line(32, 50, 66, 50))],
  H: [S(line(28, 12, 28, 88)), S(line(72, 12, 72, 88)), S(line(28, 50, 72, 50))],
  I: [S(line(50, 12, 50, 88))],
  L: [S(line(32, 12, 32, 88), line(32, 88, 70, 88))],
  M: [S(line(20, 88, 20, 12), line(20, 12, 50, 62), line(50, 62, 80, 12), line(80, 12, 80, 88))],
  N: [S(line(26, 88, 26, 12), line(26, 12, 74, 88), line(74, 88, 74, 12))],
  O: [S(arc(50, 50, 30, 38, -90, -450))],
  P: [S(line(30, 12, 30, 88)), S(line(30, 12, 50, 12), arc(50, 31, 20, 19, -90, 90), line(50, 50, 30, 50))],
  S: [S(arc(50, 31, 20, 19, -25, -270), arc(50, 69, 21, 19, -90, 155))],
  T: [S(line(22, 12, 78, 12)), S(line(50, 12, 50, 88))],
  U: [S(line(28, 12, 28, 62), arc(50, 62, 22, 26, 180, 0), line(72, 62, 72, 12))],
  V: [S(line(22, 12, 50, 88), line(50, 88, 78, 12))],
  Z: [S(line(26, 12, 74, 12), line(74, 12, 26, 88), line(26, 88, 74, 88))],

  // ---------- Cursiva (trazo continuo con entrada y salida) ----------
  'c:a': [S(bez(14, 84, 30, 80, 48, 60, 68, 48), arc(52, 66, 18, 19, -40, -400), line(66, 54, 68, 48), bez(68, 48, 68, 70, 66, 86, 86, 80))],
  'c:e': [S(bez(14, 82, 40, 78, 64, 66, 62, 52), bez(62, 52, 60, 38, 38, 42, 38, 62), bez(38, 62, 38, 84, 60, 90, 84, 76))],
  'c:i': [S(bez(16, 84, 30, 76, 42, 60, 50, 44), bez(50, 44, 46, 62, 44, 82, 54, 86), bez(54, 86, 64, 88, 74, 82, 84, 74)), dot(52, 26)],
  'c:l': [S(bez(14, 84, 40, 70, 64, 40, 58, 18), bez(58, 18, 54, 4, 36, 10, 40, 40), bez(40, 40, 42, 66, 40, 84, 54, 86), bez(54, 86, 66, 88, 76, 82, 86, 74))],
  'c:o': [S(bez(16, 84, 28, 74, 40, 48, 54, 46), arc(50, 66, 18, 20, -80, -440), bez(54, 46, 64, 52, 74, 50, 86, 44))],
  'c:u': [S(bez(14, 82, 22, 70, 26, 56, 30, 46), bez(30, 46, 26, 66, 28, 86, 46, 86), bez(46, 86, 60, 86, 66, 66, 68, 46), bez(68, 46, 66, 66, 66, 84, 86, 78))],
  'c:m': [S(bez(10, 86, 14, 70, 18, 56, 22, 46), bez(22, 46, 26, 40, 36, 40, 36, 56), line(36, 56, 36, 86), bez(36, 86, 38, 60, 42, 42, 52, 44), bez(52, 44, 60, 46, 58, 62, 58, 86), bez(58, 86, 60, 60, 64, 42, 74, 44), bez(74, 44, 82, 48, 78, 70, 80, 82), line(80, 82, 90, 76))],
  'c:s': [S(bez(16, 84, 30, 72, 44, 56, 52, 44), bez(52, 44, 62, 60, 72, 74, 56, 84), bez(56, 84, 46, 90, 36, 84, 38, 78), bez(38, 78, 52, 86, 70, 86, 88, 76))],
};

export const CURSIVE_FONT = "'Playwrite MX', cursive";

export function isCursive(key: string) {
  return key.startsWith('c:');
}

/** Carácter que se muestra (sin el prefijo de cursiva). */
export function glyph(key: string) {
  return key.startsWith('c:') ? key.slice(2) : key;
}

/** Longitud total de un trazo */
export function strokeLength(s: Stroke): number {
  let d = 0;
  for (let i = 1; i < s.length; i++) d += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
  return d;
}

/** Re-muestrea un trazo con puntos cada `step` unidades. */
export function resample(s: Stroke, step: number): Stroke {
  if (s.length < 2) return s.slice();
  const out: Pt[] = [s[0]];
  let acc = 0;
  for (let i = 1; i < s.length; i++) {
    let a = s[i - 1];
    const b = s[i];
    let d = Math.hypot(b.x - a.x, b.y - a.y);
    while (acc + d >= step) {
      const t = (step - acc) / d;
      const p = P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      out.push(p);
      a = p;
      d = Math.hypot(b.x - a.x, b.y - a.y);
      acc = 0;
    }
    acc += d;
  }
  const last = s[s.length - 1];
  const lo = out[out.length - 1];
  if (Math.hypot(last.x - lo.x, last.y - lo.y) > step * 0.4) out.push(last);
  return out;
}
