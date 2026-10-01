// Contenido base: vocabulario por mundo, orden de letras y el plan de 21 días.

export type Word = { w: string; e: string }

export const THEMES: Record<string, { label: string; e: string; words: Word[] }> = {
  animales: {
    label: 'Animales', e: '🐶',
    words: [
      { w: 'gato', e: '🐱' }, { w: 'perro', e: '🐶' }, { w: 'vaca', e: '🐮' }, { w: 'pato', e: '🦆' },
      { w: 'oso', e: '🐻' }, { w: 'mono', e: '🐵' }, { w: 'sapo', e: '🐸' }, { w: 'lobo', e: '🐺' },
      { w: 'foca', e: '🦭' }, { w: 'conejo', e: '🐰' }, { w: 'león', e: '🦁' }, { w: 'tortuga', e: '🐢' },
      { w: 'jirafa', e: '🦒' }, { w: 'ratón', e: '🐭' }, { w: 'pollito', e: '🐥' },
    ],
  },
  futbol: {
    label: 'Fútbol', e: '⚽',
    words: [
      { w: 'pelota', e: '⚽' }, { w: 'gol', e: '🥅' }, { w: 'copa', e: '🏆' }, { w: 'medalla', e: '🏅' },
      { w: 'camiseta', e: '👕' }, { w: 'zapatilla', e: '👟' }, { w: 'estadio', e: '🏟️' }, { w: 'silbato', e: '📣' },
      { w: 'equipo', e: '🧑‍🤝‍🧑' }, { w: 'campeón', e: '🥇' },
    ],
  },
  dinosaurios: {
    label: 'Dinosaurios', e: '🦖',
    words: [
      { w: 'dino', e: '🦖' }, { w: 'huevo', e: '🥚' }, { w: 'hueso', e: '🦴' }, { w: 'volcán', e: '🌋' },
      { w: 'roca', e: '🪨' }, { w: 'hoja', e: '🍃' }, { w: 'diente', e: '🦷' }, { w: 'selva', e: '🌴' },
      { w: 'pisada', e: '🐾' },
    ],
  },
  princesas: {
    label: 'Princesas', e: '👑',
    words: [
      { w: 'corona', e: '👑' }, { w: 'reina', e: '👸' }, { w: 'castillo', e: '🏰' }, { w: 'hada', e: '🧚' },
      { w: 'rosa', e: '🌹' }, { w: 'vestido', e: '👗' }, { w: 'anillo', e: '💍' }, { w: 'varita', e: '🪄' },
      { w: 'unicornio', e: '🦄' },
    ],
  },
  espacio: {
    label: 'Espacio', e: '🚀',
    words: [
      { w: 'luna', e: '🌙' }, { w: 'sol', e: '☀️' }, { w: 'cohete', e: '🚀' }, { w: 'nave', e: '🛸' },
      { w: 'estrella', e: '⭐' }, { w: 'planeta', e: '🪐' }, { w: 'tierra', e: '🌍' }, { w: 'cometa', e: '☄️' },
    ],
  },
  mar: {
    label: 'El mar', e: '🌊',
    words: [
      { w: 'barco', e: '⛵' }, { w: 'pez', e: '🐟' }, { w: 'ola', e: '🌊' }, { w: 'ballena', e: '🐋' },
      { w: 'pulpo', e: '🐙' }, { w: 'isla', e: '🏝️' }, { w: 'delfín', e: '🐬' }, { w: 'cangrejo', e: '🦀' },
    ],
  },
}

// Palabras de la casa: siempre disponibles, sílabas directas y simples.
export const HOME_WORDS: Word[] = [
  { w: 'mamá', e: '👩' }, { w: 'papá', e: '👨' }, { w: 'casa', e: '🏠' }, { w: 'mesa', e: '🍽️' },
  { w: 'sopa', e: '🍲' }, { w: 'mano', e: '✋' }, { w: 'pie', e: '🦶' }, { w: 'uva', e: '🍇' },
  { w: 'manzana', e: '🍎' }, { w: 'pera', e: '🍐' }, { w: 'auto', e: '🚗' }, { w: 'tren', e: '🚂' },
  { w: 'bebé', e: '👶' }, { w: 'cama', e: '🛏️' }, { w: 'taza', e: '☕' }, { w: 'nube', e: '☁️' },
  { w: 'flor', e: '🌸' }, { w: 'ojo', e: '👁️' }, { w: 'dado', e: '🎲' }, { w: 'lápiz', e: '✏️' },
  { w: 'libro', e: '📖' }, { w: 'pan', e: '🍞' }, { w: 'helado', e: '🍦' }, { w: 'tomate', e: '🍅' },
  { w: 'abeja', e: '🐝' }, { w: 'avión', e: '✈️' }, { w: 'árbol', e: '🌳' }, { w: 'elefante', e: '🐘' },
  { w: 'erizo', e: '🦔' }, { w: 'iguana', e: '🦎' }, { w: 'iglú', e: '🛖' }, { w: 'imán', e: '🧲' },
  { w: 'oveja', e: '🐑' }, { w: 'oreja', e: '👂' }, { w: 'uno', e: '1️⃣' }, { w: 'uña', e: '💅' },
  { w: 'fresa', e: '🍓' }, { w: 'galleta', e: '🍪' }, { w: 'jugo', e: '🧃' }, { w: 'zapato', e: '👞' },
  { w: 'yoyó', e: '🪀' }, { w: 'kiwi', e: '🥝' }, { w: 'queso', e: '🧀' }, { w: 'ñandú', e: '🐦' },
]

// Orden fonético-silábico habitual en español: vocales, luego consonantes de sonido continuo y frecuentes.
export const LETTER_ORDER = [
  'a', 'e', 'i', 'o', 'u', 'm', 'p', 'l', 's', 't', 'd', 'n', 'f', 'r', 'c', 'b', 'v', 'g', 'j', 'ñ', 'h', 'z', 'q', 'y',
]

export const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz'.split('')
export const VOWELS = ['a', 'e', 'i', 'o', 'u']

export function strip(s: string) {
  return [...s].map((c) => (c === 'ñ' || c === 'Ñ' ? c : c.normalize('NFD').replace(/[̀-ͯ]/g, ''))).join('')
}

/** Primera letra "base" de una palabra (sin tilde, en minúscula). */
export function firstLetter(w: string) {
  const c = w.toLowerCase()[0]
  return c === 'ñ' ? 'ñ' : strip(c)
}

export function vocabFor(interests: string[]): Word[] {
  const own = interests.flatMap((t) => THEMES[t]?.words ?? [])
  const seen = new Set<string>()
  return [...own, ...HOME_WORDS].filter((x) => (seen.has(x.w) ? false : (seen.add(x.w), true)))
}

/** Separación silábica simple para palabras cortas en español (suficiente para el MVP). */
export function syllables(word: string): string[] {
  const w = word.toLowerCase()
  const isV = (c: string) => 'aeiouáéíóúü'.includes(c)
  const out: string[] = []
  let cur = ''
  for (let i = 0; i < w.length; i++) {
    cur += w[i]
    const c = w[i], n = w[i + 1], nn = w[i + 2]
    if (isV(c) && n && !isV(n)) {
      // V C V → corta antes de la consonante; V C C V → corta entre consonantes (salvo grupos bl, br, ch, ll, rr…)
      const pair = n + (nn ?? '')
      const inseparable = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'ch', 'll', 'rr']
      if (nn && isV(nn)) { out.push(cur); cur = '' }
      else if (nn && inseparable.includes(pair)) { out.push(cur); cur = '' }
      else if (nn && !isV(nn)) { cur += n; i++; out.push(cur); cur = '' }
    }
  }
  if (cur) {
    if (out.length && ![...cur].some(isV)) out[out.length - 1] += cur
    else out.push(cur)
  }
  return out.filter(Boolean)
}

export type DayPlan = {
  day: number
  title: string
  letters: string[]
  sheets: { kind: SheetKind; letter?: string }[]
  games: GameId[]
  tip: string
  milestone?: string
}

export type SheetKind = 'nombre' | 'letra' | 'palabras' | 'silabas' | 'unir' | 'diploma' | 'cartel'
export type GameId = 'trazar' | 'sonido' | 'armar' | 'memoria' | 'silabas'

/**
 * Arma el camino de 21 días para un chico: vocales primero, después las letras
 * de su nombre que todavía no conoce, y luego el orden fonético habitual.
 */
export function buildPlan(name: string, known: string[]): DayPlan[] {
  const nameLetters = [...new Set([...strip(name.toLowerCase())].filter((c) => ALPHABET.includes(c)))]
  const queue: string[] = []
  const push = (c: string) => { if (!queue.includes(c) && !known.includes(c)) queue.push(c) }
  VOWELS.forEach(push)
  nameLetters.filter((c) => !VOWELS.includes(c)).forEach(push)
  LETTER_ORDER.forEach(push)
  // Si ya conoce todo, repasamos su nombre y las más frecuentes.
  if (queue.length < 18) LETTER_ORDER.forEach((c) => queue.length < 30 && !queue.includes(c) && queue.push(c))

  const tips = [
    'Siéntate a su lado, no enfrente. Quince minutos alcanzan.',
    'Di el sonido de la letra, no su nombre: "mmm", no "eme".',
    'Si se traba, traza tú la letra en el aire y que te copie.',
    'Felicita el esfuerzo, no la prolijidad: "¡qué concentrado estabas!".',
    'Antes de escribir, que la trace con el dedo sobre la mesa.',
    'Si se cansa, corta. Mejor terminar con ganas de más.',
    'Pega su ficha favorita en la heladera: que vea que vale.',
  ]

  const plan: DayPlan[] = []
  let qi = 0
  for (let d = 1; d <= 21; d++) {
    const isReview = d % 7 === 0
    if (isReview) {
      const week = d / 7
      plan.push({
        day: d,
        title: week === 3 ? '¡Ya escribo mi nombre!' : `Repaso de la semana ${week}`,
        letters: [],
        sheets: week === 3
          ? [{ kind: 'nombre' }, { kind: 'diploma' }, { kind: 'cartel' }]
          : [{ kind: 'nombre' }, { kind: 'palabras' }],
        games: ['armar', 'memoria'],
        tip: week === 3
          ? 'Hoy escribe su nombre sin modelo. Sácale una foto: es el antes y después.'
          : 'Día de repaso: nada nuevo. Que elija el juego que más le gustó.',
        milestone: week === 1 ? 'Reconoce las vocales' : week === 2 ? 'Arma su nombre con letras sueltas' : 'Escribe su nombre solo',
      })
      continue
    }
    let letters = d <= 5 ? [queue[qi++]] : [queue[qi++], queue[qi++]].filter(Boolean)
    const review = letters.length === 0
    if (review) letters = nameLetters.slice((d % 3) * 2, (d % 3) * 2 + 2).filter(Boolean)
    if (!letters.length) letters = [nameLetters[0] ?? 'a']
    plan.push({
      day: d,
      title: review ? `Las letras de ${cap(name)}` : letters.length === 1 ? `La letra ${letters[0].toUpperCase()}` : `Las letras ${letters.map((l) => l.toUpperCase()).join(' y ')}`,
      letters,
      sheets: [
        { kind: 'letra', letter: letters[0] },
        d >= 4 ? { kind: d % 2 ? 'silabas' : 'unir', letter: letters[0] } : { kind: 'nombre' },
      ],
      games: d <= 5 ? ['trazar', 'sonido'] : ['trazar', d % 2 ? 'silabas' : 'sonido', 'armar'],
      tip: tips[(d - 1) % tips.length],
    })
  }
  return plan
}

function cap(s: string) {
  return s.trim() ? s.trim()[0].toUpperCase() + s.trim().slice(1) : s
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}
