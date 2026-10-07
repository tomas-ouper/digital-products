// Angry Forms: catapulta de formas geométricas con física (Matter.js de Phaser).
import Phaser from 'phaser';
import type { GameContext, GameInstance } from '../types';
import { ANGRY_LEVELS, type AngryLevel, type ShapeKind, type Block } from './levels';
import { createGame, FONT } from '../phaserHost';
import { say } from '../../core/voice';
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
  hudText!: Phaser.GameObjects.Text;
  trayObjs: Phaser.GameObjects.GameObject[] = [];
  gPx = 0.28; // gravedad en px/paso²

  constructor() {
    super('angry');
  }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
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
    this.hudText = this.add.text(w - 16, HUD_TOP + 8, '', { fontFamily: FONT, fontSize: '22px', color: '#3a3f6b', fontStyle: 'bold', backgroundColor: '#ffffffd9', padding: { x: 12, y: 6 } }).setOrigin(1, 0).setDepth(10);
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

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => this.onUp());
    this.input.on('pointerupoutside', () => this.onUp());

    const instr = () => say(this.lv.say.key, this.lv.say.vars || {});
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
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0xbfe0ff, 0xbfe0ff, 0xeaf6ff, 0xeaf6ff, 1);
    g.fillRect(0, 0, w, h);
    // nubes
    g.fillStyle(0xffffff, 0.9);
    for (const [cx, cy, s] of [
      [0.2, 0.28, 1],
      [0.55, 0.2, 1.3],
      [0.85, 0.32, 0.9],
    ]) {
      const x = w * cx, y = h * cy, r = this.U * s;
      g.fillCircle(x, y, r);
      g.fillCircle(x + r, y + r * 0.2, r * 0.8);
      g.fillCircle(x - r, y + r * 0.25, r * 0.7);
    }
    // colinas
    g.fillStyle(0xa6dca0, 1);
    g.fillEllipse(w * 0.25, this.groundY + 10, w * 0.8, this.U * 5);
    g.fillStyle(0x93d08e, 1);
    g.fillEllipse(w * 0.8, this.groundY + 10, w * 0.7, this.U * 4);
    // piso
    g.fillStyle(0x7cc576, 1);
    g.fillRect(0, this.groundY, w, h - this.groundY);
    g.fillStyle(0x6bb565, 1);
    g.fillRect(0, this.groundY, w, 8);
    // catapulta (horqueta de madera)
    const a = this.anchor;
    const U = this.U;
    g.lineStyle(U * 0.38, 0x9a6a45, 1);
    g.lineBetween(a.x - U * 0.1, this.groundY, a.x - U * 0.1, a.y + U * 1.2);
    g.lineBetween(a.x - U * 0.1, a.y + U * 1.2, a.x - U * 0.7, a.y);
    g.lineBetween(a.x - U * 0.1, a.y + U * 1.2, a.x + U * 0.5, a.y);
    g.fillStyle(0x8a5a38, 1);
    g.fillCircle(a.x - U * 0.7, a.y, U * 0.22);
    g.fillCircle(a.x + U * 0.5, a.y, U * 0.22);
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
    fillShape(shade(col, 0.72), 0);
    fillShape(col, pad);
    // brillo
    g.fillStyle(0xffffff, 0.28);
    if (k === 'rectangulo') g.fillRoundedRect(pad + 4, pad + 2, W - pad * 2 - 8, H * 0.22, 4);
    else g.fillEllipse(W * 0.42, H * 0.34, W * 0.32, H * 0.14);
    // carita (ojitos)
    const ex = k === 'triangulo' ? W * 0.56 : W / 2;
    const ey = k === 'triangulo' ? H / 2 : H * 0.48;
    const er = Math.max(2, U * 0.07);
    const sep = k === 'rectangulo' ? Math.min(U * 0.22, W * 0.2) : U * 0.17;
    if (k === 'triangulo') {
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
    const label = this.add.text(12, yy - size / 2 - 8, 'Elige una forma:', { fontFamily: FONT, fontSize: '20px', color: '#3a3f6b', fontStyle: 'bold', backgroundColor: '#ffffffcc', padding: { x: 8, y: 3 } }).setOrigin(0, 1).setDepth(12);
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
  }

  onDown(p: Phaser.Input.Pointer) {
    if (!this.proj || this.flying || this.over || !this.proj.isStatic()) return;
    const d = Math.hypot(p.x - this.proj.x, p.y - this.proj.y);
    if (d < this.U * 2.2) {
      this.dragging = true;
      sfx.tap();
    }
  }

  maxPull() {
    return this.U * 3.2;
  }

  onMove(p: Phaser.Input.Pointer) {
    if (!this.dragging || !this.proj) return;
    const a = this.anchor;
    let dx = p.x - a.x;
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
      return;
    }
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

  updateHud() {
    this.hudText.setText(`Tiros: ${'●'.repeat(Math.max(0, this.shotsLeft))}${'○'.repeat(Math.max(0, this.shotsUsed))}`);
  }

  checkKnocks() {
    if (!this.settled) return;
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
        const m = this.add.text(t.img.x, t.img.y - U, '✓', { fontFamily: FONT, fontSize: `${Math.round(U * 1.1)}px`, color: '#2fa36b', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 6 }).setOrigin(0.5).setDepth(15);
        this.tweens.add({ targets: m, y: m.y - U, alpha: 0, delay: 500, duration: 700, onComplete: () => m.destroy() });
      } else if (this.lv.only) {
        this.wrongDown++;
      }
    }
  }

  targetsLeft() {
    return this.things.filter((t) => t.block?.target && !t.down).length;
  }

  update(_t: number, dt: number) {
    if (this.over) return;
    this.checkKnocks();
    // línea de puntería
    this.band.clear();
    if (this.proj && this.proj.isStatic()) {
      const a = this.anchor;
      const U = this.U;
      this.band.lineStyle(U * 0.18, 0x6b3f22, 1);
      this.band.lineBetween(a.x - U * 0.7, a.y, this.proj.x, this.proj.y);
      this.band.lineBetween(a.x + U * 0.5, a.y, this.proj.x, this.proj.y);
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
