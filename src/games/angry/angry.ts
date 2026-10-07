// Angry Forms: catapulta de formas geométricas con física (Matter.js de Phaser).
import Phaser from 'phaser';
import type { GameContext, GameInstance } from '../types';
import { ANGRY_LEVELS, type AngryLevel, type ShapeKind, type Block } from './levels';
import { createGame, FONT } from '../phaserHost';
import { say, sayText } from '../../core/voice';
import { sfx } from '../../core/sound';

const HUD_TOP = 84;

export const SHAPE_NAME: Record<ShapeKind, { n: string; f: boolean }> = {
  circulo: { n: 'círculo', f: false },
  cuadrado: { n: 'cuadrado', f: false },
  triangulo: { n: 'triángulo', f: false },
  rectangulo: { n: 'rectángulo', f: false },
  rombo: { n: 'rombo', f: false },
  estrella: { n: 'estrella', f: true },
};

const SHAPE_COLOR: Record<ShapeKind, number> = {
  circulo: 0xff7a59,
  cuadrado: 0x5b8def,
  triangulo: 0x3fbf7f,
  rectangulo: 0xf2b134,
  rombo: 0xa98bff,
  estrella: 0xff6fa5,
};

const TRI_R = 0.62; // radio del triángulo (polígono regular)

interface Thing {
  img: Phaser.Physics.Matter.Image;
  block: Block | null;
  x0: number;
  y0: number;
  a0: number;
  down: boolean;
  mark?: Phaser.GameObjects.Text;
}

function shade(color: number, f: number) {
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return (m(r) << 16) | (m(g) << 8) | m(b);
}

class AngryScene extends Phaser.Scene {
  ctx!: GameContext;
  lv!: AngryLevel;
  U = 40;
  groundY = 0;
  anchor = { x: 0, y: 0 };
  structX = 0;
  things: Thing[] = [];
  proj: Phaser.Physics.Matter.Image | null = null;
  projKind: ShapeKind | null = null;
  dragging = false;
  flying = false;
  flyTime = 0;
  shotsLeft = 0;
  shotsUsed = 0;
  wrongDown = 0;
  over = false;
  settled = false;
  aim!: Phaser.GameObjects.Graphics;
  band!: Phaser.GameObjects.Graphics;
  bandBack!: Phaser.GameObjects.Graphics;
  trailG!: Phaser.GameObjects.Graphics;
  trailPts: { x: number; y: number }[] = [];
  hudText!: Phaser.GameObjects.Text;
  objectiveText!: Phaser.GameObjects.Text;
  targetsG!: Phaser.GameObjects.Graphics;
  pullG!: Phaser.GameObjects.Graphics;
  hintText!: Phaser.GameObjects.Text;
  trayObjs: Phaser.GameObjects.GameObject[] = [];
  gPx = 0.28; // gravedad en px/paso²

  constructor() {
    super('angry');
  }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.flyTime = 0;
    this.trailPts = [];
    this.events.once('shutdown', () => { this.over = true; });
    this.lv = ANGRY_LEVELS[this.ctx.level] || ANGRY_LEVELS[0];
    this.things = [];
    this.proj = null;
    this.projKind = null;
    this.dragging = false;
    this.flying = false;
    this.shotsLeft = this.lv.shots + (this.ctx.easy ? 2 : 0);
    this.shotsUsed = 0;
    this.wrongDown = 0;
    this.over = false;
    this.settled = false;
    this.trayObjs = [];
  }

  create() {
    if (location.search.includes('debug')) (window as any).__scene = this;
    const w = this.scale.width;
    const h = this.scale.height;
    this.U = Phaser.Math.Clamp(Math.min(w / (w < h ? 12.5 : 19), (h - HUD_TOP) / 11), 24, 54);
    const U = this.U;
    this.groundY = h - Math.max(U * 1.3, 40);
    const gy = U / 40;
    this.matter.world.setGravity(0, gy);
    this.gPx = 0.001 * gy * 16.666 * 16.666;
    this.anchor = { x: Math.max(U * 3.2, w * 0.16), y: this.groundY - U * 3.4 };
    this.structX = w * 0.68;

    this.drawBackground();
    this.makeTextures();
    // piso
    this.matter.add.rectangle(w / 2, this.groundY + 200, w * 3, 400, { isStatic: true, friction: 0.9, label: 'ground' });
    // bloques
    for (const b of this.lv.blocks) this.addBlock(b);
    this.aim = this.add.graphics().setDepth(4);
    this.band = this.add.graphics().setDepth(6);
    this.bandBack = this.add.graphics().setDepth(3);
    this.trailG = this.add.graphics().setDepth(2);
    this.hudText = this.add.text(w - 16, HUD_TOP + 8, '', { fontFamily: FONT, fontSize: '22px', color: '#3a3f6b', fontStyle: 'bold', backgroundColor: '#ffffffd9', padding: { x: 12, y: 6 } }).setOrigin(1, 0).setDepth(10);
    this.targetsG = this.add.graphics().setDepth(9);
    this.pullG = this.add.graphics().setDepth(9);
    this.objectiveText = this.add.text(16, HUD_TOP + 8, '', { fontFamily: FONT, fontSize: h < 500 ? '17px' : '21px', color: '#26354b', backgroundColor: '#fff8df', padding: { x: 12, y: 8 }, wordWrap: { width: Math.min(390, w - 48) } }).setDepth(11);
    if (w < 600) this.hudText.setY(HUD_TOP + 100).setFontSize(18);
    this.hintText = this.add.text(w / 2, h - 12, '', { fontFamily: FONT, fontSize: h < 500 ? '16px' : '20px', color: '#ffffff', backgroundColor: '#283e4dee', padding: { x: 12, y: 6 }, align: 'center', wordWrap: { width: w - 48 } }).setOrigin(0.5, 1).setDepth(15);
    if (w < 600) this.hintText.setPosition(w / 2, HUD_TOP + 152).setOrigin(0.5, 0);
    this.updateHud();

    // dejar que la estructura se asiente antes de medir
    this.time.delayedCall(700, () => {
      for (const t of this.things) {
        t.x0 = t.img.x;
        t.y0 = t.img.y;
        t.a0 = t.img.angle;
      }
      this.settled = true;
    });

    // polvo y temblor en los choques fuertes
    let lastPuff = 0;
    this.matter.world.on('collisionstart', (ev: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      if (!this.settled || this.shotsUsed === 0) return;
      for (const pair of ev.pairs) {
        const va = pair.bodyA.velocity, vb = pair.bodyB.velocity;
        const rel = Math.hypot(va.x - vb.x, va.y - vb.y);
        if (rel < 3 || this.time.now - lastPuff < 70) continue;
        lastPuff = this.time.now;
        const sp = pair.collision.supports?.[0] || pair.bodyA.position;
        this.puff(sp.x, sp.y, Math.min(1.6, rel / 6));
        if (rel > 6) {
          sfx.thud();
          this.cameras.main.shake(120, Math.min(0.012, rel * 0.0012));
        }
      }
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => this.onUp());
    this.input.on('pointerupoutside', () => this.onUp());

    const instr = () => sayText(`${this.objective()} Elige ${SHAPE_NAME[this.lv.launch].n}, arrastra hacia atrás y suelta.`);
    this.ctx.setTitle(this.lv.title);
    this.ctx.setRepeat(instr);
    if (this.lv.tray.length === 1) {
      this.loadProjectile(this.lv.launch);
      if (this.ctx.level === 0) say('angry_intro').then(() => {
        if (!this.over) instr();
      });
      else instr();
    } else {
      this.drawTray();
      instr();
    }
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
  }

  onResize() {
    // reiniciar el nivel con la nueva geometría (rotar la tablet)
    if (!this.over) this.scene.restart({ ctx: this.ctx });
  }

  drawBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    const U = this.U;
    const gy = this.groundY;
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x6fb6f5, 0x6fb6f5, 0xd9f0ff, 0xd9f0ff, 1);
    g.fillRect(0, 0, w, gy);
    // sol con rayos
    const sx = w * 0.12, sy = h * 0.18, sr = U * 1.4;
    for (let i = 10; i > 0; i--) {
      g.fillStyle(0xfff3b0, 0.02 * (11 - i) / 3);
      g.fillCircle(sx, sy, sr * (1 + i * 0.22));
    }
    g.fillStyle(0xffe066, 1);
    g.fillCircle(sx, sy, sr);
    g.fillStyle(0xfff3a8, 1);
    g.fillCircle(sx - sr * 0.15, sy - sr * 0.15, sr * 0.7);
    // nubes esponjosas con sombra
    const cloud = (x: number, y: number, r: number) => {
      g.fillStyle(0xbfd9ef, 1);
      for (const [dx, dy, k] of [[0, 0.15, 1], [1, 0.3, 0.8], [-1, 0.35, 0.7], [0.5, -0.35, 0.75]]) g.fillCircle(x + dx * r, y + dy * r + r * 0.12, r * k);
      g.fillStyle(0xffffff, 1);
      for (const [dx, dy, k] of [[0, 0.15, 1], [1, 0.3, 0.8], [-1, 0.35, 0.7], [0.5, -0.35, 0.75]]) g.fillCircle(x + dx * r, y + dy * r, r * k);
    };
    cloud(w * 0.45, h * 0.16, U * 1.2);
    cloud(w * 0.78, h * 0.26, U * 0.9);
    cloud(w * 0.95, h * 0.1, U * 0.7);
    // montañas lejanas
    const ridge = (base: number, amp: number, col: number, seed: number, step: number) => {
      const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, gy)];
      for (let x = 0; x <= w + step; x += step) pts.push(new Phaser.Math.Vector2(x, base - Math.abs(Math.sin(x * 0.004 + seed)) * amp - Math.sin(x * 0.013 + seed) * amp * 0.2));
      pts.push(new Phaser.Math.Vector2(w, gy));
      g.fillStyle(col, 1);
      g.fillPoints(pts, true);
    };
    ridge(gy - U * 2.5, U * 3.2, 0xa9c8ea, 1.3, 30);
    ridge(gy - U * 1.2, U * 2, 0x9bd38f, 4.1, 30);
    // árboles en la colina
    let sd = 3;
    const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 7; i++) {
      const x = w * (0.28 + rnd() * 0.7), y = gy - U * (0.3 + rnd() * 0.6), r = U * (0.45 + rnd() * 0.35);
      g.fillStyle(0x8a6142, 1);
      g.fillRect(x - r * 0.12, y - r * 0.2, r * 0.24, r * 1.1);
      g.fillStyle(0x4f9e48, 1);
      g.fillCircle(x, y - r * 0.6, r);
      g.fillStyle(0x66b85c, 1);
      g.fillCircle(x - r * 0.25, y - r * 0.8, r * 0.6);
    }
    // piso: pasto + tierra con piedritas
    g.fillStyle(0x8a5b3b, 1);
    g.fillRect(0, gy, w, h - gy);
    g.fillStyle(0x7a4e32, 1);
    for (let i = 0; i < 40; i++) g.fillCircle(rnd() * w, gy + U * 0.5 + rnd() * (h - gy), 2 + rnd() * 4);
    g.fillStyle(0x5fb84a, 1);
    g.fillRect(0, gy - 2, w, U * 0.38);
    g.fillStyle(0x7fd062, 1);
    g.fillRect(0, gy - 2, w, U * 0.12);
    g.fillStyle(0x4f9e3c, 1);
    for (let x = 0; x < w; x += U * 0.35) g.fillTriangle(x, gy + U * 0.36, x + U * 0.18, gy + U * 0.36, x + U * 0.09, gy + U * 0.55);
    // resortera (atrás)
    const a = this.anchor;
    const wood = (x1: number, y1: number, x2: number, y2: number, wd: number) => {
      g.lineStyle(wd + 4, 0x4d2f1a, 1);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(wd, 0x9a6a45, 1);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(wd * 0.3, 0xc08a5c, 1);
      g.lineBetween(x1 - wd * 0.15, y1, x2 - wd * 0.15, y2);
    };
    wood(a.x - U * 0.1, gy + 4, a.x - U * 0.1, a.y + U * 1.2, U * 0.42);
    wood(a.x - U * 0.1, a.y + U * 1.25, a.x - U * 0.7, a.y, U * 0.34);
    wood(a.x - U * 0.1, a.y + U * 1.25, a.x + U * 0.5, a.y, U * 0.34);
    g.fillStyle(0x4d2f1a, 1);
    g.fillCircle(a.x - U * 0.7, a.y, U * 0.24);
    g.fillCircle(a.x + U * 0.5, a.y, U * 0.24);
    g.fillStyle(0x7a5236, 1);
    g.fillCircle(a.x - U * 0.7, a.y, U * 0.17);
    g.fillCircle(a.x + U * 0.5, a.y, U * 0.17);
  }

  /** Texturas de cada forma con carita */
  makeTextures() {
    const U = this.U;
    const kinds: ShapeKind[] = ['circulo', 'cuadrado', 'triangulo', 'rombo', 'estrella'];
    for (const k of kinds) this.shapeTexture(k, 0);
    for (const b of this.lv.blocks) if (b.k === 'rectangulo') this.shapeTexture('rectangulo', b.s ?? 2);
    this.shapeTexture('rectangulo', 2);
    void U;
  }

  texKey(k: ShapeKind, s: number) {
    return `af-${k}-${s}-${Math.round(this.U)}`;
  }

  shapeTexture(k: ShapeKind, s: number) {
    const key = this.texKey(k, s);
    if (this.textures.exists(key)) return key;
    const U = this.U;
    const col = SHAPE_COLOR[k];
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    let W = U, H = U;
    const pad = 3;
    const fillShape = (c: number, inset: number) => {
      g.fillStyle(c, 1);
      if (k === 'circulo') g.fillCircle(W / 2, H / 2, U / 2 - inset);
      else if (k === 'cuadrado') g.fillRoundedRect(inset, inset, W - inset * 2, H - inset * 2, U * 0.12);
      else if (k === 'rectangulo') g.fillRoundedRect(inset, inset, W - inset * 2, H - inset * 2, U * 0.1);
      else if (k === 'triangulo') {
        // apunta a la izquierda: el cuerpo se rota 90° para que apunte arriba
        const r = TRI_R * U - inset;
        const cx = W / 2, cy = H / 2;
        const pts = [60, 180, 300].map((d) => new Phaser.Math.Vector2(cx + Math.cos((d * Math.PI) / 180) * r, cy + Math.sin((d * Math.PI) / 180) * r));
        g.fillPoints(pts, true);
      } else if (k === 'rombo') {
        const hw = W / 2 - inset, hh = H / 2 - inset * 1.3;
        g.fillPoints([new Phaser.Math.Vector2(W / 2, H / 2 - hh), new Phaser.Math.Vector2(W / 2 + hw, H / 2), new Phaser.Math.Vector2(W / 2, H / 2 + hh), new Phaser.Math.Vector2(W / 2 - hw, H / 2)], true);
      } else if (k === 'estrella') {
        const pts: Phaser.Math.Vector2[] = [];
        const R = W / 2 - inset;
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rr = i % 2 ? R * 0.48 : R;
          pts.push(new Phaser.Math.Vector2(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr));
        }
        g.fillPoints(pts, true);
      }
    };
    if (k === 'rectangulo') {
      W = s * U;
      H = U * 0.5;
    } else if (k === 'triangulo') {
      W = H = TRI_R * 2 * U;
    } else if (k === 'rombo') {
      W = U * 1.0;
      H = U * 1.3;
    } else if (k === 'estrella') {
      W = H = U * 1.25;
    }
    fillShape(shade(col, 0.62), 0);
    fillShape(shade(col, 1.35), pad);
    const bev = Math.max(2, U * 0.07);
    g.translateCanvas(0, bev);
    fillShape(col, pad + bev * 0.6);
    g.translateCanvas(0, -bev);
    if (k === 'rectangulo') {
      // vetas de madera
      g.lineStyle(Math.max(1, U * 0.03), shade(col, 0.82), 0.8);
      for (let i = 1; i < 3; i++) g.lineBetween(pad + U * 0.2, (H * i) / 3 + bev * 0.5, W - pad - U * (0.3 + i * 0.4), (H * i) / 3 + bev * 0.5);
    }
    // brillo
    g.fillStyle(0xffffff, 0.28);
    if (k === 'rectangulo') g.fillRoundedRect(pad + 4, pad + 2, W - pad * 2 - 8, H * 0.22, 4);
    else g.fillEllipse(W * 0.42, H * 0.34, W * 0.32, H * 0.14);
    // carita (ojitos)
    const ex = k === 'triangulo' ? W * 0.56 : W / 2;
    const ey = k === 'triangulo' ? H / 2 : H * 0.48;
    const er = Math.max(2, U * 0.07);
    const sep = k === 'rectangulo' ? Math.min(U * 0.22, W * 0.2) : U * 0.17;
    if (k === 'rectangulo') {
      // las tablas no llevan carita
    } else if (k === 'triangulo') {
      // el triángulo se dibuja acostado: ojos en vertical para que queden horizontales al rotar
      for (const d of [-1, 1]) {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(ex, ey + d * sep, er * 1.6);
        g.fillStyle(0x3a3f6b, 1);
        g.fillCircle(ex - er * 0.3, ey + d * sep, er);
      }
    } else {
      for (const d of [-1, 1]) {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(ex + d * sep, ey, er * 1.6);
        g.fillStyle(0x3a3f6b, 1);
        g.fillCircle(ex + d * sep, ey + er * 0.3, er);
      }
    }
    g.generateTexture(key, Math.ceil(W), Math.ceil(H));
    g.destroy();
    return key;
  }

  bodyFor(k: ShapeKind, s: number): Phaser.Types.Physics.Matter.MatterBodyConfig {
    const U = this.U;
    const common = { friction: 0.6, frictionStatic: 0.9, restitution: 0.1, density: 0.002 };
    if (k === 'circulo') return { ...common, shape: { type: 'circle', radius: U / 2 - 1 } } as any;
    if (k === 'estrella') return { ...common, shape: { type: 'circle', radius: U * 0.55 } } as any;
    if (k === 'triangulo') return { ...common, shape: { type: 'polygon', sides: 3, radius: TRI_R * U } } as any;
    if (k === 'rombo') {
      const hw = U * 0.5, hh = U * 0.65;
      return { ...common, shape: { type: 'fromVerts', verts: [{ x: 0, y: -hh }, { x: hw, y: 0 }, { x: 0, y: hh }, { x: -hw, y: 0 }] } } as any;
    }
    if (k === 'rectangulo') return { ...common, shape: { type: 'rectangle', width: s * U, height: U * 0.5 } } as any;
    return { ...common, shape: { type: 'rectangle', width: U, height: U } } as any;
  }

  /** distancia del centro del cuerpo a su base (en unidades) */
  halfBelow(b: Block) {
    switch (b.k) {
      case 'triangulo':
        return TRI_R / 2;
      case 'rectangulo':
        return b.angle === 90 ? (b.s ?? 2) / 2 : 0.25;
      case 'rombo':
        return 0.65;
      case 'estrella':
        return 0.55;
      default:
        return 0.5;
    }
  }

  addBlock(b: Block) {
    const U = this.U;
    const s = b.s ?? 2;
    const x = this.structX + b.x * U;
    const y = this.groundY - (b.y + this.halfBelow(b)) * U;
    const img = this.matter.add.image(x, y, this.texKey(b.k, b.k === 'rectangulo' ? s : 0), undefined, this.bodyFor(b.k, s));
    if (b.k === 'triangulo') img.setAngle(90);
    if (b.k === 'rectangulo' && b.angle) img.setAngle(b.angle);
    this.things.push({ img, block: b, x0: x, y0: y, a0: img.angle, down: false });
  }

  drawTray() {
    this.trayObjs.forEach((o) => o.destroy());
    this.trayObjs = [];
    const U = this.U;
    const size = Math.max(64, U * 1.6);
    const gap = 10;
    const y = this.groundY + (this.scale.height - this.groundY) / 2 - 4;
    const x0 = 12 + size / 2;
    const yy = Math.min(y, this.scale.height - size / 2 - 6);
    const label = this.add.text(12, yy - size / 2 - 8, `Elige ${SHAPE_NAME[this.lv.launch].n}:`, { fontFamily: FONT, fontSize: '20px', color: '#3a3f6b', fontStyle: 'bold', backgroundColor: '#ffffffcc', padding: { x: 8, y: 3 } }).setOrigin(0, 1).setDepth(12);
    this.trayObjs.push(label);
    this.lv.tray.forEach((k, i) => {
      const x = x0 + i * (size + gap);
      const bg = this.add.graphics().setDepth(12);
      bg.fillStyle(0x000000, 0.12);
      bg.fillRoundedRect(x - size / 2, yy - size / 2 + 4, size, size, 18);
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(x - size / 2, yy - size / 2, size, size, 18);
      const icon = this.add.image(x, yy, this.texKey(k, k === 'rectangulo' ? 2 : 0)).setDepth(13);
      if (k === 'triangulo') icon.setAngle(90);
      const sc = Math.min((size * 0.7) / Math.max(icon.width, icon.height), 1.4);
      icon.setScale(sc);
      const zone = this.add.zone(x, yy, size, size).setInteractive({ useHandCursor: true }).setDepth(14);
      zone.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        this.pickShape(k, icon);
      });
      this.trayObjs.push(bg, icon, zone);
    });
  }

  pickShape(k: ShapeKind, icon: Phaser.GameObjects.Image) {
    if (this.flying || this.over) return;
    if (k !== this.lv.launch) {
      sfx.bad();
      this.tweens.add({ targets: icon, angle: icon.angle + 12, yoyo: true, repeat: 2, duration: 70 });
      const nm = SHAPE_NAME[k];
      say(nm.f ? 'angry_esa_no_f' : 'angry_esa_no', { forma: nm.n });
      return;
    }
    sfx.good();
    this.loadProjectile(k);
    this.trayObjs.forEach((o) => o.destroy());
    this.trayObjs = [];
    this.updateHud();
  }

  loadProjectile(k: ShapeKind) {
    if (this.proj) this.proj.destroy();
    const a = this.anchor;
    const img = this.matter.add.image(a.x, a.y, this.texKey(k, k === 'rectangulo' ? 2 : 0), undefined, { ...this.bodyFor(k, 2), density: 0.01, frictionAir: 0.002 } as any);
    if (k === 'triangulo') img.setAngle(90);
    img.setStatic(true);
    img.setDepth(5);
    this.proj = img;
    this.projKind = k;
    img.setScale(0.3);
    this.tweens.add({ targets: img, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.updateHud();
  }

  onDown(p: Phaser.Input.Pointer) {
    if (!this.settled || !this.proj || this.flying || this.over || !this.proj.isStatic()) return;
    const d = Math.hypot(p.x - this.proj.x, p.y - this.proj.y);
    if (d < this.U * 2.2) {
      this.dragging = true;
      this.hintText.setText('Apunta con los puntos blancos y suelta para lanzar');
      sfx.tap();
    }
  }

  maxPull() {
    return this.U * 3.2;
  }

  onMove(p: Phaser.Input.Pointer) {
    if (!this.dragging || !this.proj) return;
    const a = this.anchor;
    let dx = Math.min(0, p.x - a.x);
    let dy = p.y - a.y;
    const d = Math.hypot(dx, dy);
    const m = this.maxPull();
    if (d > m) {
      dx = (dx / d) * m;
      dy = (dy / d) * m;
    }
    // no jalar por debajo del piso
    const y = Math.min(a.y + dy, this.groundY - this.U * 0.6);
    this.proj.setPosition(a.x + dx, y);
  }

  launchVelocity() {
    const a = this.anchor;
    const p = this.proj!;
    const dx = a.x - p.x;
    const dy = a.y - p.y;
    const pull = Math.hypot(dx, dy) / this.maxPull();
    const dist = this.structX - a.x;
    const vmax = Math.sqrt(1.9 * dist * this.gPx);
    const len = Math.hypot(dx, dy) || 1;
    return { vx: (dx / len) * vmax * pull, vy: (dy / len) * vmax * pull, pull };
  }

  onUp() {
    if (!this.dragging || !this.proj) return;
    this.dragging = false;
    const { vx, vy, pull } = this.launchVelocity();
    if (pull < 0.15) {
      // muy poquito: vuelve a su lugar
      this.proj.setPosition(this.anchor.x, this.anchor.y);
      this.hintText.setText('Arrastra más hacia atrás y suelta');
      this.aim.clear();
      return;
    }
    if (this.shotsUsed === 0) {
      for (const t of this.things) { t.x0 = t.img.x; t.y0 = t.img.y; t.a0 = t.img.angle; }
    }
    this.trailG.clear();
    this.trailPts = [];
    this.proj.setStatic(false);
    this.proj.setVelocity(vx, vy);
    this.proj.setAngularVelocity(0.05);
    this.flying = true;
    this.flyTime = 0;
    this.shotsLeft--;
    this.shotsUsed++;
    this.updateHud();
    sfx.whoosh();
    this.aim.clear();
  }

  objective() {
    if (this.lv.only) return `${this.lv.title}. Evita las formas sin aro.`;
    return 'Derriba las formas con aro dorado';
  }

  updateHud() {
    const total = this.lv.blocks.filter(b => b.target).length;
    const left = this.targetsLeft();
    this.hudText.setText(`Tiros: ${this.shotsLeft}  ·  Objetivos: ${total - left}/${total}`);
    this.objectiveText?.setText(`${this.objective()}\n${left} por derribar`);
    this.hintText?.setVisible(!!this.proj || this.lv.tray.length === 1);
    this.hintText?.setText(this.flying ? '¡Mira cuáles derribas!' : !this.proj && this.lv.tray.length > 1 ? `Elige ${SHAPE_NAME[this.lv.launch].n} abajo` : 'Arrastra la forma hacia atrás ↙ y suelta');
  }

  puff(x: number, y: number, k: number) {
    for (let i = 0; i < 6; i++) {
      const c = this.add.circle(x, y, this.U * (0.15 + Math.random() * 0.2) * k, 0xf3eadb, 0.9).setDepth(8);
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({ targets: c, x: x + Math.cos(a) * this.U * 0.9 * k, y: y + Math.sin(a) * this.U * 0.6 * k - this.U * 0.3, scale: 2, alpha: 0, duration: 500 + Math.random() * 300, onComplete: () => c.destroy() });
    }
  }

  checkKnocks() {
    if (!this.settled || this.shotsUsed === 0) return;
    const U = this.U;
    const w = this.scale.width;
    for (const t of this.things) {
      if (t.down || !t.img.active) continue;
      const moved = Math.hypot(t.img.x - t.x0, t.img.y - t.y0) > U * 0.7;
      const rot = Math.abs(Phaser.Math.Angle.ShortestBetween(t.img.angle, t.a0)) > 35;
      const out = t.img.x > w + U * 2 || t.img.x < -U * 2 || t.img.y > this.scale.height + U;
      if (!(moved || rot || out)) continue;
      t.down = true;
      if (t.block?.target) {
        sfx.pop();
        for (let i = 0; i < 8; i++) {
          const st = this.add.star(t.img.x, t.img.y, 5, U * 0.08, U * 0.2, 0xffd166).setDepth(14);
          const a = (i / 8) * Math.PI * 2;
          this.tweens.add({ targets: st, x: t.img.x + Math.cos(a) * U * 1.3, y: t.img.y + Math.sin(a) * U * 1.3, angle: 180, alpha: 0, duration: 600, onComplete: () => st.destroy() });
        }
        const m = this.add.text(t.img.x, t.img.y - U, '✓', { fontFamily: FONT, fontSize: `${Math.round(U * 1.1)}px`, color: '#2fa36b', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: m, y: m.y - U, alpha: 0, delay: 500, duration: 700, onComplete: () => m.destroy() });
      } else if (this.lv.only && t.block?.k !== 'rectangulo') {
        this.wrongDown++;
        const m = this.add.text(t.img.x, t.img.y - U, '¡Cuida esta!', { fontFamily: FONT, fontSize: '18px', color: '#9f2843', backgroundColor: '#ffffff' }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: m, y: m.y - U, alpha: 0, duration: 1500, onComplete: () => m.destroy() });
      }
      this.updateHud();
    }
  }

  targetsLeft() {
    return this.things.filter((t) => t.block?.target && !t.down).length;
  }

  drawTargets() {
    const g = this.targetsG;
    g.clear();
    for (const t of this.things) {
      if (!t.img.active || t.down || !t.block?.target) continue;
      const r = Math.max(t.img.displayWidth, t.img.displayHeight) * 0.62 + 5;
      g.lineStyle(7, 0xffffff, 0.85);
      g.strokeCircle(t.img.x, t.img.y, r);
      g.lineStyle(4, 0xffbd24, 1);
      g.strokeCircle(t.img.x, t.img.y, r);
      // flecha de objetivo, además del color
      g.fillStyle(0xffbd24, 1);
      const y = t.img.y - r - 7 - Math.sin(this.time.now / 400) * 3;
      g.fillTriangle(t.img.x - 6, y - 8, t.img.x + 6, y - 8, t.img.x, y);
    }
    const p = this.pullG;
    p.clear();
    if (this.proj && !this.flying && !this.dragging && this.shotsUsed === 0) {
      const a = this.anchor;
      const dx = this.U * 1.7, dy = this.U;
      p.lineStyle(4, 0xffffff, 0.9);
      p.lineBetween(a.x, a.y, a.x - dx, a.y + dy);
      p.fillStyle(0xffffff, 0.9);
      p.fillTriangle(a.x - dx, a.y + dy, a.x - dx + 16, a.y + dy - 3, a.x - dx + 5, a.y + dy - 16);
    }
  }

  update(_t: number, dt: number) {
    if (this.over) return;
    this.checkKnocks();
    this.drawTargets();
    // línea de puntería
    this.band.clear();
    if (!(this.proj && this.proj.isStatic())) this.bandBack.clear();
    if (this.proj && this.proj.isStatic()) {
      const a = this.anchor;
      const U = this.U;
      this.bandBack.clear();
      this.bandBack.lineStyle(U * 0.2, 0x5a2d16, 1);
      this.bandBack.lineBetween(a.x + U * 0.5, a.y, this.proj.x + U * 0.3, this.proj.y);
      this.band.lineStyle(U * 0.22, 0x7a3b1d, 1);
      this.band.lineBetween(a.x - U * 0.7, a.y, this.proj.x - U * 0.3, this.proj.y);
      this.band.fillStyle(0x5a2d16, 1);
      this.band.fillRoundedRect(this.proj.x - U * 0.42, this.proj.y - U * 0.2, U * 0.24, U * 0.4, 4);
    }
    if (this.dragging && this.proj) {
      const { vx, vy } = this.launchVelocity();
      this.aim.clear();
      this.aim.fillStyle(0xffffff, 0.95);
      let x = this.proj.x, y = this.proj.y, vX = vx, vY = vy;
      const steps = this.ctx.easy ? 70 : 34;
      for (let i = 0; i < steps; i++) {
        for (let k = 0; k < 3; k++) {
          vY += this.gPx;
          vX *= 0.998;
          vY *= 0.998;
          x += vX;
          y += vY;
        }
        if (y > this.groundY) break;
        this.aim.fillCircle(x, y, Math.max(2.5, this.U * 0.09) * (1 - i / (steps * 1.3)));
      }
    }
    if (this.flying && this.proj) {
      const lp = this.trailPts[this.trailPts.length - 1];
      if (!lp || Math.hypot(lp.x - this.proj.x, lp.y - this.proj.y) > this.U * 0.6) {
        this.trailPts.push({ x: this.proj.x, y: this.proj.y });
        this.trailG.fillStyle(0xffffff, 0.85);
        this.trailG.fillCircle(this.proj.x, this.proj.y, this.U * (this.trailPts.length % 3 === 0 ? 0.14 : 0.08));
      }
      this.flyTime += dt;
      const sp = this.proj.body ? Math.hypot((this.proj.body as MatterJS.BodyType).velocity.x, (this.proj.body as MatterJS.BodyType).velocity.y) : 0;
      const off = this.proj.x > this.scale.width + this.U * 2 || this.proj.x < -this.U * 3 || this.proj.y > this.scale.height + this.U * 2;
      if ((this.flyTime > 1200 && sp < 0.25) || off || this.flyTime > 6000) {
        this.flying = false;
        this.time.delayedCall(900, () => this.afterShot());
      }
    }
  }

  afterShot() {
    if (this.over) return;
    this.checkKnocks();
    if (this.targetsLeft() === 0) return this.win();
    if (this.shotsLeft <= 0) return this.lose();
    // el proyectil gastado se queda en la escena como un bloque más (no cuenta)
    const kind = this.projKind!;
    this.proj = null;
    this.loadProjectile(kind);
  }

  win() {
    this.over = true;
    sfx.win();
    const total = this.lv.shots + (this.ctx.easy ? 2 : 0);
    let stars = this.shotsUsed <= Math.ceil(total / 2) ? 3 : this.shotsUsed < total ? 2 : 1;
    if (this.wrongDown > 0) stars = Math.max(1, stars - 1);
    this.time.delayedCall(600, () => this.ctx.complete(stars));
  }

  lose() {
    this.over = true;
    sfx.bad();
    say('intenta_otra_vez');
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x282c50, 0.5).setDepth(40).setInteractive();
    const box = this.add.graphics().setDepth(41);
    box.fillStyle(0xffffff, 1);
    box.fillRoundedRect(w / 2 - 170, h / 2 - 100, 340, 200, 26);
    this.add.text(w / 2, h / 2 - 45, '¡Casi!\nSe acabaron los tiros', { fontFamily: FONT, fontSize: '26px', color: '#3a3f6b', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setDepth(42);
    const btn = this.add.graphics().setDepth(42);
    btn.fillStyle(0x4cc38a, 1);
    btn.fillRoundedRect(w / 2 - 130, h / 2 + 15, 260, 66, 33);
    this.add.text(w / 2, h / 2 + 48, 'Intentar otra vez', { fontFamily: FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(43);
    const zone = this.add.zone(w / 2, h / 2 + 48, 260, 66).setInteractive({ useHandCursor: true }).setDepth(44);
    zone.on('pointerup', () => {
      sfx.tap();
      void bg;
      this.scene.restart({ ctx: this.ctx });
    });
  }
}

export function start(ctx: GameContext): GameInstance {
  const game = createGame(ctx.host, 'angry', new AngryScene(), { ctx }, {
    backgroundColor: '#bfe0ff',
    physics: { default: 'matter', matter: { gravity: { x: 0, y: 1 }, debug: false } },
  });
  return {
    destroy() {
      game.destroy(true);
    },
  };
}
