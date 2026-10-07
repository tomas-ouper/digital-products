// Snake Lecto: la viborita recorre el trazo de la letra, en orden y dirección, comiendo puntos.
import Phaser from 'phaser';
import type { GameContext, GameInstance } from '../types';
import { LETTERS, glyph, isCursive, resample, type Pt, type Stroke } from '../../core/letters';
import { SNAKE_LEVELS } from './levels';
import { createGame, fontsReady, FONT, CURSIVE } from '../phaserHost';
import { say, letterName } from '../../core/voice';
import { sfx } from '../../core/sound';

const HUD_TOP = 84;

class SnakeScene extends Phaser.Scene {
  ctx!: GameContext;
  key = 'a';
  strokes: Stroke[] = [];
  dots: Pt[][] = [];
  si = 0; // trazo actual
  di = 0; // próximo punto
  fails = 0;
  // geometría
  f = 1;
  ox = 0;
  oy = 0;
  bg!: Phaser.GameObjects.Graphics;
  road!: Phaser.GameObjects.Graphics;
  g!: Phaser.GameObjects.Graphics;
  fx!: Phaser.GameObjects.Graphics;
  bar!: Phaser.GameObjects.Graphics;
  sparks: { x: number; y: number; vx: number; vy: number; life: number; c: number }[] = [];
  eatenTotal = 0;
  compact = false;
  totalDots = 0;
  model!: Phaser.GameObjects.Text;
  hint!: Phaser.GameObjects.Text;
  // víbora (en unidades de letra)
  head: Pt = { x: 0, y: 0 };
  heading = 0;
  trail: Pt[] = [];
  bodyLen = 14;
  target: Pt | null = null;
  keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  state: 'intro' | 'play' | 'dead' | 'won' = 'intro';
  tol = 10;
  speed = 55;
  t = 0;
  tapDot = false;

  constructor() {
    super('snake');
  }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.key = SNAKE_LEVELS[this.ctx.level] || 'a';
    this.strokes = LETTERS[this.key];
    this.dots = this.strokes.map((s) => (s.length === 1 ? s.slice() : resample(s, 7)));
    this.totalDots = this.dots.reduce((a, s) => a + s.length, 0);
    this.sparks = [];
    this.tol = this.ctx.easy ? 13 : 9.5;
    this.speed = this.ctx.easy ? 42 : 58;
  }

  create() {
    if (location.search.includes('debug')) (window as any).__scene = this;
    this.bg = this.add.graphics();
    this.road = this.add.graphics();
    this.g = this.add.graphics();
    this.fx = this.add.graphics().setDepth(5);
    this.bar = this.add.graphics().setDepth(6);
    const cur = isCursive(this.key);
    this.model = this.add
      .text(0, 0, glyph(this.key), { fontFamily: cur ? CURSIVE : FONT, fontSize: '64px', color: '#2f8f5b', fontStyle: cur ? 'normal' : 'bold' })
      .setOrigin(0.5);
    this.hint = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '22px', color: '#3a3f6b', backgroundColor: '#ffffffcc', padding: { x: 12, y: 6 } }).setOrigin(0.5, 1);
    this.layout();
    this.scale.on('resize', () => this.layout());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p, true));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => p.isDown && this.onPointer(p, false));
    // al soltar, la víbora termina de llegar a donde estaba el dedo
    this.keys = this.input.keyboard!.createCursorKeys();

    this.ctx.setTitle(cur ? `${glyph(this.key)} cursiva` : `Letra ${glyph(this.key)}`);
    const intro = () => say('snake_intro', { letra: letterName(glyph(this.key)) });
    this.ctx.setRepeat(intro);
    this.resetLetter(false);
    intro();
    this.time.delayedCall(400, () => (this.state = 'play'));
  }

  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    // celular acostado: la letra usa toda la altura, entre los botones de las esquinas
    this.compact = h < 600 && w > h * 1.3;
    const top = this.compact ? 8 : HUD_TOP;
    const availH = h - top - (this.compact ? 8 : 24);
    const size = Math.min(w * 0.9, availH * 0.97, 760);
    this.f = size / 100;
    this.ox = (w - size) / 2;
    this.oy = top + (availH - size) / 2;
    const small = Math.min(w, h) < 520;
    this.model.setFontSize(small ? 44 : 64).setPosition(small ? 44 : 66, h - (small ? 44 : 66));
    this.drawBg();
    this.hint.setPosition(w / 2, h - 12).setFontSize(small ? 17 : 22);
    this.drawRoad();
  }

  sx(p: Pt) {
    return this.ox + p.x * this.f;
  }
  sy(p: Pt) {
    return this.oy + p.y * this.f;
  }

  drawBg() {
    const g = this.bg;
    const w = this.scale.width;
    const h = this.scale.height;
    g.clear();
    // pasto en damero
    const t = Math.max(36, Math.round(this.f * 9));
    for (let y = 0; y < h; y += t)
      for (let x = 0; x < w; x += t) {
        g.fillStyle(((x / t) | 0) % 2 === ((y / t) | 0) % 2 ? 0x8fd679 : 0x84cd6e, 1);
        g.fillRect(x, y, t, t);
      }
    // flores y matitas (posiciones fijas)
    let sd = 11;
    const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * w;
      const y = HUD_TOP + rnd() * (h - HUD_TOP);
      if (x > this.ox - 10 && x < this.ox + 100 * this.f + 10 && y > this.oy - 10 && y < this.oy + 100 * this.f + 10) continue;
      if (rnd() < 0.5) {
        const c = [0xffffff, 0xffd166, 0xff8fb1, 0xa98bff][(rnd() * 4) | 0];
        const r = 5 + rnd() * 4;
        g.fillStyle(c, 1);
        for (let k = 0; k < 5; k++) g.fillCircle(x + Math.cos((k * 2 * Math.PI) / 5) * r, y + Math.sin((k * 2 * Math.PI) / 5) * r, r * 0.75);
        g.fillStyle(0xffb703, 1);
        g.fillCircle(x, y, r * 0.6);
      } else {
        g.fillStyle(0x5fae4a, 1);
        for (let k = -1; k <= 1; k++) g.fillTriangle(x + k * 6 - 3, y, x + k * 6 + 3, y, x + k * 8, y - 14 - rnd() * 6);
      }
    }
    // tarjeta del modelo
    const small = Math.min(w, h) < 520;
    const ms = small ? 72 : 104;
    g.fillStyle(0x000000, 0.15);
    g.fillRoundedRect(this.model.x - ms / 2, this.model.y - ms / 2 + 5, ms, ms, 18);
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(this.model.x - ms / 2, this.model.y - ms / 2, ms, ms, 18);
  }

  drawRoad() {
    const r = this.road;
    r.clear();
    const wOut = (this.tol * 2 + 3.4) * this.f;
    const wIn = this.tol * 2 * this.f;
    // sombra
    r.translateCanvas(0, this.f * 1.4);
    this.strokeLetter(r, wOut, 0x000000, 0.16);
    r.translateCanvas(0, -this.f * 1.4);
    this.strokeLetter(r, wOut, 0xd9b77e, 1);
    this.strokeLetter(r, wIn, this.state === 'won' ? 0xffd166 : 0xfff3d6, 1);
    this.strokeLetter(r, wIn * 0.55, this.state === 'won' ? 0xffe9a8 : 0xfffaf0, 1);
  }

  strokeLetter(r: Phaser.GameObjects.Graphics, width: number, col: number, alpha: number) {
    {
      for (const s of this.strokes) {
        if (s.length === 1) {
          r.fillStyle(col, alpha);
          r.fillCircle(this.sx(s[0]), this.sy(s[0]), width / 2);
          continue;
        }
        r.lineStyle(width, col, alpha);
        r.beginPath();
        r.moveTo(this.sx(s[0]), this.sy(s[0]));
        for (let i = 1; i < s.length; i++) r.lineTo(this.sx(s[i]), this.sy(s[i]));
        r.strokePath();
        // extremos y uniones redondeados
        if (alpha >= 1) {
          r.fillStyle(col, alpha);
          r.fillCircle(this.sx(s[0]), this.sy(s[0]), width / 2);
          r.fillCircle(this.sx(s[s.length - 1]), this.sy(s[s.length - 1]), width / 2);
          for (let i = 1; i < s.length - 1; i += 2) r.fillCircle(this.sx(s[i]), this.sy(s[i]), width / 2);
        }
      }
    }
  }

  onPointer(p: Phaser.Input.Pointer, down: boolean) {
    if (this.state !== 'play') return;
    const u = { x: (p.x - this.ox) / this.f, y: (p.y - this.oy) / this.f };
    if (this.tapDot) {
      const d = this.dots[this.si][0];
      if (down && Math.hypot(u.x - d.x, u.y - d.y) < 14) this.finishStroke();
      return;
    }
    this.target = u;
  }

  resetLetter(withSound: boolean) {
    this.si = 0;
    if (withSound) this.fails++;
    this.startStroke();
  }

  startStroke() {
    this.di = 0;
    const s = this.dots[this.si];
    this.tapDot = s.length === 1;
    this.target = null;
    if (this.tapDot) {
      this.hint.setText('Toca el punto').setVisible(true);
      return;
    }
    this.hint.setText(this.ctx.easy ? 'Arrastra a la viborita con tu dedo' : '').setVisible(this.ctx.easy && this.si === 0);
    this.head = { ...s[0] };
    this.heading = Math.atan2(s[1].y - s[0].y, s[1].x - s[0].x);
    this.trail = [];
    for (let i = 0; i < 20; i++) this.trail.push({ x: s[0].x - Math.cos(this.heading) * i * 0.6, y: s[0].y - Math.sin(this.heading) * i * 0.6 });
    this.bodyLen = 14;
    this.di = 1; // el primer punto es donde arranca
  }

  finishStroke() {
    sfx.good();
    this.si++;
    if (this.si >= this.dots.length) return this.win();
    if (!this.tapDot) say('snake_trazo');
    this.state = 'intro';
    this.time.delayedCall(350, () => {
      this.startStroke();
      this.state = 'play';
    });
  }

  win() {
    this.state = 'won';
    this.drawRoad();
    this.tweens.add({ targets: this.road, alpha: { from: 0.6, to: 1 }, yoyo: true, repeat: 3, duration: 160 });
    this.target = null;
    sfx.win();
    say('snake_letra_ok', { letra: letterName(glyph(this.key)) });
    this.confetti();
    const stars = this.fails === 0 ? 3 : this.fails <= 2 ? 2 : 1;
    this.time.delayedCall(1400, () => this.ctx.complete(stars, stars >= 2 ? [this.key] : []));
  }

  die() {
    this.state = 'dead';
    this.target = null;
    sfx.bad();
    this.cameras.main.shake(250, 0.01);
    say('snake_salio', { letra: letterName(glyph(this.key)) });
    this.time.delayedCall(1100, () => {
      this.resetLetter(true);
      this.state = 'play';
    });
  }

  confetti() {
    const cols = [0xff8a5b, 0xffd166, 0x4cc38a, 0x5b8def, 0xa98bff];
    for (let i = 0; i < 40; i++) {
      const c = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 10, 14, cols[i % cols.length]);
      const a = Math.random() * Math.PI * 2;
      const d = 150 + Math.random() * 250;
      this.tweens.add({ targets: c, x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d + 120, angle: 360, alpha: 0, duration: 1200, ease: 'Cubic.easeOut', onComplete: () => c.destroy() });
    }
  }

  /** distancia (unidades de letra) del punto a toda la forma de la letra */
  distToShape(p: Pt) {
    let best = Infinity;
    for (const s of this.strokes) {
      if (s.length === 1) {
        best = Math.min(best, Math.hypot(p.x - s[0].x, p.y - s[0].y));
        continue;
      }
      for (let i = 1; i < s.length; i++) best = Math.min(best, segDist(p, s[i - 1], s[i]));
    }
    return best;
  }

  update(_t: number, dtMs: number) {
    this.t += dtMs;
    const dt = Math.min(0.1, dtMs / 1000);
    for (const sp of this.sparks) {
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 300 * dt;
    }
    this.sparks = this.sparks.filter((sp) => sp.life > 0);
    if (this.state === 'play' && !this.tapDot) {
      // dirección deseada
      let dx = 0;
      let dy = 0;
      if (this.target) {
        dx = this.target.x - this.head.x;
        dy = this.target.y - this.head.y;
        if (Math.hypot(dx, dy) < 1.5) dx = dy = 0;
      } else if (this.keys) {
        dx = (this.keys.right.isDown ? 1 : 0) - (this.keys.left.isDown ? 1 : 0);
        dy = (this.keys.down.isDown ? 1 : 0) - (this.keys.up.isDown ? 1 : 0);
      }
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const step = Math.min(len, this.speed * dt);
        this.head.x += (dx / len) * step;
        this.head.y += (dy / len) * step;
        this.heading = Math.atan2(dy, dx);
        this.trail.unshift({ ...this.head });
        if (this.trail.length > 400) this.trail.length = 400;
        if (this.hint.visible && !this.tapDot) this.hint.setVisible(false);
        // comer puntos en orden
        const s = this.dots[this.si];
        const eatR = this.ctx.easy ? 7 : 5.5;
        let ate = false;
        while (this.di < s.length && Math.hypot(this.head.x - s[this.di].x, this.head.y - s[this.di].y) < eatR) {
          this.spark(s[this.di], 0xffb347, 4);
          this.di++;
          this.bodyLen += 1.2;
          ate = true;
        }
        if (ate) sfx.eat();
        if (this.di >= s.length) this.finishStroke();
        else if (this.distToShape(this.head) > this.tol) this.die();
      }
    }
    this.draw();
  }

  draw() {
    const g = this.g;
    g.clear();
    const f = this.f;
    // puntos (frutas) del trazo actual y puntos tenues de los trazos que faltan
    for (let k = this.dots.length - 1; k >= this.si; k--) {
      const s = this.dots[k];
      for (let i = k === this.si ? this.di : 0; i < s.length; i++) {
        const p = s[i];
        const x = this.sx(p), y = this.sy(p);
        if (k === this.si) {
          const isNext = i === this.di;
          const r = (isNext ? 3.3 + Math.sin(this.t / 140) * 0.5 : 2.3) * f;
          if (isNext) {
            g.fillStyle(0xffe08a, 0.45);
            g.fillCircle(x, y, r * 1.7);
          }
          g.fillStyle(0x000000, 0.14);
          g.fillCircle(x + r * 0.15, y + r * 0.3, r);
          g.fillStyle(0xf26b2e, 1);
          g.fillCircle(x, y, r);
          g.fillStyle(0xff9a4d, 1);
          g.fillCircle(x - r * 0.12, y - r * 0.12, r * 0.78);
          g.fillStyle(0xffffff, 0.75);
          g.fillCircle(x - r * 0.35, y - r * 0.38, r * 0.26);
          g.fillStyle(0x3fae4f, 1);
          g.fillEllipse(x + r * 0.35, y - r * 0.95, r * 0.7, r * 0.38);
        } else {
          g.fillStyle(0xe7d7b4, 1);
          g.fillCircle(x, y, 1.5 * f);
        }
      }
      // estrella de inicio de los trazos que faltan
      if (k > this.si || (k === this.si && this.tapDot)) {
        const pulse = k === this.si ? 1 + Math.sin(this.t / 150) * 0.12 : 1;
        drawStar(g, this.sx(s[0]), this.sy(s[0]) + f * 0.6, 4.4 * f * pulse, 0x000000, 0.15);
        drawStar(g, this.sx(s[0]), this.sy(s[0]), 4.4 * f * pulse, k === this.si ? 0xffc93c : 0xe0cfa4, 1);
        // número de orden del trazo
        if (k > this.si && this.dots.length > 1) {
          g.fillStyle(0x5b8def, 1);
          g.fillCircle(this.sx(s[0]) + 3.6 * f, this.sy(s[0]) - 3.6 * f, 2 * f);
        }
      }
    }
    // flecha de dirección
    const cur = this.dots[this.si];
    if (cur && !this.tapDot && this.state === 'play' && this.di < cur.length - 1) {
      const a = cur[Math.min(this.di, cur.length - 2)];
      const b = cur[Math.min(this.di + 2, cur.length - 1)];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const bounce = Math.sin(this.t / 160) * 1.2;
      const px = this.sx(a) + Math.cos(ang) * (9 + bounce) * f;
      const py = this.sy(a) + Math.sin(ang) * (9 + bounce) * f;
      const sz = 3.4 * f;
      const tri = (ox: number, oy: number, col: number, al: number) => {
        g.fillStyle(col, al);
        g.fillTriangle(
          ox + Math.cos(ang) * sz, oy + Math.sin(ang) * sz,
          ox + Math.cos(ang + 2.4) * sz, oy + Math.sin(ang + 2.4) * sz,
          ox + Math.cos(ang - 2.4) * sz, oy + Math.sin(ang - 2.4) * sz
        );
      };
      tri(px, py + f * 0.5, 0x000000, 0.15);
      tri(px, py, 0x4a7fe8, 0.95);
    }
    // chispas
    const fx = this.fx;
    fx.clear();
    for (const sp of this.sparks) {
      fx.fillStyle(sp.c, Math.max(0, sp.life * 2));
      fx.fillCircle(sp.x, sp.y, 3 + sp.life * 6);
    }
    // barra de progreso
    this.drawBar();
    if (this.tapDot) return;
    // cuerpo continuo con contorno, brillo y manchitas
    const segs: Pt[] = [];
    let acc = 0;
    let prev = this.trail[0];
    if (!prev) return;
    segs.push(prev);
    for (let i = 1; i < this.trail.length && acc < this.bodyLen; i++) {
      const p = this.trail[i];
      acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      if (Math.hypot(p.x - segs[segs.length - 1].x, p.y - segs[segs.length - 1].y) > 0.9) segs.push(p);
      prev = p;
    }
    const rad = (i: number) => (3.5 - Math.pow(i / Math.max(1, segs.length), 1.6) * 2.2) * f;
    g.fillStyle(0x000000, 0.13);
    for (let i = segs.length - 1; i >= 0; i--) g.fillCircle(this.sx(segs[i]) + f * 0.4, this.sy(segs[i]) + f * 1.1, rad(i));
    g.fillStyle(0x1f7a4a, 1);
    for (let i = segs.length - 1; i >= 0; i--) g.fillCircle(this.sx(segs[i]), this.sy(segs[i]), rad(i) + f * 0.55);
    g.fillStyle(0x34b56d, 1);
    for (let i = segs.length - 1; i >= 0; i--) g.fillCircle(this.sx(segs[i]), this.sy(segs[i]), rad(i));
    g.fillStyle(0x6fdc98, 1);
    for (let i = segs.length - 1; i >= 0; i--) g.fillCircle(this.sx(segs[i]) - rad(i) * 0.25, this.sy(segs[i]) - rad(i) * 0.3, rad(i) * 0.42);
    g.fillStyle(0xffd166, 1);
    for (let i = 4; i < segs.length; i += 5) g.fillCircle(this.sx(segs[i]), this.sy(segs[i]), rad(i) * 0.38);
    // cabeza
    const hx = this.sx(this.head);
    const hy = this.sy(this.head);
    const hr = 4.6 * f;
    const a = this.heading;
    g.fillStyle(0x000000, 0.13);
    g.fillCircle(hx + f * 0.4, hy + f * 1.2, hr);
    g.fillStyle(0x1f7a4a, 1);
    g.fillCircle(hx, hy, hr + f * 0.55);
    g.fillStyle(0x34b56d, 1);
    g.fillCircle(hx, hy, hr);
    g.fillStyle(0x6fdc98, 1);
    g.fillCircle(hx - hr * 0.25, hy - hr * 0.32, hr * 0.5);
    // cachetes
    for (const side of [-1, 1]) {
      g.fillStyle(0xff8fa3, 0.55);
      g.fillCircle(hx + Math.cos(a) * hr * 0.15 + Math.cos(a + side * 1.9) * hr * 0.62, hy + Math.sin(a) * hr * 0.15 + Math.sin(a + side * 1.9) * hr * 0.62, hr * 0.2);
    }
    for (const side of [-1, 1]) {
      const ex = hx + Math.cos(a) * hr * 0.38 + Math.cos(a + (side * Math.PI) / 2) * hr * 0.46;
      const ey = hy + Math.sin(a) * hr * 0.38 + Math.sin(a + (side * Math.PI) / 2) * hr * 0.46;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex, ey, hr * 0.34);
      g.fillStyle(0x2b2f55, 1);
      g.fillCircle(ex + Math.cos(a) * hr * 0.11, ey + Math.sin(a) * hr * 0.11, hr * 0.19);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex + Math.cos(a) * hr * 0.05 - hr * 0.06, ey + Math.sin(a) * hr * 0.05 - hr * 0.08, hr * 0.07);
    }
    if (Math.sin(this.t / 220) > 0.4) {
      g.lineStyle(Math.max(2, f * 0.8), 0xff4d6d, 1);
      const tx = hx + Math.cos(a) * hr * 1.7, ty = hy + Math.sin(a) * hr * 1.7;
      g.lineBetween(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr, tx, ty);
      g.lineBetween(tx, ty, tx + Math.cos(a + 0.6) * hr * 0.3, ty + Math.sin(a + 0.6) * hr * 0.3);
      g.lineBetween(tx, ty, tx + Math.cos(a - 0.6) * hr * 0.3, ty + Math.sin(a - 0.6) * hr * 0.3);
    }
  }

  drawBar() {
    const b = this.bar;
    b.clear();
    const w = this.compact ? Math.min(150, this.ox - 30) : Math.min(320, this.scale.width * 0.5);
    const x = this.compact ? 16 : (this.scale.width - w) / 2;
    const y = this.compact ? HUD_TOP + 6 : HUD_TOP - 64;
    const done = this.dots.slice(0, this.si).reduce((a, s) => a + s.length, 0) + (this.tapDot ? 0 : this.di);
    const k = this.totalDots ? Math.min(1, done / this.totalDots) : 0;
    b.fillStyle(0x000000, 0.18);
    b.fillRoundedRect(x, y + 3, w, 20, 10);
    b.fillStyle(0xffffff, 0.95);
    b.fillRoundedRect(x, y, w, 20, 10);
    if (k > 0) {
      b.fillStyle(0x34b56d, 1);
      b.fillRoundedRect(x + 3, y + 3, Math.max(14, (w - 6) * k), 14, 7);
      b.fillStyle(0xffffff, 0.35);
      b.fillRoundedRect(x + 6, y + 4, Math.max(8, (w - 12) * k), 4, 2);
    }
  }

  spark(p: Pt, c = 0xffd166, n = 5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 90;
      this.sparks.push({ x: this.sx(p), y: this.sy(p), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.45, c });
    }
  }
}

function segDist(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha = 1) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  g.fillStyle(color, alpha);
  g.fillPoints(pts, true);
}

export function start(ctx: GameContext): GameInstance {
  let game: Phaser.Game | null = null;
  let dead = false;
  fontsReady().then(() => {
    if (dead) return;
    game = createGame(ctx.host, 'snake', new SnakeScene(), { ctx }, { backgroundColor: '#dff5e6' });
  });
  return {
    destroy() {
      dead = true;
      game?.destroy(true);
    },
  };
}
