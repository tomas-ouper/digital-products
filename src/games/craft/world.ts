// Mundo voxel de Montecraft: datos, texturas 16x16 procedurales (paleta propia) y mallado con oclusión ambiental.
import * as THREE from 'three';

export const SX = 32;
export const SY = 16;
export const SZ = 32;

// ---- Bloques ----
export interface BlockDef {
  id: number;
  name: string;
  tiles: [string, string, string]; // arriba, costados, abajo
}

const TILE_NAMES = [
  'grass_top', 'grass_side', 'dirt', 'stone', 'log_side', 'log_top', 'planks', 'leaves',
  'sand', 'glass', 'brick', 'dark', 'c_rojo', 'c_naranja', 'c_amarillo', 'c_verde',
  'c_azul', 'c_morado', 'c_rosa', 'c_blanco', 'snow', 'gold', 'water', 'flower',
] as const;
const TILE_INDEX = new Map<string, number>(TILE_NAMES.map((n, i) => [n, i]));

export const BLOCKS: BlockDef[] = [
  { id: 0, name: 'Aire', tiles: ['dirt', 'dirt', 'dirt'] },
  { id: 1, name: 'Pasto', tiles: ['grass_top', 'grass_side', 'dirt'] },
  { id: 2, name: 'Tierra', tiles: ['dirt', 'dirt', 'dirt'] },
  { id: 3, name: 'Piedra', tiles: ['stone', 'stone', 'stone'] },
  { id: 4, name: 'Tronco', tiles: ['log_top', 'log_side', 'log_top'] },
  { id: 5, name: 'Madera', tiles: ['planks', 'planks', 'planks'] },
  { id: 6, name: 'Hojas', tiles: ['leaves', 'leaves', 'leaves'] },
  { id: 7, name: 'Arena', tiles: ['sand', 'sand', 'sand'] },
  { id: 8, name: 'Cristal', tiles: ['glass', 'glass', 'glass'] },
  { id: 9, name: 'Ladrillo', tiles: ['brick', 'brick', 'brick'] },
  { id: 10, name: 'Roca', tiles: ['dark', 'dark', 'dark'] },
  { id: 11, name: 'Rojo', tiles: ['c_rojo', 'c_rojo', 'c_rojo'] },
  { id: 12, name: 'Naranja', tiles: ['c_naranja', 'c_naranja', 'c_naranja'] },
  { id: 13, name: 'Amarillo', tiles: ['c_amarillo', 'c_amarillo', 'c_amarillo'] },
  { id: 14, name: 'Verde', tiles: ['c_verde', 'c_verde', 'c_verde'] },
  { id: 15, name: 'Azul', tiles: ['c_azul', 'c_azul', 'c_azul'] },
  { id: 16, name: 'Morado', tiles: ['c_morado', 'c_morado', 'c_morado'] },
  { id: 17, name: 'Rosa', tiles: ['c_rosa', 'c_rosa', 'c_rosa'] },
  { id: 18, name: 'Blanco', tiles: ['c_blanco', 'c_blanco', 'c_blanco'] },
  { id: 19, name: 'Nieve', tiles: ['snow', 'snow', 'snow'] },
  { id: 20, name: 'Oro', tiles: ['gold', 'gold', 'gold'] },
];

export const B = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, LOG: 4, PLANKS: 5, LEAVES: 6, SAND: 7, GLASS: 8, BRICK: 9, DARK: 10, ROJO: 11, NARANJA: 12, AMARILLO: 13, VERDE: 14, AZUL: 15, MORADO: 16, ROSA: 17, BLANCO: 18, SNOW: 19, GOLD: 20 };

/** Color representativo de cada bloque (para fantasmas, partículas e íconos) */
export const BLOCK_COLOR: Record<number, string> = {
  11: '#e5484d', 12: '#f28b30', 13: '#f5c936', 14: '#4caf50', 15: '#3f7fe0', 16: '#9b5de5', 17: '#f47fb4', 18: '#f1f1ee',
};

// ---- Texturas procedurales ----
const T = 16;
const COLS = 8;
const ROWS = Math.ceil(TILE_NAMES.length / COLS);

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(c: [number, number, number], f: number): string {
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${m(c[0])},${m(c[1])},${m(c[2])})`;
}

function paintTile(ctx: CanvasRenderingContext2D, name: string, ox: number, oy: number) {
  const r = rng([...name].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  const px = (x: number, y: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(ox + x, oy + y, 1, 1);
  };
  const noise = (base: string, amp: number, palette?: string[]) => {
    const c = hex(base);
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) {
        if (palette && r() < 0.35) px(x, y, palette[(r() * palette.length) | 0]);
        else px(x, y, mix(c, 1 - amp / 2 + r() * amp));
      }
  };
  switch (name) {
    case 'grass_top':
      noise('#62b84b', 0.22, ['#57a843', '#6fc556', '#4f9c3c', '#7acc5f']);
      break;
    case 'dirt':
      noise('#8a5b3b', 0.2, ['#7a4e32', '#9a6845', '#6d4429']);
      for (let i = 0; i < 6; i++) px((r() * T) | 0, (r() * T) | 0, '#b08a68');
      break;
    case 'grass_side': {
      noise('#8a5b3b', 0.2, ['#7a4e32', '#9a6845', '#6d4429']);
      for (let x = 0; x < T; x++) {
        const d = 3 + ((r() * 3) | 0);
        for (let y = 0; y < d; y++) px(x, y, ['#62b84b', '#57a843', '#6fc556'][(r() * 3) | 0]);
      }
      break;
    }
    case 'stone':
      noise('#8d8f96', 0.16, ['#7f8189', '#9a9ca3', '#84868d']);
      for (let i = 0; i < 5; i++) {
        let x = (r() * T) | 0, y = (r() * T) | 0;
        for (let k = 0; k < 4; k++) {
          px(x, y, '#6c6e75');
          x = (x + (r() < 0.5 ? 1 : 0)) % T;
          y = (y + (r() < 0.5 ? 1 : 0)) % T;
        }
      }
      break;
    case 'dark':
      noise('#45464d', 0.3, ['#34353b', '#55565e']);
      break;
    case 'log_side':
      for (let x = 0; x < T; x++) {
        const base = hex(x % 4 === 0 ? '#5e3f25' : x % 4 === 2 ? '#7a5434' : '#6c4a2d');
        for (let y = 0; y < T; y++) px(x, y, mix(base, 0.88 + r() * 0.2));
      }
      break;
    case 'log_top': {
      for (let y = 0; y < T; y++)
        for (let x = 0; x < T; x++) {
          const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
          const ring = Math.floor(d) % 3 === 0;
          px(x, y, d > 6.5 ? '#6c4a2d' : ring ? '#a37a4c' : mix(hex('#c19a66'), 0.92 + r() * 0.12));
        }
      break;
    }
    case 'planks':
      for (let y = 0; y < T; y++)
        for (let x = 0; x < T; x++) {
          const seam = y % 4 === 3 || (x === ((Math.floor(y / 4) * 7) % T));
          px(x, y, seam ? '#8b6236' : mix(hex('#c48f55'), 0.9 + r() * 0.16));
        }
      break;
    case 'leaves':
      noise('#3f8f3a', 0.3, ['#2f7a2c', '#4ea547', '#367f31', '#5cb553']);
      for (let i = 0; i < 10; i++) px((r() * T) | 0, (r() * T) | 0, '#245f22');
      break;
    case 'sand':
      noise('#e6d38f', 0.12, ['#dccb85', '#efdc9c', '#d6c27a']);
      break;
    case 'snow':
      noise('#f4f8fb', 0.06, ['#e6eef5', '#ffffff']);
      break;
    case 'gold':
      noise('#f2c230', 0.18, ['#ffd84d', '#e0a91f', '#fff0a0']);
      break;
    case 'water':
      noise('#3d8fd6', 0.15, ['#4aa0e8', '#3580c4']);
      break;
    case 'flower':
      noise('#62b84b', 0.2);
      break;
    case 'glass':
      for (let y = 0; y < T; y++)
        for (let x = 0; x < T; x++) {
          const edge = x === 0 || y === 0 || x === T - 1 || y === T - 1;
          px(x, y, edge ? '#cfe9f2' : '#a9d8ea');
        }
      for (let i = 0; i < 4; i++) {
        px(3 + i, 3 + i, '#ffffff');
        px(4 + i, 3 + i, '#eaf7fc');
      }
      px(10, 11, '#ffffff');
      px(11, 12, '#ffffff');
      break;
    case 'brick':
      for (let y = 0; y < T; y++)
        for (let x = 0; x < T; x++) {
          const row = Math.floor(y / 4);
          const mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7;
          px(x, y, mortar ? '#d9cfc4' : mix(hex('#b5523b'), 0.88 + r() * 0.2));
        }
      break;
    default:
      if (name.startsWith('c_')) {
        const base = hex(BLOCK_COLOR[BLOCKS.find((b) => b.tiles[0] === name)!.id]);
        // bloque de color con trama tejida suave y borde
        for (let y = 0; y < T; y++)
          for (let x = 0; x < T; x++) {
            const weave = ((x >> 1) + (y >> 1)) % 2 === 0 ? 1.04 : 0.95;
            const edge = x === 0 || y === 0 || x === T - 1 || y === T - 1 ? 0.82 : 1;
            px(x, y, mix(base, weave * edge * (0.95 + r() * 0.08)));
          }
      }
  }
}

let atlasCanvas: HTMLCanvasElement | null = null;

export function getAtlasCanvas() {
  if (atlasCanvas) return atlasCanvas;
  const c = document.createElement('canvas');
  c.width = COLS * T;
  c.height = ROWS * T;
  const ctx = c.getContext('2d')!;
  TILE_NAMES.forEach((n, i) => paintTile(ctx, n, (i % COLS) * T, Math.floor(i / COLS) * T));
  atlasCanvas = c;
  return c;
}

export function makeAtlasTexture() {
  const tex = new THREE.CanvasTexture(getAtlasCanvas());
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** UV (u0,v0,u1,v1) de una tesela, con margen para evitar sangrado */
export function tileUV(name: string) {
  const i = TILE_INDEX.get(name) ?? 0;
  const cx = i % COLS;
  const cy = Math.floor(i / COLS);
  const e = 0.02;
  const u0 = (cx * T + e) / (COLS * T);
  const u1 = ((cx + 1) * T - e) / (COLS * T);
  const v1 = 1 - (cy * T + e) / (ROWS * T);
  const v0 = 1 - ((cy + 1) * T - e) / (ROWS * T);
  return [u0, v0, u1, v1];
}

/** Ícono isométrico de un bloque (para la barra), dibujado en 2D */
export function blockIcon(id: number, size = 48): string {
  const atlas = getAtlasCanvas();
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const def = BLOCKS[id];
  const tile = (name: string) => {
    const i = TILE_INDEX.get(name) ?? 0;
    return [(i % COLS) * T, Math.floor(i / COLS) * T];
  };
  const s = size / 2;
  const draw = (name: string, a: number, b: number, cc: number, d: number, e: number, f: number, shade: number) => {
    const [sx, sy] = tile(name);
    ctx.save();
    ctx.setTransform(a, b, cc, d, e, f);
    ctx.drawImage(atlas, sx, sy, T, T, 0, 0, T, T);
    ctx.fillStyle = `rgba(0,0,0,${shade})`;
    ctx.fillRect(0, 0, T, T);
    ctx.restore();
  };
  const k = s / T;
  // arriba
  draw(def.tiles[0], k, k * 0.5, -k, k * 0.5, s, size * 0.04, 0);
  // izquierda
  draw(def.tiles[1], k, k * 0.5, 0, k, 0, s * 0.5 + size * 0.04, 0.18);
  // derecha
  draw(def.tiles[1], k, -k * 0.5, 0, k, s, s + size * 0.04, 0.34);
  return c.toDataURL();
}

// ---- Datos del mundo ----
export class World {
  data = new Uint8Array(SX * SY * SZ);

  idx(x: number, y: number, z: number) {
    return x + z * SX + y * SX * SZ;
  }

  inside(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  get(x: number, y: number, z: number) {
    if (!this.inside(x, y, z)) return 0;
    return this.data[this.idx(x, y, z)];
  }

  set(x: number, y: number, z: number, v: number) {
    if (this.inside(x, y, z)) this.data[this.idx(x, y, z)] = v;
  }

  solid(x: number, y: number, z: number) {
    return this.get(Math.floor(x), Math.floor(y), Math.floor(z)) !== 0;
  }

  /** Terreno: plaza plana en el centro, lomas alrededor, árboles en el borde */
  generate(seed = 3) {
    const r = rng(seed);
    for (let x = 0; x < SX; x++)
      for (let z = 0; z < SZ; z++) {
        const inPlaza = x >= 3 && x <= 28 && z >= 5 && z <= 29;
        const dx = Math.max(0, 3 - x, x - 28);
        const dz = Math.max(0, 5 - z, z - 29);
        const d = Math.max(dx, dz);
        let top = 3;
        if (!inPlaza) top = 3 + Math.min(6, Math.round(d * 0.9 + 1.4 * (Math.sin(x * 0.45) + Math.cos(z * 0.5) + 1)));
        for (let y = 0; y <= top; y++) {
          let b = B.STONE;
          if (y === 0) b = B.DARK;
          else if (y === top) b = top >= 9 ? B.SNOW : B.GRASS;
          else if (y >= top - 2) b = B.DIRT;
          this.set(x, y, z, b);
        }
      }
    // senderito de arena en la plaza
    for (let z = 23; z <= 29; z++) for (let x = 15; x <= 16; x++) this.set(x, 3, z, B.SAND);
    // árboles
    const spots: [number, number][] = [[1, 30], [30, 30], [1, 14], [30, 12], [6, 2], [25, 2], [30, 22], [1, 22]];
    for (const [x, z] of spots) {
      let y = SY - 1;
      while (y > 0 && this.get(x, y, z) === 0) y--;
      const h = 3 + ((r() * 2) | 0);
      if (y + h + 2 >= SY) continue;
      for (let i = 1; i <= h; i++) this.set(x, y + i, z, B.LOG);
      const ty = y + h;
      for (let ax = -2; ax <= 2; ax++)
        for (let az = -2; az <= 2; az++)
          for (let ay = 0; ay <= 2; ay++) {
            const rr = Math.abs(ax) + Math.abs(az) + ay;
            if (rr > 3 || (ax === 0 && az === 0 && ay < 2)) continue;
            if (this.get(x + ax, ty + ay, z + az) === 0) this.set(x + ax, ty + ay, z + az, B.LEAVES);
          }
    }
  }
}

// ---- Mallado ----
const FACES = [
  { dir: [-1, 0, 0], shade: 0.8, side: 1, corners: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] },
  { dir: [1, 0, 0], shade: 0.8, side: 1, corners: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] },
  { dir: [0, -1, 0], shade: 0.55, side: 2, corners: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] },
  { dir: [0, 1, 0], shade: 1.0, side: 0, corners: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] },
  { dir: [0, 0, -1], shade: 0.68, side: 1, corners: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] },
  { dir: [0, 0, 1], shade: 0.68, side: 1, corners: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] },
];

const AO = [0.45, 0.65, 0.82, 1];

export function buildGeometry(w: World): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const uvCache = new Map<string, number[]>();
  const getUV = (n: string) => {
    let u = uvCache.get(n);
    if (!u) uvCache.set(n, (u = tileUV(n)));
    return u;
  };
  const S = (x: number, y: number, z: number) => (w.get(x, y, z) !== 0 ? 1 : 0);
  for (let y = 0; y < SY; y++)
    for (let z = 0; z < SZ; z++)
      for (let x = 0; x < SX; x++) {
        const id = w.get(x, y, z);
        if (!id) continue;
        const def = BLOCKS[id];
        for (const f of FACES) {
          const [dx, dy, dz] = f.dir;
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (ny < 0) continue;
          if (w.get(nx, ny, nz) !== 0) continue;
          // fuera del mundo hacia los costados: no dibujar (el piso infinito tapa)
          if (!w.inside(nx, ny, nz) && ny < SY) {
            if (ny >= 0 && ny < 4) continue;
          }
          const [u0, v0, u1, v1] = getUV(def.tiles[f.side]);
          const base = pos.length / 3;
          // ejes del plano
          const axes = [0, 1, 2].filter((a) => f.dir[a] === 0);
          const ao: number[] = [];
          for (const c of f.corners) {
            pos.push(x + c[0], y + c[1], z + c[2]);
            nor.push(dx, dy, dz);
            uv.push(c[3] ? u1 : u0, c[4] ? v1 : v0);
            const o = [nx, ny, nz];
            const s1o = [...o];
            const s2o = [...o];
            s1o[axes[0]] += c[axes[0]] ? 1 : -1;
            s2o[axes[1]] += c[axes[1]] ? 1 : -1;
            const co = [...o];
            co[axes[0]] += c[axes[0]] ? 1 : -1;
            co[axes[1]] += c[axes[1]] ? 1 : -1;
            const s1 = S(s1o[0], s1o[1], s1o[2]);
            const s2 = S(s2o[0], s2o[1], s2o[2]);
            const cc = S(co[0], co[1], co[2]);
            const a = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
            ao.push(a);
            const b = f.shade * AO[a];
            col.push(b, b, b);
          }
          if (ao[0] + ao[3] > ao[1] + ao[2]) idx.push(base, base + 1, base + 3, base, base + 3, base + 2);
          else idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
        }
      }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Cubo suelto con las texturas de un bloque (mano, partículas) */
export function blockGeometry(id: number, size = 1): THREE.BufferGeometry {
  const def = BLOCKS[id];
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (const f of FACES) {
    const [u0, v0, u1, v1] = tileUV(def.tiles[f.side]);
    const base = pos.length / 3;
    for (const c of f.corners) {
      pos.push((c[0] - 0.5) * size, (c[1] - 0.5) * size, (c[2] - 0.5) * size);
      uv.push(c[3] ? u1 : u0, c[4] ? v1 : v0);
      col.push(f.shade, f.shade, f.shade);
    }
    idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}
