// Toma cinematográfica con reloj virtual: cada cuadro se avanza y se captura a mano (30 fps exactos).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VT = readFileSync(join(HERE, 'vt.js'), 'utf8');
// 9:16 vertical: 540x960 lógicos a escala 2 = 1080x1920
export const VW = 540;
export const VH = 960;
export const DSF = 2;
const OW = VW * DSF;
const OH = VH * DSF;
const FPS = 30;
const FRAME = 1000 / FPS;

const FINGER = `
addEventListener('DOMContentLoaded', () => {
  const d = document.createElement('div');
  d.id = 'rec-finger';
  d.style.cssText = 'position:fixed;left:-100px;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.5);border:3px solid #fff;box-shadow:0 3px 14px rgba(0,0,0,.35);pointer-events:none;z-index:99999;opacity:0';
  document.body.appendChild(d);
  const mv = (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; };
  addEventListener('pointermove', mv, true);
  addEventListener('pointerdown', (e) => { mv(e); d.style.transform = 'scale(.78)'; d.style.background = 'rgba(255,255,255,.85)'; }, true);
  addEventListener('pointerup', () => { d.style.transform = ''; d.style.background = 'rgba(255,255,255,.5)'; }, true);
});`;

export async function launch() {
  return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
}

export class Shot {
  constructor(browser, name) {
    this.browser = browser;
    this.name = name;
    this.frames = 0;
    this.speed = 1; // 0.25 = cámara lenta x4
    this.cam = null; // función (i) => estado de cámara
    this.capturing = false;
    this.dir = join('media', 'clips', '.tmp-' + name);
  }

  async open({ age = '6-8', name = 'Sofía', stars = null, finger = true, query = '' } = {}) {
    this.page = await this.browser.newPage({ viewport: { width: VW, height: VH }, screen: { width: VW, height: VH }, deviceScaleFactor: DSF, hasTouch: true });
    const p = this.page;
    this.errs = [];
    p.on('pageerror', (e) => this.errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && this.errs.push(m.text()));
    await p.addInitScript(VT);
    if (finger) await p.addInitScript(FINGER);
    await p.addInitScript(
      ([age, name, stars]) => {
        localStorage.setItem('mp:settings', JSON.stringify({ unlocked: true, sound: false, voice: false, device: 'tablet', dailyLimitMin: 0, activeProfile: 'p1' }));
        localStorage.setItem('mp:profiles', JSON.stringify([{ id: 'p1', name, avatar: 1, age, createdAt: 1 }, { id: 'p2', name: 'Mateo', avatar: 4, age: '3-5', createdAt: 2 }]));
        if (stars) localStorage.setItem('mp:data:p1', JSON.stringify({ stars, playLog: {}, letters: { a: 2, e: 1, m: 1, L: 1, O: 1, s: 1, 'c:a': 1, 'c:e': 1 }, missionsDone: {}, bonusMin: {} }));
      },
      [age, name, stars]
    );
    await p.goto('http://localhost:4173/?debug&rec' + query);
    this.cdp = await p.context().newCDPSession(p);
    rmSync(this.dir, { recursive: true, force: true });
    mkdirSync(this.dir, { recursive: true });
    await this.skip(500);
    return this;
  }

  go(screen, params = {}) {
    return this.page.evaluate(([s, pr]) => window.mpGo(s, pr), [screen, params]);
  }

  /** un cuadro: cámara + reloj + (captura) */
  async frame() {
    const cam = this.cam ? this.cam(this.frames) : null;
    await this.page.evaluate(
      ([ms, cam]) => {
        if (window.__drive) window.__drive();
        if (cam && window.__camFn) window.__camFn(cam);
        window.__vt.step(ms);
      },
      [FRAME * this.speed, cam]
    );
    if (this.capturing) {
      const r = await this.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
      writeFileSync(join(this.dir, `f${String(this.frames).padStart(5, '0')}.jpg`), Buffer.from(r.data, 'base64'));
      this.frames++;
    }
  }

  /** avanza tiempo de juego sin grabar */
  async skip(gameMs) {
    const was = this.capturing;
    this.capturing = false;
    const s = this.speed;
    this.speed = 1;
    for (let t = 0; t < gameMs; t += FRAME) await this.frame();
    this.speed = s;
    this.capturing = was;
  }

  /** avanza cuadros (sin grabar) hasta que se cumpla la condición en la página */
  async until(fn, arg, maxReal = 30000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxReal) {
      if (await this.page.evaluate(fn, arg)) return true;
      const was = this.capturing;
      this.capturing = false;
      await this.frame();
      this.capturing = was;
      await new Promise((r) => setTimeout(r, 15));
    }
    throw new Error('timeout esperando condición en ' + this.name);
  }

  /** graba `outMs` de video a la velocidad actual */
  async roll(outMs) {
    this.capturing = true;
    for (let t = 0; t < outMs; t += FRAME) await this.frame();
  }

  async wait(outMs) {
    if (this.capturing) await this.roll(outMs);
    else await this.skip(outMs);
  }

  record() {
    this.capturing = true;
  }

  /** mueve el puntero por una lista de puntos, un cuadro por punto */
  async path(pts, { down = true, every = 1 } = {}) {
    const m = this.page.mouse;
    await m.move(pts[0][0], pts[0][1]);
    if (down) await m.down();
    for (let i = 0; i < pts.length; i++) {
      await m.move(pts[i][0], pts[i][1]);
      if (i % every === 0) await this.frame();
    }
    if (down) await m.up();
  }

  async moveTo(x, y, frames = 10) {
    const m = this.page.mouse;
    const from = this.last || [VW / 2, VH * 0.8];
    for (let i = 1; i <= frames; i++) {
      const k = i / frames;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      await m.move(from[0] + (x - from[0]) * e, from[1] + (y - from[1]) * e);
      await this.frame();
    }
    this.last = [x, y];
  }

  async tap(x, y, frames = 10) {
    await this.moveTo(x, y, frames);
    await this.page.mouse.down();
    await this.frame();
    await this.frame();
    await this.page.mouse.up();
    await this.frame();
  }

  /** arma el mp4. zoom: [{t (0..1), z, x, y (0..1 centro)}] para empujes de cámara en post */
  finish(out, { zoom = null } = {}) {
    let vf = `scale=${OW}:${OH}:flags=lanczos`;
    if (zoom) {
      const n = this.frames;
      const lerp = (key) => {
        // expresión por tramos lineales con suavizado
        let e = String(zoom[zoom.length - 1][key]);
        for (let i = zoom.length - 2; i >= 0; i--) {
          const a = zoom[i], b = zoom[i + 1];
          const fa = Math.round(a.t * n), fb = Math.round(b.t * n);
          const k = `((on-${fa})/${Math.max(1, fb - fa)})`;
          const s = `(${k}*${k}*(3-2*${k}))`;
          e = `if(lt(on,${fb}),${a[key]}+(${b[key]}-${a[key]})*${s},${e})`;
          if (i === 0) e = `if(lt(on,${fa}),${a[key]},${e})`;
        }
        return e;
      };
      const z = lerp('z');
      vf = `scale=${OW * 2}:${OH * 2}:flags=lanczos,zoompan=z='${z}':x='(${lerp('x')})*iw-iw/zoom/2':y='(${lerp('y')})*ih-ih/zoom/2':d=1:s=${OW}x${OH}:fps=30`;
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', join(this.dir, 'f%05d.jpg'), '-vf', vf + ',format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out]);
    return this.frames;
  }

  /** plano limpio: oculta HUD, dedo y controles */
  clean(on = true) {
    return this.page.evaluate((on) => document.body.classList.toggle('rec-clean', on), on);
  }

  async close() {
    await this.page.close();
    rmSync(this.dir, { recursive: true, force: true });
  }
}
