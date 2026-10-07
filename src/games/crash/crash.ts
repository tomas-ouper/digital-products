// CaliCrash: match-3 de letras en grilla 7x7 con fichas en relieve. Objetivos: tachar letras o formar palabras.
import Phaser from 'phaser';
import type { GameContext, GameInstance } from '../types';
import { CRASH_LEVELS, type CrashLevel } from './levels';
import { createGame, fontsReady, FONT, CURSIVE } from '../phaserHost';
import { say, letterName } from '../../core/voice';
import { sfx } from '../../core/sound';

const N = 7;
const HUD_TOP = 84;
const PALETTE = [0xff8a5b, 0x5b8def, 0x4cc38a, 0xf5b82e, 0xa98bff, 0xff7aa8];

interface Tile {
  letter: string;
  c: Phaser.GameObjects.Container;
  r: number;
  col: number;
}

function shade(color: number, f: number) {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return (m(r) << 16) | (m(g) << 8) | m(b);
}

class CrashScene extends Phaser.Scene {
  ctx!: GameContext;
  lv!: CrashLevel;
  grid: (Tile | null)[][] = [];
  cell = 64;
  x0 = 0;
  y0 = 0;
  busy = false;
  moves = 0;
  progress = 0;
  over = false;
  chain: Tile[] = [];
  selected: Tile | null = null;
  down: { tile: Tile; x: number; y: number; swiped: boolean } | null = null;
  panel!: Phaser.GameObjects.Container;
  panelBg!: Phaser.GameObjects.Graphics;
  goalText!: Phaser.GameObjects.Text;
  movesText!: Phaser.GameObjects.Text;
  slots: Phaser.GameObjects.Text[] = [];
  chainG!: Phaser.GameObjects.Graphics;
  board!: Phaser.GameObjects.Graphics;
  bgG!: Phaser.GameObjects.Graphics;
  idle = 0;
  hintTiles: Tile[] = [];

  constructor() {
    super('crash');
  }

  init(data: { ctx: GameContext }) {
    this.ctx = data.ctx;
    this.lv = CRASH_LEVELS[this.ctx.level] || CRASH_LEVELS[0];
    this.moves = this.lv.moves + (this.ctx.easy ? 6 : 0);
    this.progress = 0;
    this.over = false;
    this.busy = false;
    this.chain = [];
    this.grid = [];
    this.slots = [];
    this.hintTiles = [];
    this.selected = null;
    this.down = null;
    this.idle = 0;
  }

  get font() {
    return this.lv.cursive ? CURSIVE : FONT;
  }

  colorOf(letter: string) {
    const i = this.lv.pool.indexOf(letter);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  }

  create() {
    if (location.search.includes('debug')) (window as any).__scene = this;
    this.makeTextures();
    this.bgG = this.add.graphics();
    this.board = this.add.graphics();
    this.chainG = this.add.graphics().setDepth(8);
    this.panelBg = this.add.graphics();
    this.goalText = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '22px', color: '#3a3f6b', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.movesText = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.panel = this.add.container(0, 0, [this.panelBg, this.goalText, this.movesText]).setDepth(10);
    if (this.lv.kind === 'palabra') {
      for (let i = 0; i < this.lv.word!.length; i++) {
        const t = this.add.text(0, 0, '', { fontFamily: this.font, fontSize: '30px', color: '#3a3f6b', fontStyle: this.lv.cursive ? 'normal' : 'bold' }).setOrigin(0.5);
        this.slots.push(t);
        this.panel.add(t);
      }
    }
    // tablero inicial sin coincidencias
    for (let r = 0; r < N; r++) {
      this.grid.push([]);
      for (let c = 0; c < N; c++) {
        let letter: string;
        do letter = this.randomLetter();
        while ((c >= 2 && this.grid[r][c - 1]!.letter === letter && this.grid[r][c - 2]!.letter === letter) || (r >= 2 && this.grid[r - 1][c]!.letter === letter && this.grid[r - 2][c]!.letter === letter));
        this.grid[r].push(this.makeTile(letter, r, c));
      }
    }
    if (this.lv.kind === 'palabra') this.ensureWord();
    if (this.lv.kind === 'tacha' && !this.findMove()) this.shuffleBoard();
    this.layout(true);
    this.scale.on('resize', () => this.layout(true));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => this.onUp());
    this.input.on('pointerupoutside', () => this.onUp());

    const intro = () =>
      this.lv.kind === 'tacha'
        ? say('crash_intro_tacha', { n: this.lv.count, letra: letterName(this.lv.letter!) })
        : say('crash_intro_palabra', { palabra: this.lv.word! });
    this.ctx.setTitle(this.lv.title);
    this.ctx.setRepeat(intro);
    this.updatePanel();
    intro();
  }

  /** Texturas de ficha (relieve: sombra, cara con degradé, brillo) por color */
  makeTextures() {
    const S = 128;
    for (const letter of this.lv.pool) {
      const color = this.colorOf(letter);
      const key = 'tile-' + color.toString(16);
      if (this.textures.exists(key)) continue;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x000000, 0.18);
      g.fillRoundedRect(6, 12, S - 12, S - 12, 26);
      g.fillStyle(shade(color, 0.7), 1);
      g.fillRoundedRect(4, 8, S - 8, S - 12, 26);
      // cara con degradé vertical en franjas
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        g.fillStyle(shade(color, 1.18 - (i / steps) * 0.3), 1);
        const y = 4 + (i * (S - 22)) / steps;
        g.fillRoundedRect(4, y, S - 8, (S - 22) / steps + 14, i === 0 ? 24 : 6);
      }
      g.fillStyle(color, 1);
      g.fillRoundedRect(4, 30, S - 8, S - 52, 10);
      g.fillStyle(shade(color, 0.92), 1);
      g.fillRoundedRect(4, S - 40, S - 8, 24, { tl: 0, tr: 0, bl: 22, br: 22 });
      // brillo
      g.fillStyle(0xffffff, 0.45);
      g.fillRoundedRect(16, 12, S - 32, 22, 11);
      g.fillStyle(0xffffff, 0.25);
      g.fillCircle(S - 26, S - 34, 6);
      g.generateTexture(key, S, S);
      g.destroy();
    }
  }

  randomLetter() {
    const pool = this.lv.pool;
    if (this.lv.kind === 'palabra') {
      // las letras de la palabra salen más seguido
      const weighted = [...pool, ...this.lv.word!.split(''), ...this.lv.word!.split('')];
      return weighted[(Math.random() * weighted.length) | 0];
    }
    return pool[(Math.random() * pool.length) | 0];
  }

  makeTile(letter: string, r: number, c: number): Tile {
    const img = this.add.image(0, 0, 'tile-' + this.colorOf(letter).toString(16));
    const t = this.add
      .text(0, -2, letter, {
        fontFamily: this.font,
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: this.lv.cursive ? 'normal' : 'bold',
        stroke: '#00000033',
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 3, color: '#00000055', blur: 2, fill: true },
      })
      .setOrigin(0.5);
    const cont = this.add.container(0, 0, [img, t]).setDepth(5);
    const tile: Tile = { letter, c: cont, r, col: c };
    this.sizeTile(tile);
    return tile;
  }

  sizeTile(t: Tile) {
    const img = t.c.list[0] as Phaser.GameObjects.Image;
    const txt = t.c.list[1] as Phaser.GameObjects.Text;
    img.setDisplaySize(this.cell * 0.94, this.cell * 0.94);
    txt.setFontSize(Math.round(this.cell * (this.lv.cursive ? 0.46 : 0.56)));
    txt.setY(this.lv.cursive ? -this.cell * 0.02 : -this.cell * 0.04);
  }

  pos(r: number, c: number) {
    return { x: this.x0 + c * this.cell + this.cell / 2, y: this.y0 + r * this.cell + this.cell / 2 };
  }

  layout(snap: boolean) {
    const w = this.scale.width;
    const h = this.scale.height;
    const word = this.lv.kind === 'palabra';
    // celular acostado: panel a la izquierda y tablero a toda la altura
    const sideCell = Math.floor(Math.min((h - 24) / N, 96));
    const side = h < 600 && w > h * 1.3 && (w - sideCell * N) / 2 - 24 >= 170;
    let pw: number, panelH: number;
    if (side) {
      this.cell = sideCell;
      this.x0 = Math.round((w - this.cell * N) / 2);
      this.y0 = Math.round((h - this.cell * N) / 2);
      pw = Math.min(260, this.x0 - 24);
      panelH = word ? 170 : 110;
      this.panel.setPosition(12, HUD_TOP + 4);
    } else {
      panelH = word ? 110 : 70;
      const top = HUD_TOP + panelH + 14;
      this.cell = Math.floor(Math.min((w - 24) / N, (h - top - 16) / N, 96));
      this.x0 = Math.round((w - this.cell * N) / 2);
      this.y0 = Math.round(top + (h - top - 16 - this.cell * N) / 2);
      pw = Math.min(w - 24, 520);
      this.panel.setPosition((w - pw) / 2, HUD_TOP + 2);
    }
    // fondo con brillos
    const bg = this.bgG;
    bg.clear();
    bg.fillGradientStyle(0xb79cff, 0xffa8d5, 0x8f7cf0, 0xff9fc0, 1);
    bg.fillRect(0, 0, w, h);
    let sd = 5;
    const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 18; i++) {
      bg.fillStyle(0xffffff, 0.06 + rnd() * 0.1);
      bg.fillCircle(rnd() * w, rnd() * h, 20 + rnd() * 70);
    }
    // marco del tablero
    const b = this.board;
    b.clear();
    const bw = this.cell * N;
    b.fillStyle(0x3a2a7a, 0.35);
    b.fillRoundedRect(this.x0 - 12, this.y0 - 6, bw + 24, bw + 24, 26);
    b.fillStyle(0xffffff, 0.85);
    b.fillRoundedRect(this.x0 - 12, this.y0 - 12, bw + 24, bw + 24, 26);
    b.fillStyle(0xe9e0ff, 1);
    b.fillRoundedRect(this.x0 - 4, this.y0 - 4, bw + 8, bw + 8, 18);
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        b.fillStyle((r + c) % 2 ? 0xdcd0ff : 0xf3eeff, 1);
        b.fillRoundedRect(this.x0 + c * this.cell + 2, this.y0 + r * this.cell + 2, this.cell - 4, this.cell - 4, 12);
      }
    // panel de objetivo
    const pg = this.panelBg;
    pg.clear();
    pg.fillStyle(0x000000, 0.12);
    pg.fillRoundedRect(0, 5, pw, panelH, 22);
    pg.fillStyle(0xffffff, 0.97);
    pg.fillRoundedRect(0, 0, pw, panelH, 22);
    const sw = Math.min(48, (pw - 16) / Math.max(1, this.slots.length));
    let slotY: number;
    if (side) {
      this.goalText.setPosition(16, 30).setFontSize(19);
      pg.fillStyle(0x3a3f6b, 1);
      pg.fillRoundedRect(14, 54, 106, 40, 20);
      this.movesText.setPosition(67, 74);
      slotY = 132;
    } else {
      this.goalText.setPosition(18, 34).setFontSize(22);
      pg.fillStyle(0x3a3f6b, 1);
      pg.fillRoundedRect(pw - 118, 12, 106, 44, 22);
      this.movesText.setPosition(pw - 65, 34);
      slotY = 82;
    }
    const sx0 = (pw - this.slots.length * sw) / 2;
    this.slots.forEach((s, i) => s.setPosition(sx0 + i * sw + sw / 2, slotY));
    if (word) {
      for (let i = 0; i < this.slots.length; i++) {
        pg.lineStyle(3, 0xd9cdb8, 1);
        pg.strokeRoundedRect(sx0 + i * sw + 4, slotY - 20, sw - 8, 40, 10);
      }
    }
    for (const row of this.grid)
      for (const t of row) {
        if (!t) continue;
        this.sizeTile(t);
        if (snap) {
          const p = this.pos(t.r, t.col);
          t.c.setPosition(p.x, p.y);
        }
      }
    this.drawChain();
  }

  updatePanel() {
    if (this.lv.kind === 'tacha') this.goalText.setText(`Tacha ${this.lv.letter}: ${Math.min(this.progress, this.lv.count)}/${this.lv.count}`);
    else this.goalText.setText(`Forma ${this.lv.word}: ${this.progress}/${this.lv.count}`);
    if (this.lv.cursive) this.goalText.setFontFamily(FONT);
    this.movesText.setText(`${this.moves} mov.`);
    this.slots.forEach((s, i) => s.setText(this.chain[i]?.letter || ''));
  }

  tileAt(x: number, y: number): Tile | null {
    const c = Math.floor((x - this.x0) / this.cell);
    const r = Math.floor((y - this.y0) / this.cell);
    if (r < 0 || c < 0 || r >= N || c >= N) return null;
    return this.grid[r][c];
  }

  onDown(p: Phaser.Input.Pointer) {
    this.idle = 0;
    this.clearHint();
    if (this.busy || this.over) return;
    const t = this.tileAt(p.x, p.y);
    if (!t) return;
    this.down = { tile: t, x: p.x, y: p.y, swiped: false };
  }

  onMove(p: Phaser.Input.Pointer) {
    if (!this.down || this.down.swiped || this.busy) return;
    const dx = p.x - this.down.x;
    const dy = p.y - this.down.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.cell * 0.35) return;
    this.down.swiped = true;
    const t = this.down.tile;
    const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
    const r2 = t.r + dr;
    const c2 = t.col + dc;
    if (r2 < 0 || c2 < 0 || r2 >= N || c2 >= N) return;
    this.setSelected(null);
    this.trySwap(t, this.grid[r2][c2]!);
  }

  onUp() {
    const d = this.down;
    this.down = null;
    if (!d || d.swiped || this.busy || this.over) return;
    this.onTap(d.tile);
  }

  setSelected(t: Tile | null) {
    if (this.selected) this.selected.c.setScale(1);
    this.selected = t;
    if (t) t.c.setScale(1.1);
  }

  adjacent(a: Tile, b: Tile, diag: boolean) {
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.col - b.col);
    return diag ? Math.max(dr, dc) === 1 : dr + dc === 1;
  }

  onTap(t: Tile) {
    if (this.lv.kind === 'palabra') return this.chainTap(t);
    // tocar y tocar: intercambio (para mouse)
    if (this.selected && this.selected !== t && this.adjacent(this.selected, t, false)) {
      const a = this.selected;
      this.setSelected(null);
      this.trySwap(a, t);
    } else {
      sfx.tap();
      this.setSelected(this.selected === t ? null : t);
    }
  }

  // ---------- Palabras: cadena de letras adyacentes ----------
  chainTap(t: Tile) {
    const word = this.lv.word!;
    const idx = this.chain.indexOf(t);
    if (idx >= 0) {
      // tocar una ya elegida: la cadena vuelve hasta ahí
      this.chain = this.chain.slice(0, idx);
      sfx.tap();
      this.afterChain();
      return;
    }
    const last = this.chain[this.chain.length - 1];
    const need = word[this.chain.length];
    if (last && !this.adjacent(last, t, true)) {
      // empezar de nuevo desde esta ficha si es la primera letra
      if (t.letter === word[0]) {
        this.chain = [t];
        sfx.pop();
      } else {
        sfx.bad();
        this.wiggle(t);
      }
      this.afterChain();
      return;
    }
    if (t.letter !== need) {
      sfx.bad();
      this.wiggle(t);
      if (!last) say(letterName(word[0]), {}, { raw: true });
      return;
    }
    this.chain.push(t);
    sfx.pop();
    this.afterChain();
    if (this.chain.length === word.length) this.wordFormed();
  }

  afterChain() {
    this.updatePanel();
    this.drawChain();
  }

  drawChain() {
    const g = this.chainG;
    if (!g) return;
    g.clear();
    if (!this.chain.length) return;
    g.lineStyle(this.cell * 0.18, 0xffffff, 0.85);
    g.beginPath();
    this.chain.forEach((t, i) => {
      const p = this.pos(t.r, t.col);
      if (i === 0) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    });
    g.strokePath();
    for (const t of this.chain) {
      const p = this.pos(t.r, t.col);
      g.lineStyle(5, 0x3a3f6b, 1);
      g.strokeRoundedRect(p.x - this.cell * 0.47, p.y - this.cell * 0.47, this.cell * 0.94, this.cell * 0.94, 16);
    }
  }

  async wordFormed() {
    this.busy = true;
    const tiles = this.chain.slice();
    this.chain = [];
    this.progress++;
    this.moves--;
    sfx.good();
    say('crash_palabra_ok', { palabra: this.lv.word! });
    await this.wait(250);
    this.drawChain();
    await this.removeTiles(tiles, true);
    this.updatePanel();
    await this.settle();
    this.checkEnd();
    this.busy = false;
  }

  wiggle(t: Tile) {
    this.tweens.add({ targets: t.c, angle: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => t.c.setAngle(0) });
  }

  // ---------- Intercambio y coincidencias ----------
  async trySwap(a: Tile, b: Tile) {
    if (this.busy || this.over) return;
    this.busy = true;
    if (this.chain.length) {
      this.chain = [];
      this.afterChain();
    }
    await this.swapTiles(a, b);
    const matches = this.findMatches();
    if (!matches.length) {
      sfx.bad();
      await this.swapTiles(a, b);
      this.busy = false;
      return;
    }
    this.moves--;
    this.updatePanel();
    await this.settle();
    this.checkEnd();
    this.busy = false;
  }

  swapTiles(a: Tile, b: Tile) {
    const ar = a.r, ac = a.col;
    a.r = b.r;
    a.col = b.col;
    b.r = ar;
    b.col = ac;
    this.grid[a.r][a.col] = a;
    this.grid[b.r][b.col] = b;
    const pa = this.pos(a.r, a.col);
    const pb = this.pos(b.r, b.col);
    sfx.whoosh();
    return Promise.all([this.tweenTo(a.c, pa.x, pa.y, 160), this.tweenTo(b.c, pb.x, pb.y, 160)]);
  }

  tweenTo(o: Phaser.GameObjects.Container, x: number, y: number, duration: number, ease = 'Quad.easeOut') {
    return new Promise<void>((res) => this.tweens.add({ targets: o, x, y, duration, ease, onComplete: () => res() }));
  }

  wait(ms: number) {
    return new Promise<void>((res) => this.time.delayedCall(ms, res));
  }

  findMatches(): Tile[] {
    const out = new Set<Tile>();
    const g = this.grid;
    for (let r = 0; r < N; r++) {
      let run = 1;
      for (let c = 1; c <= N; c++) {
        if (c < N && g[r][c] && g[r][c - 1] && g[r][c]!.letter === g[r][c - 1]!.letter) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) out.add(g[r][k]!);
          run = 1;
        }
      }
    }
    for (let c = 0; c < N; c++) {
      let run = 1;
      for (let r = 1; r <= N; r++) {
        if (r < N && g[r][c] && g[r - 1][c] && g[r][c]!.letter === g[r - 1][c]!.letter) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) out.add(g[k][c]!);
          run = 1;
        }
      }
    }
    return [...out];
  }

  /** resuelve coincidencias en cascada y rellena */
  async settle(): Promise<void> {
    for (let guard = 0; guard < 20; guard++) {
      const m = this.findMatches();
      if (!m.length) break;
      sfx.pop();
      if (guard >= 1 || m.length >= 4) this.combo(guard, m.length);
      await this.removeTiles(m, false);
      await this.collapse();
    }
    // tras armar palabras también hay que rellenar
    await this.collapse();
    if (this.findMatches().length) return this.settle();
    if (this.lv.kind === 'palabra') this.ensureWord(true);
    else if (!this.findMove()) this.shuffleBoard();
  }

  async removeTiles(tiles: Tile[], word: boolean) {
    const target = this.lv.letter;
    const anims: Promise<void>[] = [];
    for (const t of tiles) {
      if (this.grid[t.r][t.col] === t) this.grid[t.r][t.col] = null;
      const isTarget = this.lv.kind === 'tacha' && t.letter === target;
      if (isTarget) {
        this.progress++;
        // tachar: una cruz sobre la ficha
        const x = this.add.graphics().setDepth(9);
        const s = this.cell * 0.32;
        x.lineStyle(this.cell * 0.12, 0xffffff, 1);
        x.lineBetween(-s, -s, s, s);
        x.lineBetween(-s, s, s, -s);
        x.lineStyle(this.cell * 0.06, 0xe63946, 1);
        x.lineBetween(-s, -s, s, s);
        x.lineBetween(-s, s, s, -s);
        x.setPosition(t.c.x, t.c.y);
        this.tweens.add({ targets: x, alpha: 0, delay: 350, duration: 300, onComplete: () => x.destroy() });
      }
      anims.push(
        new Promise((res) =>
          this.tweens.add({
            targets: t.c,
            scale: word ? 1.3 : 0,
            alpha: 0,
            delay: isTarget ? 250 : 0,
            duration: word ? 450 : 260,
            ease: 'Back.easeIn',
            onComplete: () => {
              t.c.destroy();
              res();
            },
          })
        )
      );
      this.burst(t.c.x, t.c.y, this.colorOf(t.letter));
    }
    this.updatePanel();
    await Promise.all(anims);
  }

  combo(level: number, n: number) {
    const words = ['¡Bien!', '¡Genial!', '¡Súper!', '¡Increíble!', '¡Fantástico!'];
    const txt = words[Math.min(words.length - 1, level + (n >= 5 ? 1 : 0))];
    const t = this.add
      .text(this.x0 + (this.cell * N) / 2, this.y0 + (this.cell * N) / 2, txt, {
        fontFamily: FONT, fontSize: `${Math.round(this.cell * 0.9)}px`, color: '#ffffff', fontStyle: 'bold', stroke: '#7a3cff', strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 6, color: '#00000055', blur: 6, fill: true, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - this.cell, delay: 650, duration: 400, onComplete: () => t.destroy() });
    sfx.good();
  }

  burst(x: number, y: number, color: number) {
    const ring = this.add.circle(x, y, this.cell * 0.3).setStrokeStyle(4, 0xffffff, 0.9).setDepth(7);
    this.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
    for (let i = 0; i < 8; i++) {
      const d = this.add.star(x, y, 5, this.cell * 0.04, this.cell * 0.09, i % 2 ? 0xffffff : color).setDepth(7);
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({ targets: d, x: x + Math.cos(a) * this.cell * 0.8, y: y + Math.sin(a) * this.cell * 0.8, alpha: 0, duration: 420, onComplete: () => d.destroy() });
    }
  }

  async collapse() {
    const anims: Promise<void>[] = [];
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        const t = this.grid[r][c];
        if (t) {
          if (write !== r) {
            this.grid[write][c] = t;
            this.grid[r][c] = null;
            t.r = write;
            const p = this.pos(write, c);
            anims.push(this.tweenTo(t.c, p.x, p.y, 120 + (write - r) * 45, 'Bounce.easeOut'));
          }
          write--;
        }
      }
      for (let r = write; r >= 0; r--) {
        const t = this.makeTile(this.randomLetter(), r, c);
        this.grid[r][c] = t;
        const p = this.pos(r, c);
        t.c.setPosition(p.x, this.y0 - (write - r + 1) * this.cell);
        anims.push(this.tweenTo(t.c, p.x, p.y, 160 + (write + 1) * 45, 'Bounce.easeOut'));
      }
    }
    await Promise.all(anims);
  }

  /** ¿existe algún intercambio que forme 3? */
  findMove(): [Tile, Tile] | null {
    const g = this.grid;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const r2 = r + dr;
          const c2 = c + dc;
          if (r2 >= N || c2 >= N) continue;
          const a = g[r][c]!;
          const b = g[r2][c2]!;
          g[r][c] = b;
          g[r2][c2] = a;
          const ok = this.findMatches().length > 0;
          g[r][c] = a;
          g[r2][c2] = b;
          if (ok) return [a, b];
        }
    return null;
  }

  shuffleBoard() {
    for (let tries = 0; tries < 30; tries++) {
      const letters = this.grid.flat().map((t) => t!.letter);
      for (let i = letters.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      this.grid.flat().forEach((t, i) => this.setLetter(t!, letters[i]));
      if (!this.findMatches().length && this.findMove()) return;
    }
  }

  setLetter(t: Tile, letter: string) {
    t.letter = letter;
    (t.c.list[0] as Phaser.GameObjects.Image).setTexture('tile-' + this.colorOf(letter).toString(16));
    this.sizeTile(t);
    (t.c.list[1] as Phaser.GameObjects.Text).setText(letter);
  }

  /** busca un camino de letras adyacentes (8 vecinos) que forme la palabra */
  findWordPath(): Tile[] | null {
    const word = this.lv.word!;
    const g = this.grid;
    const dfs = (path: Tile[]): Tile[] | null => {
      if (path.length === word.length) return path;
      const last = path[path.length - 1];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const r = last.r + dr;
          const c = last.col + dc;
          if (r < 0 || c < 0 || r >= N || c >= N) continue;
          const t = g[r][c]!;
          if (t.letter === word[path.length] && !path.includes(t)) {
            const res = dfs([...path, t]);
            if (res) return res;
          }
        }
      return null;
    };
    for (const row of g) for (const t of row) if (t && t.letter === word[0]) {
      const res = dfs([t]);
      if (res) return res;
    }
    return null;
  }

  /** garantiza que la palabra se pueda formar en el tablero */
  ensureWord(animate = false) {
    if (this.findWordPath()) return;
    const word = this.lv.word!;
    for (let tries = 0; tries < 50; tries++) {
      let r = (Math.random() * N) | 0;
      let c = (Math.random() * N) | 0;
      const path: [number, number][] = [[r, c]];
      let ok = true;
      for (let i = 1; i < word.length && ok; i++) {
        const opts: [number, number][] = [];
        for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1]]) {
          const r2 = r + dr, c2 = c + dc;
          if (r2 >= 0 && c2 >= 0 && r2 < N && c2 < N && !path.some(([a, b]) => a === r2 && b === c2)) opts.push([r2, c2]);
        }
        if (!opts.length) ok = false;
        else {
          [r, c] = opts[(Math.random() * opts.length) | 0];
          path.push([r, c]);
        }
      }
      if (!ok) continue;
      path.forEach(([pr, pc], i) => {
        const t = this.grid[pr][pc]!;
        this.setLetter(t, word[i]);
        if (animate) this.tweens.add({ targets: t.c, scale: { from: 0.6, to: 1 }, duration: 250, ease: 'Back.easeOut' });
      });
      if (!this.findMatches().length) return;
    }
  }

  checkEnd() {
    if (this.over) return;
    if (this.progress >= this.lv.count) {
      this.over = true;
      const ratio = this.moves / (this.lv.moves + (this.ctx.easy ? 6 : 0));
      const stars = ratio >= 0.4 ? 3 : ratio >= 0.15 ? 2 : 1;
      sfx.win();
      this.time.delayedCall(700, () => this.ctx.complete(stars));
      return;
    }
    if (this.moves <= 0) {
      this.over = true;
      sfx.bad();
      say('crash_sin_movs');
      this.showRetry();
    }
  }

  showRetry() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x282c50, 0.55).setDepth(40).setInteractive();
    const box = this.add.graphics().setDepth(41);
    box.fillStyle(0xffffff, 1);
    box.fillRoundedRect(w / 2 - 170, h / 2 - 110, 340, 220, 26);
    const t = this.add.text(w / 2, h / 2 - 50, '¡Se acabaron\nlos movimientos!', { fontFamily: FONT, fontSize: '28px', color: '#3a3f6b', align: 'center', fontStyle: 'bold' }).setOrigin(0.5).setDepth(42);
    const btn = this.add.graphics().setDepth(42);
    btn.fillStyle(0x4cc38a, 1);
    btn.fillRoundedRect(w / 2 - 130, h / 2 + 20, 260, 66, 33);
    const bt = this.add.text(w / 2, h / 2 + 53, 'Intentar otra vez', { fontFamily: FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(43);
    const zone = this.add.zone(w / 2, h / 2 + 53, 260, 66).setInteractive({ useHandCursor: true }).setDepth(44);
    zone.on('pointerup', () => {
      sfx.tap();
      [bg, box, t, btn, bt, zone].forEach((o) => o.destroy());
      this.scene.restart({ ctx: this.ctx });
    });
  }

  clearHint() {
    this.hintTiles.forEach((t) => {
      this.tweens.killTweensOf(t.c);
      t.c.setScale(t === this.selected ? 1.1 : 1);
    });
    this.hintTiles = [];
  }

  update(_t: number, dt: number) {
    if (this.busy || this.over) return;
    this.idle += dt;
    // pista después de un rato sin jugar (antes en 3-5 años)
    if (this.idle > (this.ctx.easy ? 5000 : 9000) && !this.hintTiles.length) {
      let tiles: Tile[] = [];
      if (this.lv.kind === 'palabra') tiles = this.findWordPath()?.slice(this.chain.length ? 99 : 0, 1) || [];
      else {
        const mv = this.findMove();
        if (mv) tiles = mv;
      }
      this.hintTiles = tiles;
      tiles.forEach((t) => this.tweens.add({ targets: t.c, scale: 1.15, yoyo: true, repeat: -1, duration: 380 }));
    }
  }
}

export function start(ctx: GameContext): GameInstance {
  let game: Phaser.Game | null = null;
  let dead = false;
  fontsReady().then(() => {
    if (dead) return;
    game = createGame(ctx.host, 'crash', new CrashScene(), { ctx }, { backgroundColor: '#e9e1ff' });
  });
  return {
    destroy() {
      dead = true;
      game?.destroy(true);
    },
  };
}
