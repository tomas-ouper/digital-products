// Palabras de cada chico, sílabas y el camino de 21 días.
import type { Child } from './store'
import { HOME_WORDS, themeById, norm, type Word } from './themes'

export type { Word }

export const LETTER_ORDER = ['a', 'e', 'i', 'o', 'u', 'm', 'p', 'l', 's', 't', 'd', 'n', 'f', 'r', 'c', 'b', 'v', 'g', 'j', 'ñ', 'h', 'z', 'q', 'y']
export const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz'.split('')
export const VOWELS = ['a', 'e', 'i', 'o', 'u']

export function strip(s: string) {
  return [...s].map((c) => (c === 'ñ' || c === 'Ñ' ? c : c.normalize('NFD').replace(/[̀-ͯ]/g, ''))).join('')
}

/** Primera letra "base" de una palabra (sin tilde, en minúscula). */
export function firstLetter(w: string) {
  return strip(w.toLowerCase())[0]
}

export function cap(s: string) {
  const t = s.trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** Cómo se muestra una palabra: los nombres propios con mayúscula. */
export const show = (w: Word) => (w.proper ? cap(w.w) : w.w)

/** Letras "jugables": sólo letras, sin espacios ni signos. */
export const letters = (w: string) => [...strip(w.toLowerCase())].filter((c) => ALPHABET.includes(c))

/**
 * Las palabras de un chico, en orden de importancia: su gente y sus palabras propias,
 * después las de sus temas (menos las que la mamá sacó) y por último las de la casa.
 */
export function bankFor(child: Child, opts: { maxLen?: number; withEmoji?: boolean } = {}): Word[] {
  const people = child.people.map((p) => ({ w: p.name, e: p.e, proper: true }))
  const own = child.words
  const themed = child.themes.flatMap((id) => themeById(id)?.words ?? []).filter((w) => !child.removed.includes(w.w))
  const seen = new Set<string>()
  const all = [...people, ...own, ...themed, ...HOME_WORDS].filter((w) => {
    const k = norm(w.w)
    if (!k || seen.has(k) || k.includes(' ')) return false
    seen.add(k)
    return true
  })
  const maxLen = opts.maxLen ?? (child.level === 1 ? 6 : child.level === 2 ? 8 : 12)
  return all.filter((w) => letters(w.w).length <= maxLen && letters(w.w).length >= 2 && (!opts.withEmoji || !!w.e))
}

/** Sólo las palabras personales (gente, propias y temas), sin las de relleno. */
export function personalWords(child: Child): Word[] {
  const home = new Set(HOME_WORDS.map((w) => norm(w.w)))
  const mine = bankFor(child, { maxLen: 14 }).filter((w) => !home.has(norm(w.w)) || child.words.some((x) => norm(x.w) === norm(w.w)))
  return mine.length >= 6 ? mine : bankFor(child, { maxLen: 14 })
}

/** Frases cortas con su gente y sus temas, para los chicos que ya leen palabras. */
export function sentencesFor(child: Child): string[] {
  const name = cap(child.name)
  const out = [`Yo soy ${name}.`]
  for (const p of child.people) {
    const n = cap(p.name)
    if (p.rel === 'mama') out.push(`Mi mamá es ${n}.`)
    else if (p.rel === 'papa') out.push(`Mi papá es ${n}.`)
    else if (p.rel === 'perro') out.push(`Mi perro se llama ${n}.`)
    else if (p.rel === 'gato') out.push(`Mi gato se llama ${n}.`)
    else if (p.rel === 'hermana' || p.rel === 'hermano') out.push(`${n} es mi ${p.rel}.`)
    else if (p.rel === 'abuela' || p.rel === 'abuelo') out.push(`Amo a mi ${p.rel} ${n}.`)
    else out.push(`${name} quiere a ${n}.`)
  }
  const themed = child.themes.flatMap((id) => themeById(id)?.words.slice(0, 2) ?? [])
  for (const w of themed.slice(0, 4)) out.push(`Me gusta ${articleFor(w.w)} ${w.w}.`)
  return out
}

function articleFor(w: string) {
  const n = norm(w)
  const fem = /(a|cion|dad)$/.test(n) &&!['dia', 'mapa', 'planeta', 'cometa', 'pirata', 'astronauta'].includes(n)
  return fem ? 'la' : 'el'
}

/** Separación silábica simple para palabras cortas en español. */
export function syllables(word: string): string[] {
  const w = word.toLowerCase()
  const isV = (c: string) => 'aeiouáéíóúü'.includes(c)
  const inseparable = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'ch', 'll', 'rr']
  const out: string[] = []
  let cur = ''
  for (let i = 0; i < w.length; i++) {
    cur += w[i]
    const c = w[i], n = w[i + 1], nn = w[i + 2]
    if (isV(c) && n && !isV(n)) {
      if (nn && isV(nn)) { out.push(cur); cur = '' }
      else if (nn && inseparable.includes(n + nn)) { out.push(cur); cur = '' }
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

export type SheetKind = 'nombre' | 'letra' | 'palabras' | 'silabas' | 'unir' | 'frases' | 'diploma' | 'cartel'
export type GameId = 'trazar' | 'sonido' | 'leer' | 'completa' | 'armar' | 'memoria' | 'caza'

const GAME_ROTATION: GameId[][] = [
  ['trazar', 'caza'], ['trazar', 'sonido'], ['trazar', 'caza'], ['sonido', 'trazar'], ['trazar', 'sonido', 'armar'],
  ['trazar', 'completa', 'memoria'], ['trazar', 'sonido', 'armar'], ['trazar', 'leer', 'caza'], ['trazar', 'completa', 'armar'],
]

/**
 * Arma el camino de 21 días: vocales primero, después las letras de su nombre que todavía
 * no conoce y luego el orden fonético-silábico. Días 7, 14 y 21: repaso.
 */
export function buildPlan(child: Child): DayPlan[] {
  const nameLetters = [...new Set(letters(child.name))]
  const queue: string[] = []
  const push = (c: string) => { if (!queue.includes(c) && !child.known.includes(c)) queue.push(c) }
  VOWELS.forEach(push)
  nameLetters.filter((c) => !VOWELS.includes(c)).forEach(push)
  LETTER_ORDER.forEach(push)

  const tips = [
    'Siéntate a su lado, no enfrente. Quince minutos alcanzan.',
    'Di el sonido de la letra, no su nombre: "mmm", no "eme".',
    'Si se traba, traza tú la letra en el aire y que te copie.',
    'Felicita el esfuerzo, no la prolijidad: "¡qué concentrado estabas!".',
    'Antes de escribir, que trace la letra con el dedo sobre la mesa.',
    'Si se cansa, corta. Mejor terminar con ganas de más.',
    'Pega su ficha favorita en la heladera: que vea que vale.',
  ]
  const lvl = child.level
  const plan: DayPlan[] = []
  let qi = 0
  for (let d = 1; d <= 21; d++) {
    if (d % 7 === 0) {
      const week = d / 7
      plan.push({
        day: d,
        title: week === 3 ? '¡Ya escribo mi nombre!' : `Repaso de la semana ${week}`,
        letters: nameLetters.slice(0, 3),
        sheets: week === 3 ? [{ kind: 'nombre' }, { kind: 'diploma' }, { kind: 'cartel' }] : [{ kind: 'nombre' }, { kind: lvl >= 2 ? 'frases' : 'palabras' }],
        games: ['armar', 'memoria', lvl >= 2 ? 'leer' : 'caza'],
        tip: week === 3 ? 'Hoy escribe su nombre sin modelo. Sácale una foto: es el antes y después.' : 'Día de repaso: nada nuevo. Que elija el juego que más le gustó.',
        milestone: week === 1 ? 'Reconoce las vocales' : week === 2 ? 'Arma su nombre con letras sueltas' : 'Escribe su nombre solo',
      })
      continue
    }
    let ls = d <= 5 ? [queue[qi++]] : [queue[qi++], queue[qi++]].filter(Boolean)
    const review = ls.length === 0
    if (review) ls = nameLetters.slice((d % 3) * 2, (d % 3) * 2 + 2).filter(Boolean)
    if (!ls.length) ls = [nameLetters[0] ?? 'a']
    const games = GAME_ROTATION[(d - 1) % GAME_ROTATION.length].map((g) => (lvl === 1 && g === 'leer' ? 'sonido' : g)) as GameId[]
    plan.push({
      day: d,
      title: review ? `Las letras de ${cap(child.name)}` : ls.length === 1 ? `La letra ${ls[0].toUpperCase()}` : `Las letras ${ls.map((l) => l.toUpperCase()).join(' y ')}`,
      letters: ls,
      sheets: [{ kind: 'letra', letter: ls[0] }, d >= 4 ? { kind: d % 2 ? 'silabas' : 'unir', letter: ls[0] } : { kind: 'nombre' }],
      games,
      tip: tips[(d - 1) % tips.length],
    })
  }
  return plan
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
