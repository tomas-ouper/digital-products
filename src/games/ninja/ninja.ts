// Trazo Ninja: letras que vuelan; para cortar una hay que dibujar su trazo con el dedo.
import Phaser from 'phaser';
import type { GameContext, GameInstance } from '../types';
import { LETTERS, glyph, isCursive, type Pt } from '../../core/letters';
import { makeTemplate, recognize, type Template } from '../../core/recognizer';
import { NINJA_LEVELS, type NinjaLevel } from './levels';
import { createGame, fontsReady, FONT, CURSIVE } from '../phaserHost';
import { say, letterName } from '../../core/voice';
import { sfx } from '../../core/sound';
import { shuffle } from '../../core/ui';

const HUD_TOP = 84;
const COLORS = [0xff8a5b, 0xffc93c, 0x4cc38a, 0x5b8def, 0xa98bff, 0xff8fb1];

interface Piece {
  c: Phaser.GameObjects.Container;
  label: string; // lo que se ve (letra o sílaba)
  key: string; // plantilla a dibujar
  x: number;
  y: number;
  vx: number;
  vy: number;
  vr: number;
  r: number;
  color: number;
  alive: boolean;
  ring?: Phaser.GameObjects.Arc;
}

class NinjaScene extends Phaser.Scene {
  ctx!: GameContext;
  lv!: NinjaLevel;
  templates = new Map<string, Template>();
  pieces: Piece[] = [];
  target = ''; // etiqueta objetivo
  prevTarget = '';
  good = 0;
  errors = 0;
  grav = 300;
  strokes: Pt[][] = [];
  curStroke: Pt[] | null = null;
  recTimer: Phaser.Time.TimerEvent | null = null;
  trail!: Phaser.GameObjects.Graphics;
  bg!: Phaser.GameObjects.Graphics;
  banner!: Phaser.GameObjects.Container;
  bannerBox!: Phaser.GameObjects.Graphics;
  bannerText!: Phaser.GameObjects.Text;
  bannerLetter!: Phaser.GameObjects.Text;
  counter!: Phaser.GameObjects.Text;
  blade: { x: number; y: number; t: number }[] = [];
  topY = HUD_TOP;
  waveTimer = 0;
  waves = 0;
  over = false;
  spawning = false;

  constructor() {
    super('ninja');
  }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.lv = NINJA_LEVELS[this.ctx.level] || NINJA_LEVELS[0];
    for (const label of this.lv.pool) {
      const k = this.keyOf(label);
      if (!this.templates.has(k)) this.templates.set(k, makeTemplate(k, LETTERS[k]));
    }
  }

  /** plantilla que hay que dibujar para una etiqueta (sílaba → primera letra) */
  bubbleTex(color: number) {
    const key = 'bub-' + color.toString(16);
    if (this.textures.exists(key)) return key;
    const S = 230;
    const tex = this.textures.createCanvas(key, S, S)!;
    const c = tex.getContext();
    const R = 100;
    const cx = S / 2, cy = S / 2 - 4;
    const hexs = (n: number) => '#' + n.toString(16).padStart(6, '0');
    const lighten = (n: number, f: number) => {
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      const m = (v: number) => Math.round(v + (255 - v) * f);
      return `rgb(${m(r)},${m(g)},${m(b)})`;
    };
    const darken = (n: number, f: number) => {
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
    };
    // sombra
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(cx + 6, cy + 12, R, R * 0.98, 0, 0, Math.PI * 2);
    c.fill();
    // cuerpo con degradé radial
    const grd = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    grd.addColorStop(0, lighten(color, 0.55));
    grd.addColorStop(0.55, hexs(color));
    grd.addColorStop(1, darken(color, 0.62));
    c.fillStyle = grd;
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fill();
    // borde de luz
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(cx, cy, R - 4, Math.PI * 0.55, Math.PI * 1.45);
    c.stroke();
    // reflejo
    const sp = c.createRadialGradient(cx - R * 0.38, cy - R * 0.5, 2, cx - R * 0.38, cy - R * 0.5, R * 0.42);
    sp.addColorStop(0, 'rgba(255,255,255,0.95)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sp;
    c.beginPath();
    c.ellipse(cx - R * 0.38, cy - R * 0.5, R * 0.42, R * 0.26, -0.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath();
    c.arc(cx + R * 0.5, cy + R * 0.45, R * 0.07, 0, Math.PI * 2);
    c.fill();
    tex.refresh();
    return key;
  }

  keyOf(label: string) {
    return this.lv.syllables ? label[0] : label;
  }

  get cursive() {
    return isCursive(this.lv.pool[0]);
  }

  create() {
    if (location.search.includes('debug')) (window as any).__scene = this;
    this.bg = this.add.graphics();
    this.trail = this.add.graphics().setDepth(20);
    this.bannerBox = this.add.graphics();
    this.bannerText = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '26px', color: '#3a3f6b', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.bannerLetter = this.add
      .text(0, 0, '', { fontFamily: this.cursive ? CURSIVE : FONT, fontSize: '54px', color: '#ff6b3d', fontStyle: this.cursive ? 'normal' : 'bold' })
      .setOrigin(0, 0.5);
    this.counter = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5);
    this.banner = this.add.container(0, 0, [this.bannerBox, this.bannerText, this.bannerLetter, this.counter]).setDepth(15);
    this.layout();
    this.scale.on('resize', () => this.layout());

    const toLocal = (p: Phaser.Input.Pointer): Pt => ({ x: p.x, y: p.y });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.over) return;
      this.recTimer?.remove();
      this.recTimer = null;
      this.curStroke = [toLocal(p)];
      this.blade = [{ x: p.x, y: p.y, t: this.time.now }];
      sfx.whoosh();
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.curStroke || !p.isDown) return;
      const last = this.curStroke[this.curStroke.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) > 3) {
        this.curStroke.push(toLocal(p));
        this.blade.push({ x: p.x, y: p.y, t: this.time.now });
      }
    });
    const up = () => {
      if (!this.curStroke) return;
      const s = this.curStroke;
      this.curStroke = null;
      let len = 0;
      for (let i = 1; i < s.length; i++) len += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
      // un toque corto cuenta como "punto" (para la i)
      this.strokes.push(len < 12 ? [s[0]] : s);
      this.recTimer = this.time.delayedCall(this.ctx.easy ? 850 : 650, () => this.recognizeGesture());
    };
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);

    this.ctx.setTitle(this.lv.title);
    this.ctx.setRepeat(() => this.sayTarget());
    this.updateCounter();
    say('ninja_intro').then(() => !this.over && this.nextRound());
  }

  layout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const g = this.bg;
    g.clear();
    g.fillGradientStyle(0x1d2457, 0x1d2457, 0x6a4fb8, 0x8e5fc4, 1);
    g.fillRect(0, 0, w, h);
    // estrellitas fijas (semilla fija para que no cambien)
    let s = 7;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 90; i++) {
      g.fillStyle(0xffffff, 0.25 + rnd() * 0.6);
      g.fillCircle(rnd() * w, rnd() * h * 0.7, 0.8 + rnd() * 1.8);
    }
    // luna con halo
    const mx = w * 0.82, my = h * 0.3, mr = Math.min(w, h) * 0.09;
    for (let i = 16; i > 0; i--) {
      g.fillStyle(0xfff4c9, 0.018 * (17 - i) / 4);
      g.fillCircle(mx, my, mr * (1 + i * 0.13));
    }
    g.fillStyle(0xfff6d8, 1);
    g.fillCircle(mx, my, mr);
    g.fillStyle(0xeadfb8, 1);
    g.fillCircle(mx - mr * 0.35, my - mr * 0.2, mr * 0.18);
    g.fillCircle(mx + mr * 0.25, my + mr * 0.35, mr * 0.12);
    // montañas en capas
    const hills = (base: number, amp: number, col: number, seed: number) => {
      const pts: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, h)];
      for (let x = 0; x <= w + 40; x += 40) pts.push(new Phaser.Math.Vector2(x, base - Math.abs(Math.sin(x * 0.006 + seed) * amp) - Math.sin(x * 0.017 + seed * 2) * amp * 0.25));
      pts.push(new Phaser.Math.Vector2(w, h));
      g.fillStyle(col, 1);
      g.fillPoints(pts, true);
    };
    hills(h * 0.78, h * 0.2, 0x3a2f78, 1);
    hills(h * 0.88, h * 0.14, 0x2a2360, 3);
    hills(h * 0.96, h * 0.08, 0x1d1847, 5);
    // banner de consigna
    const compact = h < 600 && w > h * 1.3 && w - 2 * 230 >= 330;
    const bw = compact ? Math.min(w - 2 * 230, 460) : Math.min(w - 24, 460);
    const bh = compact ? 68 : 76;
    this.topY = compact ? 6 : HUD_TOP + 4;
    this.banner.setPosition((w - bw) / 2, this.topY);
    this.bannerBox.clear();
    this.bannerBox.fillStyle(0xffffff, 0.95);
    this.bannerBox.fillRoundedRect(0, 0, bw, bh, 26);
    this.bannerBox.fillStyle(0x3a3f6b, 1);
    this.bannerBox.fillRoundedRect(bw - 92, 14, 80, 48, 24);
    this.bannerText.setPosition(20, bh / 2);
    this.bannerLetter.setPosition(20 + this.bannerText.width + 12, bh / 2 + (this.cursive ? 4 : 0));
    this.counter.setPosition(bw - 22, bh / 2);
    this.grav = this.gravity();
  }

  gravity() {
    const h = this.scale.height;
    const H = h * 0.55;
    const T = this.ctx.easy ? 7.5 : 5.2;
    return (8 * H) / (T * T);
  }

  updateCounter() {
    this.counter.setText(`${this.good}/${this.lv.goal}`);
  }

  setBanner() {
    const shown = this.lv.syllables ? `${this.target}` : glyph(this.target);
    this.bannerText.setText(this.lv.syllables ? 'Corta' : 'Corta la');
    this.bannerLetter.setText(this.lv.syllables ? `${shown} → ${this.target[0]}` : shown);
    this.bannerLetter.setFontSize(this.lv.syllables ? 38 : /^[a-zñ]$/.test(shown) && !this.cursive ? 70 : 54);
    this.bannerLetter.setX(20 + this.bannerText.width + 12);
  }

  /** nombre de la letra que hay que dibujar ("eme") */
  targetName() {
    return letterName(glyph(this.keyOf(this.target)));
  }

  sayTarget() {
    if (this.lv.syllables) return say('ninja_corta_silaba', { silaba: this.target.toLowerCase() });
    return say('ninja_corta', { letra: letterName(glyph(this.target)) });
  }

  nextRound() {
    const options = this.lv.pool.filter((p) => p !== this.prevTarget);
    this.target = options[Math.floor(Math.random() * options.length)];
    this.prevTarget = this.target;
    this.setBanner();
    this.sayTarget();
    this.waves = 0;
    this.spawning = true;
    this.time.delayedCall(700, () => this.spawnWave());
  }

  spawnWave() {
    if (this.over) return;
    this.waves++;
    const n = this.ctx.easy ? 2 + (Math.random() < 0.4 ? 1 : 0) : 3 + (Math.random() < 0.5 ? 1 : 0);
    const others = shuffle(this.lv.pool.filter((p) => this.keyOf(p) !== this.keyOf(this.target)));
    const labels = shuffle([this.target, ...others.slice(0, n - 1)]);
    this.spawning = true;
    labels.forEach((l, i) => this.time.delayedCall(i * 380, () => this.spawn(l, i, labels.length)));
    this.time.delayedCall(labels.length * 380 + 50, () => (this.spawning = false));
  }

  spawn(label: string, i: number, n: number) {
    if (this.over) return;
    const w = this.scale.width;
    const h = this.scale.height;
    const minSide = Math.min(w, h);
    const r = Phaser.Math.Clamp(minSide * (this.ctx.easy ? 0.11 : 0.095), 40, 78);
    const lane = (i + 0.5) / n;
    const x = w * (0.12 + lane * 0.76) + (Math.random() - 0.5) * w * 0.05;
    const apex = Math.min(h * 0.55, this.topY + 80 + r + Math.random() * (h * 0.18));
    const vy = -Math.sqrt(2 * this.grav * (h + r - apex));
    const vx = (Math.random() - 0.5) * w * 0.04;
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    const g = this.add.image(0, 0, this.bubbleTex(color)).setDisplaySize(r * 2.3, r * 2.3);
    const cur = this.cursive;
    const t = this.add
      .text(0, cur ? 4 : 2, this.lv.syllables ? label : glyph(label), {
        fontFamily: cur ? CURSIVE : FONT,
        fontSize: `${Math.round(r * (this.lv.syllables ? 0.85 : cur ? 0.95 : /^[a-zñ]$/.test(label) ? 1.45 : 1.15))}px`,
        color: '#ffffff',
        fontStyle: cur ? 'normal' : 'bold',
        stroke: '#3a3f6b',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const c = this.add.container(x, h + r, [g, t]).setDepth(5);
    const piece: Piece = { c, label, key: this.keyOf(label), x, y: h + r, vx, vy, vr: (Math.random() - 0.5) * 0.3, r, color, alive: true };
    if (this.ctx.easy && label === this.target) {
      piece.ring = this.add.circle(0, 0, r + 8).setStrokeStyle(6, 0xfff27a, 0.9);
      c.addAt(piece.ring, 0);
      this.tweens.add({ targets: piece.ring, scale: 1.12, yoyo: true, repeat: -1, duration: 450 });
    }
    this.pieces.push(piece);
  }

  recognizeGesture() {
    this.recTimer = null;
    const strokes = this.strokes;
    this.strokes = [];
    if (this.over) return;
    const alive = this.pieces.filter((p) => p.alive && p.y < this.scale.height + p.r);
    const cand = [...new Set(alive.map((p) => p.key))];
    if (!cand.length) return;
    const tm = cand.map((k) => this.templates.get(k)!).filter(Boolean);
    const m = recognize(strokes, tm);
    if (!m) return;
    const thr = this.ctx.easy ? 3.4 : 2.9;
    if (m.score > thr) {
      sfx.bad();
      say('ninja_no_entendi', { letra: this.targetName() });
      return;
    }
    // pieza a cortar: la de esa letra más cerca del centro del gesto
    const pts = strokes.flat();
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const opts = alive.filter((p) => p.key === m.name).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
    const piece = opts[0];
    if (!piece) return;
    if (piece.key === this.keyOf(this.target)) this.cutGood(piece, pts);
    else this.cutBad(piece, pts);
  }

  slashLine(pts: Pt[]) {
    // dibuja un tajo blanco que se desvanece sobre el gesto
    const g = this.add.graphics().setDepth(25);
    g.lineStyle(10, 0xffffff, 0.9);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) g.lineTo(p.x, p.y);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
  }

  splitPiece(p: Piece, color: number) {
    p.alive = false;
    p.c.setVisible(false);
    // salpicadura que se desvanece
    const st = this.add.graphics({ x: p.x, y: p.y }).setDepth(1);
    st.fillStyle(color, 0.55);
    st.fillCircle(0, 0, p.r * 0.9);
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = p.r * (0.9 + Math.random() * 0.8);
      st.fillCircle(Math.cos(a) * d, Math.sin(a) * d, p.r * (0.12 + Math.random() * 0.22));
    }
    this.tweens.add({ targets: st, alpha: 0, delay: 600, duration: 1600, onComplete: () => st.destroy() });
    // destello
    const fl = this.add.circle(p.x, p.y, p.r, 0xffffff, 0.9).setDepth(24);
    this.tweens.add({ targets: fl, scale: 2.2, alpha: 0, duration: 260, onComplete: () => fl.destroy() });
    for (const side of [-1, 1]) {
      const half = this.add.graphics({ x: p.x, y: p.y }).setDepth(6);
      half.fillStyle(color, 1);
      half.slice(0, 0, p.r, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? (Math.PI * 3) / 2 : Math.PI / 2, false);
      half.fillPath();
      half.fillStyle(0xfff6e0, 1);
      half.fillRect(side < 0 ? -4 : 0, -p.r, 4, p.r * 2);
      this.tweens.add({ targets: half, x: p.x + side * 140, y: p.y + 260, angle: side * 70, alpha: 0, duration: 900, ease: 'Quad.easeIn', onComplete: () => half.destroy() });
    }
    for (let i = 0; i < 12; i++) {
      const d = this.add.circle(p.x, p.y, 4 + Math.random() * 5, color).setDepth(6);
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({ targets: d, x: p.x + Math.cos(a) * 120, y: p.y + Math.sin(a) * 120 + 60, alpha: 0, duration: 600, onComplete: () => d.destroy() });
    }
  }

  floatText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, { fontFamily: FONT, fontSize: '44px', color, fontStyle: 'bold', stroke: '#3a3f6b', strokeThickness: 6 }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  cutGood(p: Piece, pts: Pt[]) {
    this.slashLine(pts);
    sfx.slice();
    this.splitPiece(p, p.color);
    this.floatText(p.x, p.y, '+1', '#ffe066');
    this.good++;
    this.target = '';
    this.updateCounter();
    // el resto de la ola se va volando
    this.pieces.forEach((o) => o.alive && (o.vy = Math.min(o.vy, -200)));
    if (this.good >= this.lv.goal) return this.finish();
    sfx.good();
    this.time.delayedCall(900, () => {
      this.clearPieces();
      this.nextRound();
    });
  }

  cutBad(p: Piece, pts: Pt[]) {
    this.slashLine(pts);
    sfx.bad();
    this.splitPiece(p, 0x9a9ab0);
    this.errors++;
    if (this.good > 0) this.good--;
    this.updateCounter();
    this.floatText(p.x, p.y, '−1', '#ff6b6b');
    this.cameras.main.shake(200, 0.008);
    say('ninja_mal', { letra: this.targetName() });
  }

  clearPieces() {
    this.pieces.forEach((p) => p.c.destroy());
    this.pieces = [];
  }

  finish() {
    this.over = true;
    sfx.win();
    const stars = this.errors <= 1 ? 3 : this.errors <= 3 ? 2 : 1;
    const letters = this.lv.syllables ? [] : [...new Set(this.lv.pool)];
    this.time.delayedCall(1000, () => this.ctx.complete(stars, stars >= 2 ? letters : []));
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(0.05, dtMs / 1000);
    const h = this.scale.height;
    for (const p of this.pieces) {
      if (!p.alive) continue;
      p.vy += this.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.c.setPosition(p.x, p.y);
      p.c.rotation += p.vr * dt;
      if (p.vy > 0 && p.y > h + p.r + 10) {
        p.alive = false;
        p.c.destroy();
      }
    }
    this.pieces = this.pieces.filter((p) => p.alive || p.c.active);
    // si la ola terminó sin cortar el objetivo, otra ola
    if (!this.over && !this.spawning && this.target && this.pieces.every((p) => !p.alive)) {
      this.waveTimer += dtMs;
      if (this.waveTimer > 500) {
        this.waveTimer = 0;
        this.clearPieces();
        if (this.waves % 2 === 0) this.sayTarget();
        this.spawnWave();
      }
    } else this.waveTimer = 0;
    // trazo del niño (para que vea la letra que dibuja)
    const g = this.trail;
    g.clear();
    const all = [...this.strokes, ...(this.curStroke ? [this.curStroke] : [])];
    for (const st of all) {
      if (st.length === 1) {
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(st[0].x, st[0].y, 9);
        continue;
      }
      g.lineStyle(18, 0x9fe7ff, 0.18);
      g.strokePoints(st as Phaser.Types.Math.Vector2Like[]);
      g.lineStyle(7, 0xffffff, 0.75);
      g.strokePoints(st as Phaser.Types.Math.Vector2Like[]);
    }
    // filo luminoso en la punta del dedo (se afina hacia la cola)
    const now = this.time.now;
    this.blade = this.blade.filter((b) => now - b.t < 220);
    const bl = this.blade;
    for (let i = 1; i < bl.length; i++) {
      const k = i / bl.length;
      g.lineStyle(4 + k * 18, 0x7fdcff, 0.25 * k);
      g.lineBetween(bl[i - 1].x, bl[i - 1].y, bl[i].x, bl[i].y);
      g.lineStyle(2 + k * 7, 0xffffff, 0.95 * k);
      g.lineBetween(bl[i - 1].x, bl[i - 1].y, bl[i].x, bl[i].y);
    }
    if (bl.length && this.curStroke) {
      const tip = bl[bl.length - 1];
      g.fillStyle(0xffffff, 1);
      g.fillCircle(tip.x, tip.y, 6);
      g.fillStyle(0x7fdcff, 0.35);
      g.fillCircle(tip.x, tip.y, 14);
    }
  }
}

export function start(ctx: GameContext): GameInstance {
  let game: Phaser.Game | null = null;
  let dead = false;
  fontsReady().then(() => {
    if (dead) return;
    game = createGame(ctx.host, 'ninja', new NinjaScene(), { ctx }, { backgroundColor: '#3b4a8c' });
  });
  return {
    destroy() {
      dead = true;
      game?.destroy(true);
    },
  };
}
