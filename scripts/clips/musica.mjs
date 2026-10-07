// Música original para el tráiler, sintetizada por código (sin samples ni derechos de terceros).
// 112 BPM, Do mayor, progresión I–V–vi–IV con bombo, palmas, hi-hat, bajo, arpegio y melodía.
// Uso: node scripts/clips/musica.mjs salida.wav segundos
import { writeFileSync } from 'node:fs';

const out = process.argv[2] || 'media/trailer-musica.wav';
const SECS = Number(process.argv[3] || 40);
const SR = 44100;
const N = Math.floor(SR * SECS);
const L = new Float32Array(N);
const R = new Float32Array(N);
const BPM = 112;
const beat = 60 / BPM;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

function add(t0, dur, fn, pan = 0, gain = 1) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(dur * SR);
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR);
    L[s0 + i] += v * gl;
    R[s0 + i] += v * gr;
  }
}

const kick = (t) => Math.sin(2 * Math.PI * (50 * t + 90 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 7) * 0.9;
const clap = (t) => rnd() * Math.exp(-t * 22) * 0.35 * (t < 0.01 || (t > 0.012 && t < 0.02) || t > 0.024 ? 1 : 0.3);
const hat = (t) => rnd() * Math.exp(-t * 90) * 0.12;
const pluck = (f) => (t) => (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(4 * Math.PI * f * t) * 0.25 + Math.sin(6 * Math.PI * f * t) * 0.1) * Math.exp(-t * 6) * 0.22;
const bell = (f) => (t) => (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 8)) * Math.exp(-t * 3.2) * 0.2;
const bass = (f) => (t) => {
  const ph = (f * t) % 1;
  const saw = 2 * ph - 1;
  return (Math.sin(2 * Math.PI * f * t) * 0.7 + saw * 0.15) * Math.min(1, t * 80) * Math.exp(-t * 1.8) * 0.45;
};
const pad = (f) => (t) => (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.005 * t)) * 0.05 * Math.min(1, t * 2);

// acordes (raíz MIDI) I–V–vi–IV en Do
const CH = [
  [60, 64, 67],
  [55, 59, 62],
  [57, 60, 64],
  [53, 57, 60],
];
const MEL = [76, 74, 72, 74, 76, 76, 76, null, 74, 74, 74, null, 76, 79, 79, null, 76, 74, 72, 74, 76, 76, 76, 76, 74, 74, 76, 74, 72, null, null, null];

const totalBeats = Math.floor(SECS / beat);
for (let b = 0; b < totalBeats; b++) {
  const t = b * beat;
  const bar = Math.floor(b / 4);
  const chord = CH[bar % 4];
  const intro = b < 8;
  const outro = b >= totalBeats - 4;
  // batería
  if (!intro || b % 2 === 0) add(t, 0.5, kick, 0, 1);
  if (!intro && b % 2 === 1) add(t, 0.25, clap, 0, 1);
  if (!intro) for (const off of [0, 0.5]) add(t + off * beat, 0.08, hat, 0.3, b % 4 === 3 && off ? 1.4 : 1);
  // bajo
  add(t, beat * 0.95, bass(midi(chord[0] - 24)), 0, outro ? 0.6 : 1);
  if (!intro) add(t + beat * 0.5, beat * 0.45, bass(midi(chord[0] - 12)), 0, 0.5);
  // pad
  if (b % 4 === 0) for (const n of chord) add(t, beat * 4, pad(midi(n)), (n % 3) * 0.2 - 0.2, 1);
  // arpegio
  for (let k = 0; k < 4; k++) {
    const n = chord[k % 3] + (k === 3 ? 12 : 0) + 12;
    add(t + k * beat * 0.25, beat * 0.6, pluck(midi(n)), k % 2 ? 0.35 : -0.35, intro ? 0.7 : 1);
  }
  // melodía (después de la intro), 2 notas por compás de corcheas
  if (!intro && !outro) {
    for (const off of [0, 0.5]) {
      const m = MEL[((b - 8) * 2 + off * 2) % MEL.length];
      if (m) add(t + off * beat, beat * 1.2, bell(midi(m)), 0.1, 1);
    }
  }
}
// final: acorde brillante
const tEnd = totalBeats * beat - beat * 2;
for (const n of [72, 76, 79, 84]) add(tEnd, 2.5, bell(midi(n)), 0, 1.2);

// fades + normalizar
let peak = 0;
for (let i = 0; i < N; i++) {
  const fi = Math.min(1, i / (SR * 0.5)), fo = Math.min(1, (N - i) / (SR * 1.5));
  L[i] *= fi * fo;
  R[i] *= fi * fo;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * g * 1.1) * 32000), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * g * 1.1) * 32000), 46 + i * 4);
}
writeFileSync(out, buf);
console.log('música:', out, SECS + 's');
