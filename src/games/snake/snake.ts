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
  road!: Phaser.GameObjects.Graphics;
  g!: Phaser.GameObjects.Graphics;
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
    this.tol = this.ctx.easy ? 13 : 9.5;
    this.speed = this.ctx.easy ? 42 : 58;
  }

  create() {
    this.road = this.add.graphics();
    this.g = this.add.graphics();
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
    const availH = h - HUD_TOP - 24;
    const size = Math.min(w * 0.9, availH * 0.95, 760);
    this.f = size / 100;
    this.ox = (w - size) / 2;
    this.oy = HUD_TOP + (availH - size) / 2;
    const small = Math.min(w, h) < 520;
    this.model.setFontSize(small ? 44 : 64).setPosition(small ? 40 : 60, h - (small ? 40 : 60));
    this.hint.setPosition(w / 2, h - 12).setFontSize(small ? 17 : 22);
    this.drawRoad();
  }

  sx(p: Pt) {
    return this.ox + p.x * this.f;
  }
  sy(p: Pt) {
    return this.oy + p.y * this.f;
  }

  drawRoad() {
    const r = this.road;
    r.clear();
    const wOut = (this.tol * 2 + 3) * this.f;
    const wIn = this.tol * 2 * this.f;
    for (const pass of [0, 1]) {
      for (const s of this.strokes) {
        const col = pass === 0 ? 0xb9e4c9 : 0xffffff;
        const width = pass === 0 ? wOut : wIn;
        if (s.length === 1) {
          r.fillStyle(col, 1);
          r.fillCircle(this.sx(s[0]), this.sy(s[0]), width / 2);
          continue;
        }
        r.lineStyle(width, col, 1);
        r.beginPath();
        r.moveTo(this.sx(s[0]), this.sy(s[0]));
        for (let i = 1; i < s.length; i++) r.lineTo(this.sx(s[i]), this.sy(s[i]));
        r.strokePath();
        // extremos redondeados
        r.fillStyle(col, 1);
        r.fillCircle(this.sx(s[0]), this.sy(s[0]), width / 2);
        r.fillCircle(this.sx(s[s.length - 1]), this.sy(s[s.length - 1]), width / 2);
        for (let i = 1; i < s.length - 1; i += 2) r.fillCircle(this.sx(s[i]), this.sy(s[i]), width / 2);
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
    // puntos de trazos futuros (tenues) y del actual
    for (let k = 0; k < this.dots.length; k++) {
      const s = this.dots[k];
      if (k < this.si) continue;
      for (let i = k === this.si ? this.di : 0; i < s.length; i++) {
        const isNext = k === this.si && i === this.di;
        const p = s[i];
        if (k === this.si) {
          const r = (isNext ? 3.2 + Math.sin(this.t / 150) * 0.6 : 2.2) * f;
          g.fillStyle(isNext ? 0xff8a5b : 0xffb38f, 1);
          g.fillCircle(this.sx(p), this.sy(p), r);
        } else {
          g.fillStyle(0xd7e9dd, 1);
          g.fillCircle(this.sx(p), this.sy(p), 1.6 * f);
        }
      }
      // estrella de inicio de los trazos que faltan + número de orden
      if (k > this.si || (k === this.si && this.tapDot)) {
        drawStar(g, this.sx(s[0]), this.sy(s[0]), 4 * f, k === this.si ? 0xffc93c : 0xe6e0c8);
      }
    }
    // flecha de dirección al comienzo del trazo actual
    const cur = this.dots[this.si];
    if (cur && !this.tapDot && this.state === 'play' && this.di < cur.length - 1) {
      const a = cur[Math.min(this.di, cur.length - 2)];
      const b = cur[Math.min(this.di + 2, cur.length - 1)];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const px = this.sx(a) + Math.cos(ang) * 9 * f;
      const py = this.sy(a) + Math.sin(ang) * 9 * f;
      const s = 3.2 * f;
      g.fillStyle(0x5b8def, 0.8);
      g.fillTriangle(
        px + Math.cos(ang) * s,
        py + Math.sin(ang) * s,
        px + Math.cos(ang + 2.4) * s,
        py + Math.sin(ang + 2.4) * s,
        px + Math.cos(ang - 2.4) * s,
        py + Math.sin(ang - 2.4) * s
      );
    }
    if (this.tapDot) return;
    // cuerpo
    const segs: Pt[] = [];
    let acc = 0;
    let prev = this.trail[0];
    if (!prev) return;
    segs.push(prev);
    for (let i = 1; i < this.trail.length && acc < this.bodyLen; i++) {
      const p = this.trail[i];
      acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      if (Math.hypot(p.x - segs[segs.length - 1].x, p.y - segs[segs.length - 1].y) > 1.4) segs.push(p);
      prev = p;
    }
    for (let i = segs.length - 1; i >= 1; i--) {
      const r = (3.4 - (i / segs.length) * 1.4) * f;
      g.fillStyle(i % 2 ? 0x2fa36b : 0x3dbb7d, 1);
      g.fillCircle(this.sx(segs[i]), this.sy(segs[i]), r);
    }
    // cabeza
    const hx = this.sx(this.head);
    const hy = this.sy(this.head);
    const hr = 4.4 * f;
    g.fillStyle(0x2a9662, 1);
    g.fillCircle(hx, hy, hr);
    g.fillStyle(0x56d394, 1);
    g.fillCircle(hx - hr * 0.2, hy - hr * 0.25, hr * 0.55);
    const a = this.heading;
    for (const side of [-1, 1]) {
      const ex = hx + Math.cos(a) * hr * 0.35 + Math.cos(a + (side * Math.PI) / 2) * hr * 0.5;
      const ey = hy + Math.sin(a) * hr * 0.35 + Math.sin(a + (side * Math.PI) / 2) * hr * 0.5;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex, ey, hr * 0.32);
      g.fillStyle(0x3a3f6b, 1);
      g.fillCircle(ex + Math.cos(a) * hr * 0.1, ey + Math.sin(a) * hr * 0.1, hr * 0.16);
    }
    if (Math.sin(this.t / 220) > 0.4) {
      g.lineStyle(Math.max(2, f * 0.7), 0xff6b81, 1);
      g.lineBetween(hx + Math.cos(a) * hr, hy + Math.sin(a) * hr, hx + Math.cos(a) * hr * 1.6, hy + Math.sin(a) * hr * 1.6);
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

function drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  g.fillStyle(color, 1);
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
