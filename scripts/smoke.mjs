// Prueba de humo: abre las pantallas y todos los niveles de los 5 juegos en los 4 tamaños,
// en español (/), en inglés (/en/) y en francés (/fr/), y reporta errores de consola, desbordes horizontales,
// juegos que no arrancan, en inglés texto que quedó en español y en francés texto que quedó en español o en inglés.
// Uso: npm run build && npm run preview (otra terminal) && npm run smoke
// SMOKE_URL cambia la dirección base; SMOKE_LANGS=es, en o fr recorre un solo idioma.
import { chromium } from 'playwright';

const BASE = (process.env.SMOKE_URL || 'http://localhost:4173/').replace(/\?.*$/, '').replace(/\/?$/, '/');
const LANGS = (process.env.SMOKE_LANGS || 'es,en,fr').split(',');
// Palabras que delatan español en la versión en inglés (se ignora el nombre "Tomás" del soporte).
const SPANISH = /[áéíóúñ¿¡]|\b(el|la|los|las|del|que|con|para|una|letra|letras|nivel|niveles|toca|elige|arrastra|juega|jugar|tiempo|padres|bloques|derriba|lanza|forma|tacha|cursiva|perfil|volar)\b/i;
// En francés: letras y palabras que no existen en francés (español) y palabras inglesas comunes.
// Se ignoran "Tomás" (soporte) y "Montessori Play" (marca).
const NOT_FRENCH = /[áíóúñ¿¡]|\b(el|los|las|del|para|una|letra|letras|nivel|niveles|toca|elige|arrastra|juega|jugar|tiempo|padres|bloques|derriba|lanza|forma|tacha|cursiva|perfil|volar|the|and|you|your|level|levels|letter|letters|pick|throw|draw|tap|drag|shapes|blocks|time|with|again|done|back)\b/i;
const SIZES = [
  [390, 844],
  [844, 390],
  [1024, 768],
  [1440, 900],
];
const GAMES = { snake: 17, ninja: 6, crash: 10, angry: 8, craft: 7 };
const SCREENS = ['hub', 'profiles', 'device', 'parents', 'mission'];

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const problems = [];

for (const lang of LANGS) {
  const en = lang === 'en';
  const fr = lang === 'fr';
  const URL = BASE + (lang === 'es' ? '' : lang + '/') + '?debug&rec';
  const P = lang === 'es' ? 'mp:' : `mp-${lang}:`;
  for (const [w0, hgt] of SIZES) {
    const w = `${lang} ${w0}`;
    const page = await browser.newPage({ viewport: { width: w0, height: hgt }, hasTouch: true });
    let errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await page.addInitScript(([P, name]) => {
      localStorage.setItem(P + 'settings', JSON.stringify({ unlocked: true, sound: false, voice: false, device: 'tablet', dailyLimitMin: 0, activeProfile: 'p1' }));
      localStorage.setItem(P + 'profiles', JSON.stringify([{ id: 'p1', name, avatar: 1, age: '6-8', createdAt: 1 }]));
    }, [P, fr ? 'Chloé' : en ? 'Sophie' : 'Sofía']);
    await page.goto(URL);
    await page.waitForFunction(() => typeof window.mpGo === 'function');

    const check = async (label) => {
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 1) problems.push(`${w}x${hgt} ${label}: desborde horizontal de ${over}px`);
      for (const e of errs) problems.push(`${w}x${hgt} ${label}: ${e}`);
      errs = [];
      if (en || fr) {
        // Texto del DOM + textos de la escena Phaser activa (se dibujan en canvas).
        const texts = await page.evaluate(() => {
          const out = [document.body.innerText];
          const sc = window.__scene;
          if (sc && sc.children) for (const o of sc.children.list) if (typeof o.text === 'string') out.push(o.text);
          return out.join('\n');
        });
        for (const line of texts.replace(/Tomás/g, 'Tomas').replace(/Montessori Play/g, 'Montessori').split('\n')) {
          if (en && SPANISH.test(line)) problems.push(`${w}x${hgt} ${label}: ¿español? «${line.trim().slice(0, 90)}»`);
          if (fr && NOT_FRENCH.test(line)) problems.push(`${w}x${hgt} ${label}: ¿no es francés? «${line.trim().slice(0, 90)}»`);
        }
      }
    };

    for (const s of SCREENS) {
      await page.evaluate((s) => window.mpGo(s, {}), s);
      await page.waitForTimeout(250);
      await check(s);
    }
    for (const [game, n] of Object.entries(GAMES)) {
      await page.evaluate((g) => window.mpGo('levels', { game: g }), game);
      await page.waitForTimeout(200);
      await check(`niveles ${game}`);
      for (let level = 0; level < n; level++) {
        await page.evaluate(([g, l]) => {
          window.__scene = null;
          window.__craft = null;
          window.mpGo('play', { game: g, level: l });
        }, [game, level]);
        const ok = await page
          .waitForFunction((g) => (g === 'craft' ? !!window.__craft : !!(window.__scene && window.__scene.sys && window.__scene.sys.isActive())), game, { timeout: 15000 })
          .then(() => true)
          .catch(() => false);
        await page.waitForTimeout(game === 'craft' ? 600 : 300);
        if (!ok) problems.push(`${w}x${hgt} ${game} nivel ${level + 1}: no arrancó en 15 s`);
        await check(`${game} nivel ${level + 1}`);
      }
    }
    await page.evaluate(() => window.mpGo('hub', {}));
    await page.close();
    console.log(`✓ ${w}x${hgt} recorrido`);
  }
}

await browser.close();
if (problems.length) {
  console.log(`\n${problems.length} problemas:`);
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log('\nSin errores.');
