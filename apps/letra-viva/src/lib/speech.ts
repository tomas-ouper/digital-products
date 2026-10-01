// Voz del navegador (Web Speech API). Sin costo y sin servidor; elige una voz en español.
let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const pref = ['es-MX', 'es-US', 'es-419', 'es-AR', 'es-CO', 'es-ES']
  voice = pref.map((l) => voices.find((v) => v.lang === l)).find(Boolean) ?? voices.find((v) => v.lang.startsWith('es')) ?? null
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function say(text: string, rate = 0.85) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? 'es-MX'
  if (voice) u.voice = voice
  u.rate = rate
  u.pitch = 1.1
  window.speechSynthesis.speak(u)
}

// Cómo se "dice" el sonido de cada letra para un chico (fonema, no el nombre de la letra).
const SOUNDS: Record<string, string> = {
  m: 'mmm', s: 'sss', f: 'fff', l: 'lll', n: 'nnn', r: 'rrr', j: 'jjj', z: 'sss',
  p: 'pe', t: 'te', d: 'de', b: 'be', v: 've', c: 'ca', k: 'ca', q: 'cu', g: 'ga',
  ñ: 'ñe', h: 'hache, que no suena', y: 'ye', x: 'equis', w: 'uve doble',
}

export function letterSound(l: string) {
  return SOUNDS[l] ?? l
}

export const cheers = ['¡Muy bien!', '¡Genial!', '¡Lo lograste!', '¡Bravo!', '¡Increíble!', '¡Excelente!']
export const cheer = () => cheers[Math.floor(Math.random() * cheers.length)]
