// Planos 9:16 para tráiler y anuncios. Uso:
//   npm run build && npm run preview   (otra terminal)
//   node scripts/clips/planos.mjs [filtro...]
import { launch, Shot, VW, VH } from './shot.mjs';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';

const OUT = 'media/clips';
mkdirSync(OUT, { recursive: true });

// ---------- utilidades de cámara ----------
const ease = (k) => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k));
/** interpola keyframes [{f, ...valores}] por número de cuadro */
function kf(keys) {
  return (i) => {
    if (i <= keys[0].f) return { ...keys[0] };
    for (let j = 1; j < keys.length; j++) {
      const a = keys[j - 1], b = keys[j];
      if (i <= b.f) {
        const k = ease((i - a.f) / (b.f - a.f));
        const o = {};
        for (const key of Object.keys(b)) {
          if (typeof b[key] === 'number' && typeof a[key] === 'number') o[key] = a[key] + (b[key] - a[key]) * k;
          else if (Array.isArray(b[key])) o[key] = b[key].map((v, n) => a[key][n] + (v - a[key][n]) * k);
          else o[key] = b[key];
        }
        return o;
      }
    }
    return { ...keys[keys.length - 1] };
  };
}

// Cámara de Phaser (zoom / seguimiento) — se instala en la página
const PHASER_CAM = () => {
  window.__camFn = (c) => {
    const s = window.__scene;
    if (!s || !s.cameras) return;
    const cm = s.cameras.main;
    if (!cm.__b) {
      cm.setBounds(0, 0, s.scale.width, s.scale.height);
      cm.__b = 1;
    }
    let tx = c.x, ty = c.y;
    if (c.follow === 'snake') {
      tx = s.sx(s.head);
      ty = s.sy(s.head);
    } else if (c.follow === 'ninja' && window.__ninja && window.__ninja.piece) {
      tx = window.__ninja.piece.x;
      ty = window.__ninja.piece.y;
    } else if (c.follow === 'proj' && s.proj) {
      tx = s.proj.x;
      ty = s.proj.y;
    }
    if (tx == null) {
      tx = s.scale.width / 2;
      ty = s.scale.height / 2;
    }
    const st = (window.__camS = window.__camS || { x: tx, y: ty });
    const k = c.lerp ?? 1;
    st.x += (tx - st.x) * k;
    st.y += (ty - st.y) * k;
    cm.setZoom(c.z ?? 1);
    cm.centerOn(st.x, st.y);
  };
};

// Snake: la víbora sigue sola los puntos del trazo
const SNAKE_DRIVER = () => {
  window.__drive = () => {
    const s = window.__scene;
    if (!s || s.state !== 'play') return;
    if (s.tapDot) return s.finishStroke();
    const d = s.dots[s.si];
    if (!d) return;
    s.target = { ...d[Math.min(s.di, d.length - 1)] };
  };
};

// Ninja: dibuja la letra sobre la burbuja y corta (opción: equivocarse una vez)
const NINJA_DRIVER = (opts) => {
  const st = { phase: 'idle', pts: [], k: 0, strokes: [], wait: 0, wrongLeft: opts.wrong || 0, cuts: 0 };
  window.__ninja = st;
  window.__drive = () => {
    const s = window.__scene;
    if (!s || s.over || !s.target) return;
    const H = s.scale.height;
    if (st.phase === 'idle') {
      if (st.cuts >= (opts.max ?? 99)) return;
      if (st.wait > 0) return void st.wait--;
      const tk = s.keyOf(s.target);
      const alive = s.pieces.filter((p) => p.alive && p.y < H * 0.62 && p.vy > -260);
      let piece = alive.find((p) => p.key === tk);
      if (!piece) return;
      if (st.wrongLeft > 0) {
        const o = alive.find((p) => p.key !== tk);
        if (o) {
          piece = o;
          st.wrongLeft--;
        }
      }
      const L = window.__LETTERS[piece.key];
      const size = piece.r * 2.6;
      const ox = piece.x - size / 2, oy = piece.y - size / 2 + (piece.vy * 0.35);
      st.strokes = L.map((sk) => sk.map((p) => ({ x: ox + (p.x * size) / 100, y: oy + (p.y * size) / 100 })));
      st.si = 0;
      st.k = 0;
      st.phase = 'draw';
      st.piece = piece;
    }
    if (st.phase === 'draw') {
      const sk = st.strokes[st.si];
      const n = Math.max(1, Math.ceil(sk.length / (opts.speed || 6)));
      st.k = Math.min(sk.length, st.k + Math.ceil(sk.length / Math.max(4, n)));
      s.curStroke = sk.slice(0, st.k);
      const tip = s.curStroke[s.curStroke.length - 1];
      s.blade.push({ x: tip.x, y: tip.y, t: s.time.now });
      if (st.k >= sk.length) {
        s.strokes.push(sk.length === 1 ? [sk[0]] : sk);
        s.curStroke = null;
        st.si++;
        st.k = 0;
        if (st.si >= st.strokes.length) {
          s.recognizeGesture();
          st.phase = 'idle';
          st.cuts++;
          st.wait = 22;
        }
      }
    }
  };
};

const CRAFT_CAM = () => {
  window.__camFn = (c) => {
    window.__cine = c.pos ? c : undefined;
  };
};

async function ready(sh, cond, arg) {
  await sh.until(cond, arg);
}

// ---------- Planos ----------
const SHOTS = {
  // ===== Plataforma =====
  'plataforma-1-hub': async (sh) => {
    await sh.go('hub');
    await sh.skip(700);
    sh.record();
    sh.last = [VW * 0.5, VH * 0.9];
    await sh.moveTo(VW * 0.6, VH * 0.6, 20);
    await sh.page.mouse.wheel(0, 260);
    await sh.roll(1100);
    await sh.page.mouse.wheel(0, -260);
    await sh.roll(700);
    const b = await sh.page.locator('.game-card >> nth=0').boundingBox();
    await sh.tap(b.x + b.width / 2, b.y + b.height * 0.4, 16);
    await sh.roll(1400);
  },
  'plataforma-2-tutorial': async (sh) => {
    await sh.go('play', { game: 'ninja', level: 0, tutorial: true });
    await sh.skip(300);
    sh.record();
    await sh.roll(2600);
    const b = await sh.page.locator('.tut-go').boundingBox();
    sh.last = [VW * 0.7, VH * 0.95];
    await sh.tap(b.x + b.width / 2, b.y + b.height / 2, 14);
    await sh.roll(1500);
  },
  'plataforma-3-estrellas': async (sh) => {
    await sh.go('play', { game: 'snake', level: 0 });
    await ready(sh, () => window.__scene && window.__scene.state === 'play');
    await sh.page.evaluate(SNAKE_DRIVER);
    await sh.skip(1800);
    sh.record();
    await sh.roll(4300);
  },
  'plataforma-4-mision-del-dia': async (sh) => {
    await sh.go('mission');
    await sh.skip(400);
    sh.record();
    await sh.roll(1800);
    const b = await sh.page.locator('text=¡Lo hice!').boundingBox();
    sh.last = [VW * 0.5, VH * 0.95];
    await sh.tap(b.x + b.width / 2, b.y + b.height / 2, 14);
    await sh.roll(2200);
  },
  'plataforma-5-perfiles': async (sh) => {
    await sh.go('profiles');
    await sh.skip(400);
    sh.record();
    await sh.roll(1200);
    const b = await sh.page.locator('.profile-tile >> nth=0').boundingBox();
    sh.last = [VW * 0.5, VH * 0.95];
    await sh.tap(b.x + b.width / 2, b.y + b.height / 2, 16);
    await sh.roll(2400);
  },

  // ===== Snake Lecto =====
  'snake-1-cenital-letra-a': async (sh) => {
    await sh.go('play', { game: 'snake', level: 4 });
    await ready(sh, () => window.__scene && window.__scene.state === 'play');
    await sh.skip(1500);
    await sh.page.evaluate(SNAKE_DRIVER);
    sh.record();
    await sh.roll(4800);
  },
  'snake-2-seguimiento-M': async (sh) => {
    await sh.go('play', { game: 'snake', level: 11 });
    await ready(sh, () => window.__scene && window.__scene.state === 'play');
    await sh.clean();
    await sh.page.evaluate(PHASER_CAM);
    await sh.skip(1200);
    await sh.page.evaluate(SNAKE_DRIVER);
    sh.cam = kf([{ f: 0, z: 2.3, follow: 'snake', lerp: 0.18 }, { f: 120, z: 1.8, follow: 'snake', lerp: 0.18 }, { f: 150, z: 1.8, follow: 'snake', lerp: 0.18 }]);
    sh.record();
    await sh.roll(5000);
  },
  'snake-3-final-camara-lenta': async (sh) => {
    await sh.go('play', { game: 'snake', level: 14 });
    await ready(sh, () => window.__scene && window.__scene.state === 'play');
    await sh.clean();
    await sh.page.evaluate(SNAKE_DRIVER);
    await sh.skip(1200);
    // adelantar hasta cerca del final
    await sh.until(() => {
      const s = window.__scene;
      return s.si === s.dots.length - 1 && s.di > s.dots[s.si].length - 9;
    });
    sh.record();
    await sh.roll(900);
    sh.speed = 0.4;
    await sh.roll(2400);
    sh.speed = 1;
    await sh.roll(1500);
    return { zoom: [{ t: 0, z: 1.25, x: 0.5, y: 0.5 }, { t: 0.4, z: 1.45, x: 0.5, y: 0.52 }, { t: 1, z: 1.05, x: 0.5, y: 0.5 }] };
  },
  'snake-4-error-reintenta': async (sh) => {
    await sh.go('play', { game: 'snake', level: 9 });
    await ready(sh, () => window.__scene && window.__scene.state === 'play');
    await sh.page.evaluate(SNAKE_DRIVER);
    await sh.skip(1300);
    await sh.until(() => window.__scene.di > 22);
    sh.record();
    await sh.roll(700);
    // la víbora se va del camino
    await sh.page.evaluate(() => {
      const s = window.__scene;
      window.__drive = () => {
        if (s.state === 'play') s.target = { x: s.head.x + 18, y: s.head.y - 6 };
      };
    });
    await sh.roll(2400);
    await sh.page.evaluate(() => (window.__drive = null));
    await sh.roll(1500);
  },

  // ===== Trazo Ninja =====
  'ninja-1-vocales': async (sh) => {
    await sh.go('play', { game: 'ninja', level: 0 });
    await ready(sh, () => window.__scene && window.__scene.target);
    await sh.skip(900);
    await sh.page.evaluate(NINJA_DRIVER, { speed: 5 });
    sh.record();
    await sh.roll(5000);
  },
  'ninja-2-corte-camara-lenta': async (sh) => {
    await sh.go('play', { game: 'ninja', level: 2 });
    await ready(sh, () => window.__scene && window.__scene.target);
    await sh.clean();
    await sh.skip(900);
    await sh.page.evaluate(PHASER_CAM);
    await sh.page.evaluate(NINJA_DRIVER, { speed: 4, max: 1 });
    await sh.until(() => window.__ninja.phase === 'draw');
    sh.cam = kf([{ f: 0, z: 1.15, follow: 'ninja', lerp: 0.12 }, { f: 70, z: 1.9, follow: 'ninja', lerp: 0.12 }, { f: 150, z: 1.3, follow: 'ninja', lerp: 0.08 }]);
    sh.record();
    sh.speed = 0.3;
    await sh.roll(3300);
    sh.speed = 1;
    await sh.roll(1500);
  },
  'ninja-3-error-resta': async (sh) => {
    await sh.go('play', { game: 'ninja', level: 1 });
    await ready(sh, () => window.__scene && window.__scene.target);
    await sh.skip(900);
    await sh.page.evaluate(NINJA_DRIVER, { speed: 5, wrong: 1 });
    sh.record();
    await sh.roll(5000);
  },
  'ninja-4-silabas': async (sh) => {
    await sh.go('play', { game: 'ninja', level: 4 });
    await ready(sh, () => window.__scene && window.__scene.target);
    await sh.skip(900);
    await sh.page.evaluate(NINJA_DRIVER, { speed: 5 });
    sh.record();
    await sh.roll(5000);
  },
  'ninja-5-cursiva': async (sh) => {
    await sh.go('play', { game: 'ninja', level: 5 });
    await ready(sh, () => window.__scene && window.__scene.target);
    await sh.skip(900);
    await sh.page.evaluate(NINJA_DRIVER, { speed: 6 });
    sh.record();
    await sh.roll(5000);
  },

  // ===== CaliCrash =====
  'calicrash-1-tablero': async (sh) => {
    await sh.go('play', { game: 'crash', level: 0 });
    await ready(sh, () => window.__scene && window.__scene.grid && window.__scene.grid.length === 7);
    await sh.skip(1200);
    sh.record();
    for (let i = 0; i < 3; i++) {
      await crashSwipe(sh);
      await sh.roll(1100);
    }
    await sh.roll(300);
  },
  'calicrash-2-combo-acercamiento': async (sh) => {
    await sh.go('play', { game: 'crash', level: 3 });
    await ready(sh, () => window.__scene && window.__scene.grid && window.__scene.grid.length === 7);
    await sh.clean();
    await sh.skip(1200);
    sh.record();
    await crashSwipe(sh, true);
    sh.speed = 0.6;
    await sh.roll(2200);
    sh.speed = 1;
    await crashSwipe(sh, true);
    await sh.roll(1600);
    return { zoom: [{ t: 0, z: 1.0, x: 0.5, y: 0.5 }, { t: 0.5, z: 1.12, x: 0.5, y: 0.52 }, { t: 1, z: 1.05, x: 0.5, y: 0.5 }] };
  },
  'calicrash-3-forma-SOL': async (sh) => {
    await sh.go('play', { game: 'crash', level: 2 });
    await ready(sh, () => window.__scene && window.__scene.grid && window.__scene.grid.length === 7);
    await sh.skip(1200);
    sh.record();
    await crashWord(sh);
    await sh.roll(1800);
    await crashWord(sh);
    await sh.roll(600);
  },
  'calicrash-4-cursiva-casa': async (sh) => {
    await sh.go('play', { game: 'crash', level: 9 });
    await ready(sh, () => window.__scene && window.__scene.grid && window.__scene.grid.length === 7);
    await sh.skip(1200);
    sh.record();
    await crashWord(sh);
    await sh.roll(1800);
    await crashWord(sh);
    await sh.roll(500);
  },

  // ===== Angry Forms =====
  'angry-1-tension-y-disparo': async (sh) => {
    await sh.go('play', { game: 'angry', level: 0 });
    await ready(sh, () => window.__scene && window.__scene.settled && window.__scene.proj);
    await sh.page.evaluate(PHASER_CAM);
    sh.record();
    await angryShot(sh, { follow: true });
  },
  'angry-2-impacto-camara-lenta': async (sh) => {
    await sh.go('play', { game: 'angry', level: 1 });
    await ready(sh, () => window.__scene && window.__scene.settled && window.__scene.proj);
    await sh.clean();
    await sh.page.evaluate(PHASER_CAM);
    await angryShot(sh, { follow: true, recordFromImpact: true });
  },
  'angry-3-elige-la-forma': async (sh) => {
    await sh.go('play', { game: 'angry', level: 2 });
    await ready(sh, () => window.__scene && window.__scene.settled);
    sh.record();
    await angryPick(sh, 'cuadrado');
    await sh.roll(900);
    await angryPick(sh, 'triangulo');
    await sh.roll(300);
    await angryShot(sh, { target: 2, short: true });
  },
  'angry-4-derriba-circulos': async (sh) => {
    await sh.go('play', { game: 'angry', level: 3 });
    await ready(sh, () => window.__scene && window.__scene.settled && window.__scene.proj);
    sh.record();
    await angryShot(sh, {});
  },
  'angry-5-cuenta-lados': async (sh) => {
    await sh.go('play', { game: 'angry', level: 6 });
    await ready(sh, () => window.__scene && window.__scene.settled && window.__scene.proj);
    sh.record();
    await angryShot(sh, { target: 2 });
  },

  // ===== Montecraft =====
  'montecraft-1-vuelo-aereo': async (sh) => {
    await sh.go('play', { game: 'craft', level: 6 });
    await ready(sh, () => window.__craft);
    await sh.clean();
    await sh.page.evaluate(CRAFT_CAM);
    await craftBuildCastle(sh);
    sh.cam = (i) => {
      const a = -0.75 + i * 0.011;
      const r = 14 - i * 0.02;
      return { pos: [16 + Math.sin(a) * r, 13.5 - i * 0.022, 15 + Math.cos(a) * r], look: [16, 5.5, 13.5], fov: 72 };
    };
    sh.record();
    await sh.roll(5000);
  },
  'montecraft-2-primera-persona-letra': async (sh) => {
    await sh.go('play', { game: 'craft', level: 0 });
    await ready(sh, () => window.__craft);
    await sh.page.evaluate(() => {
      const p = window.__craft.player;
      p.pos.z = 19.5;
    });
    await sh.skip(1500);
    sh.record();
    await craftFillGhosts(sh, 11, 6);
    await sh.roll(1200);
  },
  'montecraft-3-torre-timelapse': async (sh) => {
    await sh.go('play', { game: 'craft', level: 1 });
    await ready(sh, () => window.__craft);
    await sh.clean();
    await sh.page.evaluate(CRAFT_CAM);
    await sh.skip(1500);
    const cols = [11, 12, 13, 14, 15, 16, 17, 11, 13, 15];
    sh.cam = (i) => {
      const a = 0.5 + i * 0.006;
      return { pos: [16.5 + Math.sin(a) * 7, 4.6 + i * 0.02, 14.5 + Math.cos(a) * 7], look: [16.5, 7.5 + i * 0.012, 14.5], fov: 62 };
    };
    sh.record();
    await sh.roll(400);
    for (let k = 0; k < 10; k++) {
      await sh.page.evaluate(([k, c]) => {
        const g = window.__craft.ghosts[k];
        window.__craft.placeAt(g.x, g.y, g.z, c);
        window.__craft.burst(g.x, g.y, g.z, c, 6, 2);
      }, [k, cols[k]]);
      await sh.roll(330);
    }
    await sh.roll(800);
  },
  'montecraft-4-contrapicado-nombre': async (sh) => {
    await sh.go('play', { game: 'craft', level: 5 });
    await ready(sh, () => window.__craft);
    await sh.clean();
    await sh.page.evaluate(CRAFT_CAM);
    await sh.page.evaluate(() => {
      const c = window.__craft;
      const cols = [11, 12, 13, 15, 16];
      const xs = [...new Set(c.ghosts.map((g) => g.x))].sort((a, b) => a - b);
      c.ghosts.slice(0, -6).forEach((g) => c.world.set(g.x, g.y, g.z, cols[Math.floor((g.x - xs[0]) / 6)]));
      c.placeAt(c.ghosts[0].x, c.ghosts[0].y, c.ghosts[0].z, 11);
    });
    await sh.skip(1200);
    sh.cam = kf([
      { f: 0, pos: [10, 4.3, 19], look: [16, 8.5, 14], fov: 75 },
      { f: 150, pos: [22, 4.6, 19], look: [16, 8, 14], fov: 75 },
    ]);
    sh.record();
    const left = await sh.page.evaluate(() => window.__craft.ghosts.slice(-6).map((g) => [g.x, g.y, g.z]));
    await sh.roll(600);
    for (const [x, y, z] of left) {
      await sh.page.evaluate(([x, y, z]) => window.__craft.placeAt(x, y, z, 17), [x, y, z]);
      await sh.roll(330);
    }
    await sh.roll(2400);
  },
  'montecraft-5-colores': async (sh) => {
    await sh.go('play', { game: 'craft', level: 2 });
    await ready(sh, () => window.__craft);
    await sh.page.evaluate(() => (window.__craft.player.pos.z = 20.5));
    await sh.skip(1500);
    sh.record();
    await craftFillGhosts(sh, 9, 5);
    await sh.roll(1000);
  },
  'montecraft-6-romper-bloques': async (sh) => {
    await sh.go('play', { game: 'craft', level: 6 });
    await ready(sh, () => window.__craft);
    await sh.page.evaluate(() => {
      const c = window.__craft;
      for (let x = 13; x <= 19; x++) for (let y = 4; y <= 6; y++) c.world.set(x, y, 17, [11, 13, 15][y - 4]);
      c.placeAt(13, 4, 17, 11);
      c.player.pos.set(16.5, 4, 21.5);
    });
    await sh.skip(1200);
    sh.record();
    sh.speed = 1;
    for (const [x, y] of [[16, 6], [15, 6], [17, 5], [16, 5], [16, 4]]) {
      await craftAim(sh, x, y, 17, 8);
      await sh.page.mouse.move(VW / 2, VH / 2);
      await sh.page.mouse.down();
      for (let i = 0; i < 13; i++) await sh.frame();
      await sh.page.mouse.up();
      await sh.roll(150);
    }
    await sh.roll(600);
  },
};

// ---------- bots auxiliares ----------
async function crashSwipe(sh, preferBig = false) {
  const mv = await sh.page.evaluate((big) => {
    const s = window.__scene;
    const g = s.grid;
    let best = null;
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++)
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr, c2 = c + dc;
          if (r2 >= 7 || c2 >= 7) continue;
          const a = g[r][c], b = g[r2][c2];
          g[r][c] = b; g[r2][c2] = a;
          const m = s.findMatches();
          g[r][c] = a; g[r2][c2] = b;
          if (!m.length) continue;
          const score = (big ? m.length * 5 : 0) + m.filter((t) => t.letter === s.lv.letter).length * 10 + m.length + r;
          if (!best || score > best.score) best = { score, a: [r, c], b: [r2, c2] };
        }
    if (!best) return null;
    const P = ([r, c]) => [s.x0 + c * s.cell + s.cell / 2, s.y0 + r * s.cell + s.cell / 2];
    return { a: P(best.a), b: P(best.b) };
  }, preferBig);
  if (!mv) return;
  await sh.moveTo(mv.a[0], mv.a[1], 8);
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push([mv.a[0] + ((mv.b[0] - mv.a[0]) * i) / 8, mv.a[1] + ((mv.b[1] - mv.a[1]) * i) / 8]);
  await sh.path(pts);
  sh.last = mv.b;
}

async function crashWord(sh) {
  const pts = await sh.page.evaluate(() => {
    const s = window.__scene;
    return s.findWordPath().map((t) => [s.x0 + t.col * s.cell + s.cell / 2, s.y0 + t.r * s.cell + s.cell / 2]);
  });
  for (const [x, y] of pts) await sh.tap(x, y, 7);
}

async function angryPick(sh, kind) {
  const pos = await sh.page.evaluate((k) => {
    const s = window.__scene;
    const i = s.lv.tray.indexOf(k);
    const z = s.trayObjs.filter((o) => o.type === 'Zone')[i];
    return [z.x, z.y];
  }, kind);
  await sh.tap(pos[0], pos[1], 12);
}

async function angryShot(sh, { target = 0, follow = false, recordFromImpact = false, short = false }) {
  const st = await sh.page.evaluate((ti) => {
    const s = window.__scene;
    const a = s.anchor, U = s.U, m = s.maxPull();
    const ts = s.things.filter((t) => t.block?.target && !t.down);
    const t = ts[Math.min(ti, ts.length - 1)];
    const tx = t ? t.img.x : s.structX, ty = t ? t.img.y : s.groundY - U;
    let best = null;
    for (let ang = 10; ang <= 70; ang += 2)
      for (let pf = 0.4; pf <= 1; pf += 0.04) {
        const dx = -Math.cos((ang * Math.PI) / 180) * m * pf, dy = Math.sin((ang * Math.PI) / 180) * m * pf;
        const py = Math.min(a.y + dy, s.groundY - U * 0.6);
        const ddx = -dx, ddy = a.y - py, len = Math.hypot(ddx, ddy), pull = len / m;
        const vmax = Math.sqrt(1.9 * (s.structX - a.x) * s.gPx);
        let x = a.x + dx, y = py, vx = (ddx / len) * vmax * pull, vy = (ddy / len) * vmax * pull, dmin = 1e9;
        for (let i = 0; i < 400; i++) {
          vy += s.gPx; vx *= 0.998; vy *= 0.998; x += vx; y += vy;
          dmin = Math.min(dmin, Math.hypot(x - tx, y - ty));
          if (y > s.groundY) break;
        }
        if (!best || dmin < best.d) best = { d: dmin, px: a.x + dx, py };
      }
    return { from: [s.proj.x, s.proj.y], to: [best.px, best.py], anchor: [a.x, a.y], structX: s.structX, U, w: s.scale.width, h: s.scale.height, gy: s.groundY };
  }, target);
  const z0 = 1.9;
  if (follow && !recordFromImpact) {
    // tensión: primer plano de la gomera mientras se jala
    sh.cam = () => ({ z: z0, x: st.anchor[0] + st.U, y: st.anchor[1], lerp: 1 });
  }
  if (!short) sh.last = [st.from[0] + 60, st.from[1] - 80];
  await sh.moveTo(st.from[0], st.from[1], short ? 8 : 10);
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const k = ease(i / 26);
    pts.push([st.from[0] + (st.to[0] - st.from[0]) * k, st.from[1] + (st.to[1] - st.from[1]) * k]);
  }
  await sh.page.mouse.down();
  for (const p of pts) {
    await sh.page.mouse.move(p[0], p[1]);
    await sh.frame();
  }
  await sh.wait(follow ? 500 : 300);
  await sh.page.mouse.up();
  let zf = z0;
  if (follow) {
    // seguimiento del proyectil, abriendo el plano de a poco
    sh.cam = () => {
      zf += (1.6 - zf) * 0.04;
      return { z: zf, follow: 'proj', lerp: 0.25 };
    };
  }
  let slowDone = false;
  for (let f = 0; f < 150; f++) {
    const px = await sh.page.evaluate(() => (window.__scene.proj ? window.__scene.proj.x : 0));
    if (!slowDone && px > st.structX - st.U * 2.6) {
      slowDone = true;
      if (recordFromImpact) sh.record();
      sh.speed = 0.3;
      for (let k = 0; k < 50; k++) await sh.frame();
      sh.speed = 1;
      if (follow) {
        sh.cam = () => {
          zf += (1.4 - zf) * 0.05;
          return { z: zf, x: st.structX - st.U * 0.5, y: st.gy - st.U * 2.5, lerp: 0.06 };
        };
      }
      for (let k = 0; k < (recordFromImpact ? 75 : 60); k++) await sh.frame();
      break;
    }
    await sh.frame();
  }
}

async function craftAim(sh, x, y, z, frames = 10) {
  const from = await sh.page.evaluate(() => [window.__craft.player.yaw, window.__craft.player.pitch]);
  const to = await sh.page.evaluate(([x, y, z]) => {
    const p = window.__craft.player;
    const dx = x + 0.5 - p.pos.x, dy = y + 0.5 - p.pos.y - 1.6, dz = z + 0.5 - p.pos.z;
    let yaw = Math.atan2(-dx, -dz);
    while (yaw - p.yaw > Math.PI) yaw -= 2 * Math.PI;
    while (yaw - p.yaw < -Math.PI) yaw += 2 * Math.PI;
    return [yaw, Math.atan2(dy, Math.hypot(dx, dz))];
  }, [x, y, z]);
  for (let i = 1; i <= frames; i++) {
    const k = ease(i / frames);
    await sh.page.evaluate(([a, b]) => {
      window.__craft.player.yaw = a;
      window.__craft.player.pitch = b;
    }, [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]);
    await sh.frame();
  }
}

async function craftFillGhosts(sh, n, aimFrames) {
  const ghosts = await sh.page.evaluate(() => window.__craft.ghosts);
  for (const g of ghosts.slice(0, n)) {
    if (g.req) await sh.page.evaluate((r) => window.__craft.setSel(window.__craft.hotbar.indexOf(r)), g.req);
    await craftAim(sh, g.x, g.y, g.z, aimFrames);
    await sh.page.mouse.move(VW / 2, VH / 2);
    await sh.page.mouse.down();
    await sh.frame();
    await sh.page.mouse.up();
    await sh.frame();
    await sh.frame();
  }
}

async function craftBuildCastle(sh) {
  await sh.page.evaluate(() => {
    const c = window.__craft;
    const W = c.world;
    // castillito de colores + letras "SOL" de bloques para el vuelo aéreo
    for (let x = 10; x <= 22; x++)
      for (let z = 9; z <= 13; z++)
        for (let y = 4; y <= 7; y++) {
          const edge = x === 10 || x === 22 || z === 9 || z === 13;
          if (!edge) continue;
          if (y === 7 && (x + z) % 2) continue;
          if (y <= 5 && z === 13 && x >= 15 && x <= 17) continue;
          W.set(x, y, z, y === 7 ? 18 : 9);
        }
    for (const [x, z] of [[10, 9], [22, 9], [10, 13], [22, 13]]) for (let y = 4; y <= 9; y++) W.set(x, y, z, y >= 8 ? [11, 13, 15, 16][(x + z) % 4] : 3);
    for (let x = 11; x <= 21; x++) for (let z = 10; z <= 12; z++) W.set(x, 3, z, 5);
    // camino de colores
    const cols = [11, 12, 13, 14, 15, 16, 17];
    for (let z = 14; z <= 27; z++) W.set(16, 3, z, cols[z % 7]);
    c.placeAt(16, 3, 14, 11);
  });
}

// ---------- ejecución ----------
const filter = process.argv.slice(2);
const names = Object.keys(SHOTS).filter((n) => !filter.length || filter.some((f) => n.includes(f)));
const browser = await launch();
const t00 = Date.now();
for (const name of names) {
  const t0 = Date.now();
  const sh = new Shot(browser, name);
  try {
    const stars = name.startsWith('plataforma') ? { snake: [3, 2, 3, 1], ninja: [3, 3], crash: [2, 3, 3], angry: [3], craft: [3, 3] } : null;
    await sh.open({ stars });
    const res = (await SHOTS[name](sh)) || {};
    const n = sh.finish(`${OUT}/${name}.mp4`, res);
    console.log('OK', name, n, 'cuadros', ((Date.now() - t0) / 1000).toFixed(0) + 's', sh.errs.length ? sh.errs.slice(0, 2) : '');
  } catch (e) {
    console.log('FAIL', name, e.message.split('\n')[0]);
  }
  await sh.close().catch(() => {});
}
await browser.close();
// índice
const files = readdirSync(OUT).filter((f) => f.endsWith('.mp4')).sort();
writeFileSync(`${OUT}/LISTA.md`, '# Planos 9:16 (1080x1920, 30 fps)\n\n' + files.map((f) => `- \`${f}\``).join('\n') + '\n');
console.log('total', ((Date.now() - t00) / 1000).toFixed(0) + 's');
