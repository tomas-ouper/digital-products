// Monta el tráiler 9:16 a partir de los planos de media/clips/ + placas + música original.
// Uso: node scripts/clips/trailer.mjs   (después de grabar los planos con planos.mjs)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VT = readFileSync(join(HERE, 'vt.js'), 'utf8');
const PLACAS = pathToFileURL(resolve(HERE, 'placas.html')).href;
const CLIPS = 'media/clips';
const TMP = 'media/.trailer-tmp';
const OUT = 'media/trailer-montessori-play-9x16.mp4';
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

// Guion de edición: [clip, inicio(s), duración(s), rótulo opcional]
const SUPER = {
  snake: { n: 'Snake Lecto', c: '#34b56d', t: 'Escribe letras<br>con la viborita', s: 'imprenta · mayúscula · cursiva' },
  ninja: { n: 'Trazo Ninja', c: '#7a5ad6', t: 'Dibuja la letra<br>para cortarla', s: 'vocales · sílabas · cursiva' },
  crash: { n: 'CaliCrash', c: '#e9602f', t: 'Junta letras y<br>forma palabras', s: '10 niveles' },
  angry: { n: 'Angry Forms', c: '#3f6fd6', t: 'Lanza formas,<br>aprende geometría', s: 'círculo · triángulo · rombo · estrella' },
  craft: { n: 'Montecraft', c: '#e0a300', t: 'Construye letras<br>en 3D', s: 'tu nombre · colores · contar' },
};
const EDL = [
  ['@intro', 0, 3.2],
  ['plataforma-1-hub', 0.6, 2.0],
  ['snake-2-seguimiento-M', 0.4, 2.4, 'snake'],
  ['snake-1-cenital-letra-a', 1.6, 1.9],
  ['snake-3-final-camara-lenta', 1.2, 2.4],
  ['ninja-2-corte-camara-lenta', 0.3, 2.8, 'ninja'],
  ['ninja-1-vocales', 0.6, 2.0],
  ['ninja-5-cursiva', 0.8, 1.9],
  ['calicrash-2-combo-acercamiento', 0.2, 2.6, 'crash'],
  ['calicrash-1-tablero', 0.4, 2.0],
  ['calicrash-4-cursiva-casa', 0.2, 2.0],
  ['angry-1-tension-y-disparo', 0.4, 2.8, 'angry'],
  ['angry-2-impacto-camara-lenta', 0.0, 2.5],
  ['angry-3-elige-la-forma', 0.3, 2.0],
  ['montecraft-1-vuelo-aereo', 0.3, 2.6, 'craft'],
  ['montecraft-2-primera-persona-letra', 0.8, 2.2],
  ['montecraft-3-torre-timelapse', 0.6, 2.6],
  ['montecraft-4-contrapicado-nombre', 1.4, 2.4],
  ['plataforma-3-estrellas', 2.4, 1.9],
  ['@fin', 0, 4.2],
];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
async function placaVideo(kind, secs, out) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await page.addInitScript(VT);
  await page.goto(`${PLACAS}#k=${kind}`);
  await page.evaluate(() => document.fonts.ready);
  const dir = join(TMP, kind);
  mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const n = Math.round(secs * 30);
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => window.__vt.step(1000 / 30));
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93 });
    writeFileSync(join(dir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(r.data, 'base64'));
  }
  await page.close();
  ff(['-framerate', '30', '-i', join(dir, 'f%05d.jpg'), '-vf', 'scale=1080:1920,format=yuv420p', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-r', '30', out]);
}
async function superPng(key, out) {
  const s = SUPER[key];
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const q = new URLSearchParams({ k: 'super', n: s.n, c: s.c, t: s.t, s: s.s }).toString();
  await page.goto(`${PLACAS}#${q}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
}

const segs = [];
let total = 0;
for (const [i, [clip, start, dur, sup]] of EDL.entries()) {
  const seg = join(TMP, `s${String(i).padStart(2, '0')}.mp4`);
  if (clip.startsWith('@')) {
    await placaVideo(clip.slice(1), dur, seg);
  } else {
    const src = join(CLIPS, clip + '.mp4');
    if (!existsSync(src)) {
      console.log('falta', src);
      continue;
    }
    const flash = sup ? `,fade=t=in:st=0:d=0.18:color=white` : '';
    if (sup) {
      const png = join(TMP, `sup-${sup}.png`);
      await superPng(sup, png);
      ff([
        '-ss', String(start), '-t', String(dur), '-i', src, '-loop', '1', '-t', String(dur), '-i', png,
        '-filter_complex', `[0:v]scale=1080:1920,setsar=1,fps=30${flash}[v];[1:v]format=rgba,fade=t=in:st=0.1:d=0.25:alpha=1,fade=t=out:st=${(dur - 0.3).toFixed(2)}:d=0.25:alpha=1[o];[v][o]overlay=0:0:shortest=1,format=yuv420p`,
        '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-r', '30', '-an', seg,
      ]);
    } else {
      ff(['-ss', String(start), '-t', String(dur), '-i', src, '-vf', 'scale=1080:1920,setsar=1,fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-r', '30', '-an', seg]);
    }
  }
  segs.push(seg);
  total += dur;
  console.log('segmento', i, clip);
}
await browser.close();

writeFileSync(join(TMP, 'list.txt'), segs.map((s) => `file '${resolve(s)}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', join(TMP, 'list.txt'), '-c', 'copy', join(TMP, 'video.mp4')]);
execFileSync('node', [join(HERE, 'musica.mjs'), join(TMP, 'musica.wav'), String(Math.ceil(total + 1))]);
ff(['-i', join(TMP, 'video.mp4'), '-i', join(TMP, 'musica.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-af', `afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5`, '-shortest', '-movflags', '+faststart', OUT]);
rmSync(TMP, { recursive: true, force: true });
console.log('tráiler:', OUT, total.toFixed(1) + 's');
