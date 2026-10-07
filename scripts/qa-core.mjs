import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
function moduleAt(path, deps, globals) {
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: key => { assert.ok(key in deps, key); return deps[key]; }, ...globals });
  return exports;
}
let tick;
let profile = { id: 'a' };
const played = {};
const listeners = {};
const nav = moduleAt('src/core/nav.ts', {
  './state': { activeProfile: () => profile, addPlaySeconds: (id, n) => played[id] = (played[id] || 0) + n, remainingTodaySec: () => 1200 },
  './voice': { stopVoice() {} },
}, {
  console,
  setInterval: fn => tick = fn,
  window: { addEventListener: (n, f) => listeners[n] = f },
  document: { visibilityState: 'visible', addEventListener: (n, f) => listeners[n] = f, getElementById: () => ({ innerHTML: '', append() {} }), createElement: () => ({}) },
});
nav.register('play', () => {}); nav.go('play'); nav.startClock();
tick(); tick(); profile = { id: 'b' }; tick(); nav.flushClock();
assert.deepEqual(played, { a: 2, b: 1 });
console.log('✓ El tiempo pendiente se guarda en su perfil original');
let queued = [];
const voice = moduleAt('src/core/voice.ts', {
  '../data/frases.json': { default: {} }, '../data/letras.json': { default: {} }, './state': { settings: { voice: true } },
}, {
  setTimeout, clearTimeout,
  fetch: async () => ({ ok: true, json: async () => ({ files: ['audio.mp3'] }) }),
  window: { speechSynthesis: { cancel() {}, getVoices: () => [], speak: u => queued.push(u) } },
  SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  Audio: class { play() { return Promise.resolve(); } pause() {} },
});
let resolved = false;
const p = voice.sayText('Prueba larga sin evento onend').then(() => resolved = true);
voice.stopVoice(); await p; assert.ok(resolved);
await new Promise(r => setTimeout(r, 0));
const audio = voice.say('audio'); voice.stopVoice(); await audio;
console.log('✓ Cancelar voz y MP3 resuelve sus promesas sin esperar eventos del navegador');
const events = {};
let cached = 0;
let response;
let fail = false;
const fallback = new Response('<html>shell</html>');
vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
  URL, Response,
  self: { addEventListener: (name, fn) => events[name] = fn, location: { origin: 'http://test' } },
  fetch: async () => { if (fail) throw Error('offline'); return new Response('error', { status: 500 }); },
  caches: { open: async () => ({ put() { cached++; } }), match: async key => key === './index.html' ? fallback : undefined },
});
const request = mode => ({ method: 'GET', url: 'http://test/assets/missing.js', mode });
const run = async mode => { events.fetch({ request: request(mode), respondWith: p => response = p, waitUntil() {} }); return await response; };
assert.equal((await run('cors')).status, 500); assert.equal(cached, 0);
fail = true;
assert.equal((await run('cors')).type, 'error');
assert.equal(await (await run('navigate')).text(), '<html>shell</html>');
console.log('✓ El caché no guarda errores HTTP ni devuelve HTML en lugar de JavaScript');
