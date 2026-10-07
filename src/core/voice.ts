// Voz: Web Speech API (es-MX preferido) + reemplazo opcional por mp3 grabados.
// Para reemplazar una frase por un mp3: poner public/audio/<clave>.mp3 y agregar el nombre en
// public/audio/available.json ({"files":["bienvenida.mp3", ...]}). Ver voces.csv.
import frases from '../data/frases.json';
import letras from '../data/letras.json';
import { settings } from './state';

const F = frases as Record<string, string>;
const LETRAS = letras as Record<string, string>;

let available = new Set<string>();
fetch('./audio/available.json')
  .then((r) => (r.ok ? r.json() : { files: [] }))
  .then((j) => (available = new Set(j.files || [])))
  .catch(() => {});

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  const s = window.speechSynthesis;
  if (!s) return;
  const vs = s.getVoices();
  const score = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    let n = 0;
    if (l === 'es-mx') n += 50;
    else if (l === 'es-us' || l === 'es-419') n += 40;
    else if (l.startsWith('es-')) n += 20;
    else if (l === 'es') n += 15;
    else return -1;
    if (/google|natural|premium|enhanced|paulina|sabina|dalia|monica/i.test(v.name)) n += 5;
    return n;
  };
  voice = vs.filter((v) => score(v) >= 0).sort((a, b) => score(b) - score(a))[0] || null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

/** Nombre de una letra para decirla en voz alta ("eme"). */
export function letterName(l: string): string {
  return LETRAS[l.toLowerCase()] || l;
}

export function phrase(key: string, vars: Record<string, string | number> = {}): string {
  let t = F[key] ?? key;
  for (const [k, v] of Object.entries(vars)) t = t.split('{' + k + '}').join(String(v));
  return t;
}

let current: HTMLAudioElement | null = null;
let token = 0;
let finishCurrent: (() => void) | null = null;

export function stopVoice() {
  token++;
  finishCurrent?.();
  finishCurrent = null;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
  if (current) {
    current.pause();
    current = null;
  }
}

/**
 * Dice una frase por clave (ver src/data/frases.json). `vars` reemplaza {variables}.
 * Clave del mp3: clave + "_" + valores de variables (ej: ninja_corta_m.mp3).
 * Devuelve una promesa que se resuelve al terminar (o enseguida si la voz está apagada).
 */
export function say(key: string, vars: Record<string, string | number> = {}, opts: { raw?: boolean } = {}): Promise<void> {
  stopVoice();
  const my = token;
  if (!settings.voice) return Promise.resolve();
  const text = opts.raw ? key : phrase(key, vars);
  const mp3 = (opts.raw ? '' : [key, ...Object.values(vars).map((v) => String(v).toLowerCase())].join('_')) + '.mp3';
  if (!opts.raw && available.has(mp3)) {
    return new Promise((res) => {
      const a = new Audio('./audio/' + mp3);
      current = a;
      const finish = () => {
        a.onended = a.onerror = null;
        if (finishCurrent === finish) finishCurrent = null;
        res();
      };
      finishCurrent = finish;
      a.onended = finish;
      a.onerror = finish;
      a.play().catch(finish);
    });
  }
  return speakText(text, my);
}

/** Dice un texto libre (sin mp3). */
export function sayText(text: string): Promise<void> {
  stopVoice();
  if (!settings.voice) return Promise.resolve();
  return speakText(text, token);
}

function speakText(text: string, my: number): Promise<void> {
  const s = window.speechSynthesis;
  if (!s) return Promise.resolve();
  return new Promise((res) => {
    if (my !== token) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || 'es-MX';
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1.1;
    let done = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = () => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        if (finishCurrent === finish) finishCurrent = null;
        res();
      }
    };
    finishCurrent = finish;
    u.onend = finish;
    u.onerror = finish;
    // Algunos navegadores no disparan onend: tope de seguridad.
    timeout = setTimeout(finish, 600 + text.length * 110);
    s.speak(u);
  });
}
