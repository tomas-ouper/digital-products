// Montecraft: mundo de bloques 3D en primera persona (Three.js). Táctil primero.
import * as THREE from 'three';
import type { GameContext, GameInstance } from '../types';
import { CRAFT_LEVELS } from './levels';
import { World, SX, SY, SZ, B, BLOCKS, BLOCK_COLOR, buildGeometry, blockGeometry, blockIcon, makeAtlasTexture, getAtlasCanvas, tileUV } from './world';
import { glyphCells, normalizeName } from './font5x7';
import { say, letterName } from '../../core/voice';
import { sfx } from '../../core/sound';

const HOTBAR_DEFAULT = [B.ROJO, B.NARANJA, B.AMARILLO, B.VERDE, B.AZUL, B.MORADO, B.PLANKS, B.BRICK, B.GLASS];
const INVENTORY = [B.ROJO, B.NARANJA, B.AMARILLO, B.VERDE, B.AZUL, B.MORADO, B.ROSA, B.BLANCO, B.PLANKS, B.LOG, B.BRICK, B.STONE, B.GLASS, B.SAND, B.GRASS, B.DIRT, B.LEAVES, B.SNOW, B.GOLD];

const EYE = 1.6;
const HALF_W = 0.3;
const HEIGHT = 1.75;

interface Ghost {
  x: number;
  y: number;
  z: number;
  req: number; // 0 = cualquier bloque
}

interface Particle {
  m: THREE.Mesh;
  v: THREE.Vector3;
  life: number;
}

export function start(ctx: GameContext): GameInstance {
  const lv = CRAFT_LEVELS[ctx.level] || CRAFT_LEVELS[0];
  const host = ctx.host;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let dead = false;
  let paused = false;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
    timers.add(id);
    return id;
  };

  // ---------- Three ----------
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.touchAction = 'none';
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const sky = new THREE.Color('#bfe6ff');
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 24, 72);
  // cúpula de cielo con degradé
  {
    const geo = new THREE.SphereGeometry(150, 24, 16);
    const top = new THREE.Color('#3f8ee8');
    const mid = new THREE.Color('#8fcaff');
    const cols: number[] = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 150;
      const c = y > 0.05 ? mid.clone().lerp(top, Math.min(1, (y - 0.05) / 0.6)) : sky.clone().lerp(mid, Math.max(0, (y + 0.1) / 0.15));
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.renderOrder = -1;
    dome.position.set(SX / 2, 0, SZ / 2);
    scene.add(dome);
  }
  const camera = new THREE.PerspectiveCamera(72, host.clientWidth / host.clientHeight, 0.05, 200);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const atlas = makeAtlasTexture();
  const worldMat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
  const world = new World();
  world.generate(3 + ctx.level);
  let worldMesh = new THREE.Mesh(buildGeometry(world), worldMat);
  scene.add(worldMesh);

  // piso "infinito" alrededor
  {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d')!;
    const [u0, v0] = tileUV('grass_top');
    const a = getAtlasCanvas();
    g.drawImage(a, Math.round(u0 * a.width), Math.round((1 - v0) * a.height) - 16, 16, 16, 0, 0, 16, 16);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(300, 300);
    t.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ map: t, color: 0xdddddd }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(SX / 2, 3.98, SZ / 2);
    scene.add(floor);
  }
  // sol
  {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,253,220,1)');
    grd.addColorStop(0.35, 'rgba(255,240,170,0.9)');
    grd.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), fog: false, depthWrite: false }));
    sun.scale.set(30, 30, 1);
    sun.position.set(SX / 2 - 60, 70, SZ / 2 - 90);
    scene.add(sun);
  }
  // nubes de bloques
  const clouds = new THREE.Group();
  {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, fog: false });
    const r = (n: number) => Math.random() * n;
    for (let i = 0; i < 12; i++) {
      const cl = new THREE.Group();
      const parts = 2 + ((Math.random() * 3) | 0);
      for (let k = 0; k < parts; k++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(6 + r(8), 1, 4 + r(6)), mat);
        m.position.set(r(6) - 3, 0, r(5) - 2.5);
        cl.add(m);
      }
      cl.position.set(r(160) - 64, 40 + r(5), r(160) - 64);
      clouds.add(cl);
    }
    scene.add(clouds);
  }

  // ---------- Fantasmas (plantillas) ----------
  const ghosts: Ghost[] = [];
  const wallZ = 14;
  const addGlyphs = (word: string) => {
    const width = word.length * 6 - 1;
    const x0 = Math.floor(SX / 2 - width / 2);
    [...word].forEach((ch, i) => {
      for (const [c, r] of glyphCells(ch)) ghosts.push({ x: x0 + i * 6 + c, y: 4 + (6 - r), z: wallZ, req: 0 });
    });
  };
  const name = normalizeName(ctx.profile.name, 5);
  if (lv.kind === 'letra') addGlyphs(lv.letter!);
  else if (lv.kind === 'inicial') addGlyphs(name[0]);
  else if (lv.kind === 'nombre') addGlyphs(name);
  else if (lv.kind === 'apilar') for (let i = 0; i < 10; i++) ghosts.push({ x: 16, y: 4 + i, z: wallZ, req: 0 });
  else if (lv.kind === 'colores') {
    const cols = [B.ROJO, B.AZUL, B.AMARILLO];
    cols.forEach((c, i) => {
      for (let k = 0; k < 3; k++) ghosts.push({ x: 11 + i * 4 + (k === 2 ? 1 : k), y: 4 + (k === 2 ? 1 : 0), z: wallZ, req: c });
      // base marcada en el piso del color pedido
      for (let dx = 0; dx < 3; dx++) world.set(11 + i * 4 + dx, 3, wallZ + 1, c);
    });
    rebuild();
  }
  const ghostKey = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const ghostMap = new Map(ghosts.map((g) => [ghostKey(g.x, g.y, g.z), g]));

  const ghostTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.fillRect(0, 0, 16, 1);
    g.fillRect(0, 15, 16, 1);
    g.fillRect(0, 0, 1, 16);
    g.fillRect(15, 0, 1, 16);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
  })();
  const ghostMat = new THREE.MeshBasicMaterial({ map: ghostTex, transparent: true, opacity: 0.85, depthWrite: false, color: 0xffffff });
  const ghostMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.001, 1.001, 1.001), ghostMat, Math.max(1, ghosts.length));
  ghostMesh.frustumCulled = false;
  scene.add(ghostMesh);
  const tmpM = new THREE.Matrix4();
  const tmpC = new THREE.Color();
  const filled = (g: Ghost) => {
    const id = world.get(g.x, g.y, g.z);
    return id !== 0 && (!g.req || id === g.req);
  };
  function updateGhosts() {
    let n = 0;
    for (const g of ghosts) {
      if (world.get(g.x, g.y, g.z) !== 0) continue;
      tmpM.makeTranslation(g.x + 0.5, g.y + 0.5, g.z + 0.5);
      ghostMesh.setMatrixAt(n, tmpM);
      tmpC.set(g.req ? BLOCK_COLOR[g.req] : '#ffffff');
      ghostMesh.setColorAt(n, tmpC);
      n++;
    }
    ghostMesh.count = n;
    ghostMesh.instanceMatrix.needsUpdate = true;
    if (ghostMesh.instanceColor) ghostMesh.instanceColor.needsUpdate = true;
  }

  function rebuild() {
    const old = worldMesh?.geometry;
    if (worldMesh) {
      worldMesh.geometry = buildGeometry(world);
      old?.dispose();
    }
  }

  // ---------- Selección de bloque (contorno) ----------
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0x1b1d2e, transparent: true, opacity: 0.75 }));
  outline.visible = false;
  scene.add(outline);
  const breakBox = new THREE.Mesh(new THREE.BoxGeometry(1.01, 1.01, 1.01), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  breakBox.visible = false;
  scene.add(breakBox);

  // ---------- Mano con bloque ----------
  const handGeoms = new Map<number, THREE.BufferGeometry>();
  const handGeo = (id: number) => {
    let g = handGeoms.get(id);
    if (!g) handGeoms.set(id, (g = blockGeometry(id, 1)));
    return g;
  };
  const hand = new THREE.Mesh(handGeo(B.ROJO), new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, fog: false, depthTest: false }));
  hand.renderOrder = 10;
  hand.scale.setScalar(0.2);
  camera.add(hand);
  let swing = 0;
  const placeHand = () => {
    const a = camera.aspect;
    const s = Math.sin(Math.min(1, swing) * Math.PI);
    hand.scale.setScalar(a < 1 ? 0.16 : 0.22);
    hand.position.set(0.5 * Math.min(1.4, a) - s * 0.12, -0.52 + s * 0.08 + Math.sin(bob) * 0.015, -1.0 - s * 0.1);
    hand.rotation.set(0.2 - s * 0.6, 0.65, 0.05);
  };

  // ---------- Partículas ----------
  const particles: Particle[] = [];
  const partGeoms = new Map<number, THREE.BufferGeometry>();
  const partMat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
  const burst = (x: number, y: number, z: number, id: number, n = 10, power = 3) => {
    let g = partGeoms.get(id);
    if (!g) partGeoms.set(id, (g = blockGeometry(id, 0.16)));
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(g, partMat);
      m.position.set(x + 0.2 + Math.random() * 0.6, y + 0.2 + Math.random() * 0.6, z + 0.2 + Math.random() * 0.6);
      scene.add(m);
      particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * power, Math.random() * power + 1.5, (Math.random() - 0.5) * power), life: 0.7 + Math.random() * 0.5 });
    }
  };

  // ---------- Jugador ----------
  const player = { pos: new THREE.Vector3(16.5, 4, 24.5), vy: 0, onGround: false, flying: false, yaw: 0, pitch: -0.12 };
  const keys = new Set<string>();
  const joy = { x: 0, y: 0 };
  let jumpReq = false;
  let bob = 0;

  const collides = (p: THREE.Vector3) => {
    const x0 = Math.floor(p.x - HALF_W), x1 = Math.floor(p.x + HALF_W);
    const y0 = Math.floor(p.y), y1 = Math.floor(p.y + HEIGHT - 0.01);
    const z0 = Math.floor(p.z - HALF_W), z1 = Math.floor(p.z + HALF_W);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (world.get(x, y, z) !== 0) return true;
    return false;
  };

  const tryMove = (axis: 'x' | 'z', d: number) => {
    const p = player.pos;
    const old = p[axis];
    p[axis] += d;
    p[axis] = Math.max(HALF_W + 0.01, Math.min((axis === 'x' ? SX : SZ) - HALF_W - 0.01, p[axis]));
    if (collides(p)) {
      // subir escalón automático (1 bloque)
      if (player.onGround) {
        p.y += 1.01;
        if (!collides(p)) {
          player.vy = 2;
          return;
        }
        p.y -= 1.01;
      }
      p[axis] = old;
    }
  };

  // ---------- Raycast de vóxeles ----------
  interface Hit {
    ghost?: Ghost;
    hit?: [number, number, number];
    prev?: [number, number, number];
  }
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const ray = (): Hit | null => {
    const o = camera.getWorldPosition(rayOrigin);
    const d = rayDirection.set(0, 0, -1).applyQuaternion(camera.quaternion);
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
    const tdx = Math.abs(1 / d.x), tdy = Math.abs(1 / d.y), tdz = Math.abs(1 / d.z);
    let tx = sx === 0 ? Infinity : (sx > 0 ? x + 1 - o.x : o.x - x) * tdx;
    let ty = sy === 0 ? Infinity : (sy > 0 ? y + 1 - o.y : o.y - y) * tdy;
    let tz = sz === 0 ? Infinity : (sz > 0 ? z + 1 - o.z : o.z - z) * tdz;
    let prev: [number, number, number] | undefined;
    let t = 0;
    const reach = 7.5;
    const ghostReach = 16;
    while (t < ghostReach) {
      const g = ghostMap.get(ghostKey(x, y, z));
      if (g && world.get(x, y, z) === 0) return { ghost: g };
      if (world.get(x, y, z) !== 0) return t <= reach ? { hit: [x, y, z], prev } : null;
      prev = [x, y, z];
      if (tx < ty && tx < tz) {
        x += sx;
        t = tx;
        tx += tdx;
      } else if (ty < tz) {
        y += sy;
        t = ty;
        ty += tdy;
      } else {
        z += sz;
        t = tz;
        tz += tdz;
      }
      if (y < 0 && d.y <= 0) break;
    }
    return null;
  };

  // ---------- UI (DOM) ----------
  const ui = document.createElement('div');
  ui.className = 'mc-ui';
  ui.innerHTML = `
    <div class="mc-cross"></div>
    <button class="mc-flight" aria-pressed="false">Volar</button>
    <button class="mc-down" aria-label="Bajar" hidden>↓</button>
    <div class="mc-goal" hidden></div>
    <div class="mc-toast" hidden></div>
    <div class="mc-bar"></div>
    <button class="mc-inv-btn" aria-label="Inventario">▦</button>
    <div class="mc-inv" hidden><div class="mc-inv-box"><div class="mc-inv-title">Bloques</div><div class="mc-inv-grid"></div><button class="mc-inv-close">Listo</button></div></div>
    ${coarse ? '<div class="mc-joy"><div class="mc-knob"></div></div><button class="mc-jump" aria-label="Saltar">⤒</button>' : '<div class="mc-keys">Clic para controlar el mouse · WASD: caminar · Doble espacio o doble clic: volar · E: bloques · Esc: liberar</div>'}
  `;
  host.append(ui);
  const goalEl = ui.querySelector('.mc-goal') as HTMLElement;
  const toastEl = ui.querySelector('.mc-toast') as HTMLElement;
  const barEl = ui.querySelector('.mc-bar') as HTMLElement;
  const invEl = ui.querySelector('.mc-inv') as HTMLElement;
  const invGrid = ui.querySelector('.mc-inv-grid') as HTMLElement;
  const knob = ui.querySelector('.mc-knob') as HTMLElement | null;
  const joyEl = ui.querySelector('.mc-joy') as HTMLElement | null;

  const hotbar = lv.kind === 'libre' ? [B.ROJO, B.AMARILLO, B.AZUL, B.VERDE, B.PLANKS, B.LOG, B.BRICK, B.GLASS, B.STONE] : HOTBAR_DEFAULT.slice();
  let sel = 0;
  const icons = new Map<number, string>();
  const icon = (id: number) => {
    let s = icons.get(id);
    if (!s) icons.set(id, (s = blockIcon(id, 64)));
    return s;
  };
  const drawBar = () => {
    barEl.innerHTML = '';
    hotbar.forEach((id, i) => {
      const b = document.createElement('button');
      b.className = 'mc-slot' + (i === sel ? ' sel' : '');
      b.innerHTML = `<img alt="${BLOCKS[id].name}" src="${icon(id)}">`;
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        sel = i;
        sfx.tap();
        drawBar();
        showToast(BLOCKS[id].name);
      });
      barEl.append(b);
    });
    hand.geometry = handGeo(hotbar[sel]);
  };
  drawBar();
  INVENTORY.forEach((id) => {
    const b = document.createElement('button');
    b.className = 'mc-slot';
    b.innerHTML = `<img alt="${BLOCKS[id].name}" src="${icon(id)}">`;
    b.addEventListener('click', () => {
      hotbar[sel] = id;
      sfx.pop();
      drawBar();
      invEl.hidden = true;
      showToast(BLOCKS[id].name);
    });
    invGrid.append(b);
  });
  (ui.querySelector('.mc-inv-btn') as HTMLElement).addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    sfx.tap();
    setInventory(invEl.hidden);
  });
  (ui.querySelector('.mc-inv-close') as HTMLElement).addEventListener('click', () => (invEl.hidden = true));
  invEl.addEventListener('pointerdown', (e) => e.stopPropagation());

  function setInventory(open: boolean) {
    invEl.hidden = !open;
    clearInput();
    if (open && document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  }

  let toastT: number | undefined;
  function showToast(text: string) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = window.setTimeout(() => (toastEl.hidden = true), 1300);
  }

  // ---------- Objetivo ----------
  let lastCount = 0;
  let done = false;
  let mistakes = 0;
  const total = ghosts.length;
  const countFilled = () => ghosts.filter(filled).length;
  const updateGoal = () => {
    if (!total) {
      goalEl.hidden = true;
      return;
    }
    const n = countFilled();
    goalEl.hidden = false;
    const label = lv.kind === 'apilar' ? 'Torre' : lv.kind === 'colores' ? 'Colores' : lv.kind === 'nombre' ? name : lv.kind === 'inicial' ? `Letra ${name[0]}` : `Letra ${lv.letter}`;
    goalEl.innerHTML = `<b>${label}</b> <span>${n} / ${total}</span><i style="width:${(n / total) * 100}%"></i>`;
    if (lv.kind === 'apilar' && n > lastCount && n <= 10) say('num_' + n);
    lastCount = n;
    if (n >= total && !done) {
      done = true;
      sfx.win();
      const c = ghosts.reduce((a, g) => a.add(new THREE.Vector3(g.x, g.y, g.z)), new THREE.Vector3()).divideScalar(total);
      for (let i = 0; i < 5; i++) later(() => burst(c.x, c.y + 1, c.z, [B.ROJO, B.AMARILLO, B.AZUL, B.VERDE, B.ROSA][i], 14, 6), i * 180);
      later(() => say(lv.kind === 'nombre' ? 'nivel_superado_3' : 'nivel_superado'), lv.kind === 'apilar' ? 900 : 100);
      const stars = lv.kind === 'colores' ? Math.max(1, 3 - Math.floor(mistakes / 2)) : 3;
      later(() => ctx.complete(stars, lv.kind === 'letra' ? [lv.letter!] : lv.kind === 'inicial' ? [name[0]] : []), 2200);
    }
  };

  // ---------- Acciones ----------
  const playerBoxHits = (x: number, y: number, z: number) => {
    const p = player.pos;
    return x + 1 > p.x - HALF_W && x < p.x + HALF_W && z + 1 > p.z - HALF_W && z < p.z + HALF_W && y + 1 > p.y && y < p.y + HEIGHT;
  };
  const place = () => {
    if (dead || paused || done) return;
    const h = ray();
    if (!h) return;
    const cell = h.ghost ? [h.ghost.x, h.ghost.y, h.ghost.z] : h.prev;
    if (!cell) return;
    const [x, y, z] = cell;
    if (!world.inside(x, y, z) || world.get(x, y, z) !== 0 || playerBoxHits(x, y, z)) return;
    const id = hotbar[sel];
    if (h.ghost && h.ghost.req && h.ghost.req !== id) {
      mistakes++;
      sfx.bad();
      say('craft_color_mal');
      showToast(`Aquí va ${BLOCKS[h.ghost.req].name.toLowerCase()}`);
      return;
    }
    world.set(x, y, z, id);
    rebuild();
    updateGhosts();
    sfx.place();
    swing = 0.001;
    updateGoal();
  };
  const breakBlock = () => {
    if (dead || paused || done) return;
    const h = ray();
    if (!h?.hit) return;
    const [x, y, z] = h.hit;
    const id = world.get(x, y, z);
    if (y === 0 || id === B.DARK) return;
    world.set(x, y, z, 0);
    rebuild();
    updateGhosts();
    burst(x, y, z, id);
    sfx.thud();
    swing = 0.001;
    updateGoal();
  };

  // ---------- Entrada ----------
  const el = renderer.domElement;
  const ptrs = new Map<number, { kind: 'joy' | 'look'; sx: number; sy: number; lx: number; ly: number; t0: number; moved: boolean; used: boolean; timer?: number }>();
  let lockUnavailable = !el.requestPointerLock;
  let clickTimer: number | undefined;
  let lastJump = -Infinity;
  const flightBtn = ui.querySelector('.mc-flight') as HTMLButtonElement;
  const downBtn = ui.querySelector('.mc-down') as HTMLButtonElement;
  const toggleFlight = () => {
    if (paused || done) return;
    player.flying = !player.flying;
    player.vy = 0;
    jumpReq = false;
    flightBtn.textContent = player.flying ? 'Volar: sí' : 'Volar';
    flightBtn.setAttribute('aria-pressed', String(player.flying));
    downBtn.hidden = !player.flying || !coarse;
    showToast(player.flying ? coarse ? '¡A volar! Mantén ↑ para subir y ↓ para bajar' : '¡A volar! Espacio: subir · Shift: bajar' : 'Vuelo desactivado');
  };
  const jump = () => {
    const now = performance.now();
    if (now - lastJump < 320) { toggleFlight(); lastJump = -Infinity; }
    else { jumpReq = true; lastJump = now; }
  };
  const onDoubleClick = (e: MouseEvent) => {
    e.preventDefault();
    clearTimeout(clickTimer);
    if (invEl.hidden) toggleFlight();
  };
  const onLockError = () => {
    if (dead) return;
    lockUnavailable = true;
    ui.querySelector('.mc-keys')?.replaceChildren(document.createTextNode('Arrastra: mirar · Clic: quitar · Clic derecho: poner · Doble clic/espacio: volar · E: bloques'));
    showToast('Arrastra para mirar · Doble clic: volar');
  };
  function clearInput() {
    keys.clear();
    joy.x = joy.y = 0;
    jumpReq = false;
    clearTimeout(clickTimer);
    ptrs.forEach(p => clearTimeout(p.timer));
    ptrs.clear();
    if (knob) knob.style.transform = '';
    joyEl?.classList.remove('on');
  }
  const onLockChange = () => {
    clearInput();
    if (dead) return;
    const locked = document.pointerLockElement === el;
    ui.querySelector('.mc-keys')?.replaceChildren(document.createTextNode(locked
      ? 'Mouse: mirar · Clic: quitar · Clic derecho: poner · Doble clic/espacio: volar · Shift: bajar · E: bloques · Esc: salir'
      : 'Clic para controlar el mouse · WASD: caminar · Doble espacio o doble clic: volar · E: bloques'));
  };
  const onMouseMove = (e: MouseEvent) => {
    if (paused || !invEl.hidden || document.pointerLockElement !== el) return;
    player.yaw -= e.movementX * 0.0025;
    player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - e.movementY * 0.0025));
  };
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onLockChange);
  document.addEventListener('pointerlockerror', onLockError);
  window.addEventListener('blur', clearInput);
  el.addEventListener('dblclick', onDoubleClick);
  flightBtn.addEventListener('click', toggleFlight);
  downBtn.addEventListener('pointerdown', e => { downBtn.setPointerCapture(e.pointerId); keys.add('shift'); });
  downBtn.addEventListener('pointerup', () => keys.delete('shift'));
  downBtn.addEventListener('pointercancel', () => keys.delete('shift'));
  const JOY_R = 56;
  const longMs = ctx.easy ? 450 : 380;
  const onDown = (e: PointerEvent) => {
    e.preventDefault();
    if (!invEl.hidden || paused || done) return;
    if (e.pointerType === 'mouse' && !lockUnavailable && document.pointerLockElement !== el) {
      try {
        const request = el.requestPointerLock();
        request?.catch(onLockError);
      } catch { onLockError(); }
      return;
    }
    if (e.pointerType === 'mouse' && document.pointerLockElement === el) {
      if (e.button === 2) place();
      else if (e.button === 0) {
        clearTimeout(clickTimer);
        clickTimer = window.setTimeout(() => breakBlock(), 300);
      }
      return;
    }
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (e.button === 2) {
      place();
      return;
    }
    const isJoy = coarse && e.pointerType !== 'mouse' && x < r.width * 0.42 && y > r.height * 0.45 && ![...ptrs.values()].some((p) => p.kind === 'joy');
    const p = { kind: (isJoy ? 'joy' : 'look') as 'joy' | 'look', sx: x, sy: y, lx: x, ly: y, t0: performance.now(), moved: false, used: false, timer: undefined as number | undefined };
    if (isJoy && joyEl) {
      joyEl.style.left = x - 70 + 'px';
      joyEl.style.top = y - 70 + 'px';
      joyEl.classList.add('on');
    }
    if (!isJoy) {
      p.timer = window.setTimeout(() => {
        if (!p.moved) {
          p.used = true;
          breakBlock();
        }
      }, longMs);
    }
    ptrs.set(e.pointerId, p);
  };
  const onMove = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (p.kind === 'joy') {
      let dx = x - p.sx, dy = y - p.sy;
      const d = Math.hypot(dx, dy);
      if (d > JOY_R) {
        dx = (dx / d) * JOY_R;
        dy = (dy / d) * JOY_R;
      }
      joy.x = dx / JOY_R;
      joy.y = dy / JOY_R;
      if (knob) knob.style.transform = `translate(${dx}px, ${dy}px)`;
      return;
    }
    const dx = x - p.lx, dy = y - p.ly;
    p.lx = x;
    p.ly = y;
    if (Math.hypot(x - p.sx, y - p.sy) > 10) p.moved = true;
    if (p.moved) {
      const k = e.pointerType === 'mouse' ? 0.0045 : 0.0058;
      player.yaw -= dx * k;
      player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - dy * k));
    }
  };
  const onUp = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    ptrs.delete(e.pointerId);
    clearTimeout(p.timer);
    if (p.kind === 'joy') {
      joy.x = joy.y = 0;
      if (knob) knob.style.transform = '';
      joyEl?.classList.remove('on');
      return;
    }
    if (e.type !== 'pointercancel' && !p.moved && !p.used && performance.now() - p.t0 < longMs) {
      if (e.pointerType === 'mouse') { clearTimeout(clickTimer); clickTimer = window.setTimeout(breakBlock, 300); }
      else place();
    }
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    sel = (sel + (e.deltaY > 0 ? 1 : hotbar.length - 1)) % hotbar.length;
    drawBar();
  }, { passive: false });
  const jumpBtn = ui.querySelector('.mc-jump') as HTMLElement | null;
  jumpBtn?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    jumpBtn!.setPointerCapture(e.pointerId);
    keys.add(' ');
    jump();
  });
  jumpBtn?.addEventListener('pointerup', () => keys.delete(' '));
  jumpBtn?.addEventListener('pointercancel', () => keys.delete(' '));
  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (e.type === 'keydown') {
      if (paused || done || e.target instanceof HTMLInputElement) return;
      if (k === 'e' && !e.repeat) { e.preventDefault(); setInventory(invEl.hidden); return; }
      if (k === 'escape') { setInventory(false); return; }
      if (!invEl.hidden) return;
      keys.add(k);
      if (k === ' ' && !e.repeat) jump();
      if (/^[1-9]$/.test(k)) {
        sel = Number(k) - 1;
        drawBar();
      }
      if (['arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
    } else keys.delete(k);
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  // ---------- Bucle ----------
  const ro = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(host);

  let raf = 0;
  let last = performance.now();
  let t = 0;
  const speed = ctx.easy ? 3.6 : 4.4;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (paused || !invEl.hidden) return;
    t += dt;
    // movimiento
    let fx = 0, fz = 0;
    if (keys.has('w') || keys.has('arrowup')) fz -= 1;
    if (keys.has('s') || keys.has('arrowdown')) fz += 1;
    if (keys.has('a') || keys.has('arrowleft')) fx -= 1;
    if (keys.has('d') || keys.has('arrowright')) fx += 1;
    fx += joy.x;
    fz += joy.y;
    const len = Math.hypot(fx, fz);
    if (len > 1) {
      fx /= len;
      fz /= len;
    }
    const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
    const mx = (fx * cos + fz * sin) * speed * dt;
    const mz = (-fx * sin + fz * cos) * speed * dt;
    if (mx) tryMove('x', mx);
    if (mz) tryMove('z', mz);
    if (len > 0.1 && player.onGround) bob += dt * 9;
    // Vuelo creativo: sin gravedad, con colisiones y techo de seguridad.
    if (player.flying) {
      player.onGround = false;
      player.vy = 0;
      const y = player.pos.y;
      player.pos.y = Math.min(SY + 20, player.pos.y + ((keys.has(' ') ? 1 : 0) - (keys.has('shift') ? 1 : 0)) * 5 * dt);
      if (collides(player.pos)) player.pos.y = y;
    } else {
    // gravedad y salto
    if (jumpReq && player.onGround) player.vy = 7.6;
    jumpReq = false;
    player.vy -= 24 * dt;
    player.pos.y += player.vy * dt;
    player.onGround = false;
    if (collides(player.pos)) {
      if (player.vy < 0) {
        player.pos.y = Math.floor(player.pos.y) + 1;
        player.onGround = true;
      } else player.pos.y = Math.floor(player.pos.y + HEIGHT) - HEIGHT - 0.001;
      player.vy = 0;
      if (collides(player.pos)) player.pos.y += 1; // desatascar
    }
    }
    jumpReq = false;
    if (player.pos.y < -4) player.pos.set(16.5, 8, 24.5);
    camera.position.set(player.pos.x, player.pos.y + EYE + Math.sin(bob) * 0.04, player.pos.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    // cámara de cine (solo para grabar tráilers)
    const cine = (window as any).__cine as { pos: number[]; look: number[]; fov?: number } | undefined;
    hand.visible = !cine;
    if (cine) {
      camera.position.set(cine.pos[0], cine.pos[1], cine.pos[2]);
      camera.lookAt(cine.look[0], cine.look[1], cine.look[2]);
      if (cine.fov && camera.fov !== cine.fov) {
        camera.fov = cine.fov;
        camera.updateProjectionMatrix();
      }
    }
    // contorno del bloque apuntado
    const h = ray();
    const cell = h?.ghost ? [h.ghost.x, h.ghost.y, h.ghost.z] : h?.hit;
    if (cell) {
      outline.visible = true;
      outline.position.set(cell[0] + 0.5, cell[1] + 0.5, cell[2] + 0.5);
      (outline.material as THREE.LineBasicMaterial).color.set(h?.ghost ? 0xffffff : 0x1b1d2e);
    } else outline.visible = false;
    // progreso de "romper" al mantener
    const holding = [...ptrs.values()].find((p) => p.kind === 'look' && !p.moved && !p.used);
    if (holding && h?.hit) {
      const k = Math.min(1, (performance.now() - holding.t0) / longMs);
      breakBox.visible = k > 0.15;
      breakBox.position.set(h.hit[0] + 0.5, h.hit[1] + 0.5, h.hit[2] + 0.5);
      (breakBox.material as THREE.MeshBasicMaterial).opacity = k * 0.45;
      breakBox.scale.setScalar(1.01 - k * 0.04);
    } else breakBox.visible = false;
    // fantasmas que laten
    ghostMat.opacity = 0.6 + Math.sin(t * 4) * 0.25;
    // mano
    if (swing > 0) {
      swing += dt * 5;
      if (swing >= 1) swing = 0;
    }
    placeHand();
    // partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.v.y -= 14 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += dt * 5;
      if (p.life <= 0) {
        scene.remove(p.m);
        particles.splice(i, 1);
      }
    }
    clouds.position.x = (t * 0.6) % 60;
    renderer.render(scene, camera);
  };

  // ---------- Inicio ----------
  updateGhosts();
  updateGoal();
  ctx.setTitle(lv.title);
  const intro = async () => {
    if (dead) return;
    if (lv.kind === 'letra') await say('craft_intro_letra', { letra: letterName(lv.letter!) });
    else if (lv.kind === 'inicial') await say('craft_intro_letra', { letra: letterName(name[0]) });
    else if (lv.kind === 'nombre') await say('craft_intro_nombre', { nombre: ctx.profile.name });
    else if (lv.kind === 'apilar') await say('craft_intro_apilar');
    else if (lv.kind === 'colores') await say('craft_intro_colores');
    else await say('craft_intro_libre');
    if (!dead && (ctx.level <= 1 || ctx.easy)) await say('craft_ayuda');
  };
  ctx.setRepeat(() => intro());
  intro();
  if (location.search.includes('debug')) (window as any).__craft = { placeAt: (x: number, y: number, z: number, id: number) => { world.set(x, y, z, id); rebuild(); updateGhosts(); updateGoal(); if (id === 0) burst(x, y, z, B.STONE); }, burst, rebuildTime: () => { const t0 = performance.now(); rebuild(); return performance.now() - t0; }, world, player, ghosts, place, breakBlock, ray, camera, hotbar, setSel: (i: number) => ((sel = i), drawBar()) };
  raf = requestAnimationFrame(loop);

  return {
    setPaused(value: boolean) {
      paused = value;
      if (value) { clearInput(); if (document.pointerLockElement === el) document.exitPointerLock(); }
    },
    destroy() {
      dead = true;
      clearInput();
      timers.forEach(clearTimeout);
      if (document.pointerLockElement === el) document.exitPointerLock();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      window.removeEventListener('blur', clearInput);
      if (location.search.includes('debug')) delete (window as any).__craft;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      clearTimeout(toastT);
      ptrs.forEach((p) => clearTimeout(p.timer));
      const geometries = new Set<THREE.BufferGeometry>([...handGeoms.values(), ...partGeoms.values()]);
      const materials = new Set<THREE.Material>([partMat]);
      const textures = new Set<THREE.Texture>([atlas, ghostTex]);
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.geometry) geometries.add(m.geometry);
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(mat => materials.add(mat));
        if (o instanceof THREE.InstancedMesh) o.dispose();
      });
      materials.forEach(mat => {
        Object.values(mat).forEach(v => { if (v instanceof THREE.Texture) textures.add(v); });
        mat.dispose();
      });
      geometries.forEach(g => g.dispose());
      textures.forEach(t => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      ui.remove();
    },
  };
}
