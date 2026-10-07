// Regresiones de controles reales y capturas para revisar legibilidad.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL('../reports/qa-2026-10-07/', import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const errors = [];
const results = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => { errors.push(e.message); console.error(e.stack); });
await page.addInitScript(() => {
  localStorage.setItem('mp:settings', JSON.stringify({ unlocked: true, sound: false, voice: false, device: 'desktop', dailyLimitMin: 0, activeProfile: 'qa' }));
  localStorage.setItem('mp:profiles', JSON.stringify([{ id: 'qa', name: 'Sofía', avatar: 1, age: '6-8', createdAt: 1 }]));
});
const go = async (game, level = 0) => {
  console.log('Probando', game, level);
  await page.evaluate(([game, level]) => { window.__scene = null; window.__craft = null; window.mpGo('play', { game, level }); }, [game, level]);
  await page.waitForFunction(game => game === 'craft' ? !!window.__craft : !!window.__scene?.sys?.isActive(), game);
  await page.waitForTimeout(2400);
};
try {
  await page.goto('http://localhost:4173/?debug&rec');
  await page.waitForFunction(() => window.mpGo);
  await go('craft', 6);
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => window.__craft.player.flying), true);
  const y = await page.evaluate(() => window.__craft.player.pos.y);
  await page.keyboard.down('Space'); await page.waitForTimeout(650); await page.keyboard.up('Space');
  assert.ok(await page.evaluate(y => window.__craft.player.pos.y > y + 1, y));
  const y2 = await page.evaluate(() => window.__craft.player.pos.y);
  await page.keyboard.down('Shift'); await page.waitForTimeout(350); await page.keyboard.up('Shift');
  assert.ok(await page.evaluate(y => window.__craft.player.pos.y < y - 0.5, y2));
  results.push('Montecraft: doble espacio activa vuelo; espacio sube y Shift baja');
  await page.mouse.click(720, 400);
  await page.waitForTimeout(500);
  const locked = await page.evaluate(() => !!document.pointerLockElement);
  const yaw = await page.evaluate(() => window.__craft.player.yaw);
  if (locked) await page.mouse.move(800, 400);
  else {
    await page.mouse.move(720,400); await page.mouse.down();
    await page.mouse.move(800,400,{steps:8}); await page.mouse.up();
  }
  assert.notEqual(await page.evaluate(() => window.__craft.player.yaw), yaw);
  results.push(locked ? 'Captura nativa del mouse verificada' : 'Captura nativa rechazada en headless; alternativa de arrastre verificada');
  await page.mouse.dblclick(800, 400, { delay: 80 });
  assert.equal(await page.evaluate(() => window.__craft.player.flying), false);
  await page.keyboard.press('e');
  await page.waitForFunction(() => !document.pointerLockElement);
  assert.equal(await page.locator('.mc-inv').isVisible(), true);
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  results.push('Montecraft: giro, doble clic y apertura del inventario');
  await page.screenshot({ path: new URL('craft-desktop.png', out).pathname });
  await go('ninja');
  const n = await page.evaluate(() => window.__scene.pieces.filter(p => p.alive).length);
  assert.equal(n, 1);
  await page.waitForFunction(() => window.__scene.pieces.some(p => p.y < window.innerHeight - p.r));
  await page.mouse.move(500, 400); await page.mouse.down();
  const py = await page.evaluate(() => window.__scene.pieces[0].y);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__scene.pieces[0].y), py);
  await page.mouse.up();
  await page.waitForTimeout(800);
  // Dibujar una plantilla real mediante eventos del mouse (multi-trazo).
  const strokes = await page.evaluate(() => window.__LETTERS[window.__scene.keyOf(window.__scene.target)]);
  for (const st of strokes) {
    await page.mouse.move(520 + st[0].x * 2, 300 + st[0].y * 2); await page.mouse.down();
    for (const p of st) await page.mouse.move(520 + p.x * 2, 300 + p.y * 2);
    await page.mouse.up();
  }
  await page.waitForFunction(() => window.__scene.good === 1);
  results.push('Ninja: comienza con una letra, espera al dibujar y acepta un trazo real');
  await page.getByRole('button', { name: 'Cómo se juega', exact: true }).click();
  await page.waitForFunction(() => window.__scene.sys.isPaused());
  await page.getByRole('button', { name: 'Seguir jugando' }).click();
  await page.waitForFunction(() => window.__scene.sys.isActive());
  results.push('Ayuda: pausa y reanuda la escena');
  await page.waitForTimeout(2200);
  await page.waitForFunction(() => window.__scene.pieces.some(p => p.alive && p.y < window.innerHeight * 0.8));
  await page.screenshot({ path: new URL('ninja-desktop.png', out).pathname });
  await go('crash');
  const move = await page.evaluate(() => window.__scene.findMove().map(t => ({ x: t.c.x, y: t.c.y })));
  const before = await page.evaluate(() => window.__scene.moves);
  for (const p of move) await page.mouse.click(p.x, p.y);
  await page.waitForFunction(before => window.__scene.moves === before - 1 && !window.__scene.busy, before);
  results.push('CaliCrash: tocar dos vecinas que forman tres resuelve el intercambio');
  // Par sin coincidencia: devuelve las fichas y explica el motivo sin gastar.
  const bad = await page.evaluate(() => {
    const s = window.__scene;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) {
      const a = s.grid[r][c], b = s.grid[r][c + 1];
      s.grid[r][c] = b; s.grid[r][c+1] = a;
      const ok = s.findMatches().length;
      s.grid[r][c] = a; s.grid[r][c+1] = b;
      if (!ok) return [a,b].map(t => ({ x: t.c.x, y: t.c.y }));
    }
  });
  for (const p of bad) await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => !window.__scene.busy);
  assert.equal(await page.evaluate(() => window.__scene.moves), before - 1);
  assert.match(await page.evaluate(() => window.__scene.helpText.text), /3 iguales/);
  await page.screenshot({ path: new URL('crash-desktop.png', out).pathname });
  results.push('CaliCrash: intercambio inválido tiene explicación y no gasta movimientos');
  await go('crash', 2);
  const path = await page.evaluate(() => window.__scene.findWordPath().map(t => ({ x: t.c.x, y: t.c.y })));
  await page.mouse.move(path[0].x, path[0].y); await page.mouse.down();
  for (const p of path.slice(1)) await page.mouse.move(p.x, p.y, { steps: 1 });
  await page.mouse.up();
  await page.waitForFunction(() => window.__scene.progress === 1 && !window.__scene.busy);
  results.push('CaliCrash: arrastrar por S → O → L forma la palabra');
  await go('angry');
  assert.equal(await page.evaluate(() => window.__scene.targetsLeft()), 3);
  assert.match(await page.evaluate(() => window.__scene.objectiveText.text), /aro dorado/);
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__scene.targetsLeft()), 3);
  const a = await page.evaluate(() => ({ ...window.__scene.anchor, u: window.__scene.U }));
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  await page.mouse.move(a.x - a.u * 2.7, a.y + a.u * 1.5, { steps: 12 });
  await page.screenshot({ path: new URL('angry-aim-desktop.png', out).pathname });
  await page.mouse.up();
  assert.equal(await page.evaluate(() => window.__scene.shotsUsed), 1);
  await page.waitForTimeout(7000);
  const left = await page.evaluate(() => window.__scene.targetsLeft());
  assert.ok(left < 3, `el tiro de prueba no derribó objetivos (${left})`);
  results.push(`Angry Forms: objetivos visibles y un lanzamiento real derriba ${3-left}`);
  for (const [w,h] of [[844,390], [390,844], [1024,768]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const game of ['ninja','crash','angry','craft']) {
      await go(game, game === 'craft' ? 6 : 0);
      if (game === 'ninja') await page.waitForFunction(() => window.__scene.pieces.some(p => p.alive && p.y < window.innerHeight * 0.8));
      await page.screenshot({ path: new URL(`${game}-${w}x${h}.png`, out).pathname });
    }
  }
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  console.log('Sin errores de JavaScript. Capturas guardadas en reports/qa-2026-10-07/.');
  await writeFile(new URL('resultados.json', out), JSON.stringify({ results, errors }, null, 2));
} finally { await browser.close(); }
