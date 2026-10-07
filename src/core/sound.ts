// Efectos de sonido sintetizados con WebAudio (sin archivos, todo original).
import { settings } from './state';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (!settings.sound) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Llamar en el primer toque: desbloquea audio en iOS/Android. */
export function unlockAudio() {
  ac();
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, delay = 0, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol = 0.12, delay = 0, hp = 800) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const sfx = {
  tap: () => tone(660, 0.08, 'triangle', 0.12),
  pop: () => tone(520, 0.12, 'sine', 0.18, 0, 900),
  eat: () => tone(880, 0.07, 'square', 0.06, 0, 1320),
  good: () => {
    tone(660, 0.12, 'triangle', 0.15);
    tone(990, 0.18, 'triangle', 0.15, 0.1);
  },
  bad: () => {
    tone(300, 0.18, 'sawtooth', 0.07, 0, 180);
  },
  whoosh: () => noise(0.25, 0.12, 0, 1500),
  slice: () => {
    noise(0.15, 0.15, 0, 2500);
    tone(1200, 0.1, 'sine', 0.08, 0, 600);
  },
  thud: () => tone(120, 0.2, 'sine', 0.25, 0, 60),
  place: () => tone(330, 0.07, 'square', 0.07, 0, 280),
  star: (i = 0) => tone(784 + i * 196, 0.25, 'triangle', 0.16, i * 0.25),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.12));
  },
};
