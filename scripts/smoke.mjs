// Prueba de humo: abre las pantallas y todos los niveles de los 5 juegos en los 4 tamaños
// y reporta errores de consola, desbordes horizontales y juegos que no arrancan.
// Uso: npm run build && npm run preview (otra terminal) && npm run smoke
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL || 'http://localhost:4173/?debug&rec';
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

for (const [w, hgt] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: hgt }, hasTouch: true });
  let errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.addInitScript(() => {
    localStorage.setItem('mp:settings', JSON.stringify({ unlocked: true, sound: false, voice: false, device: 'tablet', dailyLimitMin: 0, activeProfile: 'p1' }));
    localStorage.setItem('mp:profiles', JSON.stringify([{ id: 'p1', name: 'Sofía', avatar: 1, age: '6-8', createdAt: 1 }]));
  });
  await page.goto(URL);
  await page.waitForFunction(() => typeof window.mpGo === 'function');

  const check = async (label) => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) problems.push(`${w}x${hgt} ${label}: desborde horizontal de ${over}px`);
    for (const e of errs) problems.push(`${w}x${hgt} ${label}: ${e}`);
    errs = [];
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

await browser.close();
if (problems.length) {
  console.log(`\n${problems.length} problemas:`);
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log('\nSin errores.');
