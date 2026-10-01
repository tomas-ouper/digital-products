// Estado local de la app (v2). En esta versión vive en el navegador; en producción
// las cuentas y el progreso pasan a Supabase sin tocar los componentes.
import { useSyncExternalStore } from 'react'
import type { Word } from './themes'

export type Country = 'AR' | 'MX' | 'CO' | 'PE' | 'CL' | 'ES'
export type Script = 'imprenta' | 'cursiva'
export type Level = 1 | 2 | 3

export type Person = { name: string; rel: string; e: string }

export type Child = {
  id: string
  name: string
  age: number
  level: Level
  hand: 'diestro' | 'zurdo'
  known: string[]
  interests: string[] // lo que escribió la mamá, tal cual
  themes: string[] // temas de la biblioteca que se activaron
  removed: string[] // palabras de los temas que la mamá sacó
  people: Person[]
  words: Word[] // palabras propias
  mascot: string
  country: Country
  script: Script
  createdAt: string
}

export type Progress = {
  stars: number
  daysDone: number[]
  letters: Record<string, number>
  games: Record<string, number>
  activeDates: string[]
}

type Family = { children: Child[]; activeId: string | null; progress: Record<string, Progress> }

type State = {
  session: string | null // email de la cuenta con sesión iniciada
  families: Record<string, Family>
}

const KEY = 'letra-viva:v2'
const empty: State = { session: null, families: {} }
const emptyFamily = (): Family => ({ children: [], activeId: null, progress: {} })

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* modo privado: seguimos en memoria */ }
  listeners.forEach((l) => l())
}

export function useStore() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
}

export function family(s: State): Family {
  return (s.session && s.families[s.session]) || emptyFamily()
}

function setFamily(f: Family) {
  if (!state.session) return
  set({ ...state, families: { ...state.families, [state.session]: f } })
}

const blankProgress = (): Progress => ({ stars: 0, daysDone: [], letters: {}, games: {}, activeDates: [] })
const today = () => new Date().toISOString().slice(0, 10)

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export const actions = {
  setSession(email: string | null) {
    set({ ...state, session: email, families: email && !state.families[email] ? { ...state.families, [email]: emptyFamily() } : state.families })
  },
  saveChild(c: Omit<Child, 'id' | 'createdAt'> & { id?: string }) {
    const f = family(state)
    const id = c.id ?? uid()
    const existing = f.children.find((x) => x.id === id)
    const child: Child = { ...c, id, createdAt: existing?.createdAt ?? new Date().toISOString() }
    const children = existing ? f.children.map((x) => (x.id === id ? child : x)) : [...f.children, child]
    setFamily({ ...f, children, activeId: id, progress: { ...f.progress, [id]: f.progress[id] ?? blankProgress() } })
    return id
  },
  updateChild(id: string, patch: Partial<Child>) {
    const f = family(state)
    setFamily({ ...f, children: f.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  },
  removeChild(id: string) {
    const f = family(state)
    const children = f.children.filter((c) => c.id !== id)
    const { [id]: _, ...progress } = f.progress
    setFamily({ ...f, children, progress, activeId: children[0]?.id ?? null })
  },
  setActive(id: string) { setFamily({ ...family(state), activeId: id }) },
  reward(kind: { letter?: string; game?: string; stars?: number }) {
    const f = family(state)
    const id = f.activeId
    if (!id) return
    const p = { ...(f.progress[id] ?? blankProgress()) }
    p.stars += kind.stars ?? 1
    if (kind.letter) p.letters = { ...p.letters, [kind.letter]: (p.letters[kind.letter] ?? 0) + 1 }
    if (kind.game) p.games = { ...p.games, [kind.game]: (p.games[kind.game] ?? 0) + 1 }
    if (!p.activeDates.includes(today())) p.activeDates = [...p.activeDates, today()]
    setFamily({ ...f, progress: { ...f.progress, [id]: p } })
  },
  completeDay(day: number) {
    const f = family(state)
    const id = f.activeId
    if (!id) return
    const p = { ...(f.progress[id] ?? blankProgress()) }
    if (!p.daysDone.includes(day)) { p.daysDone = [...p.daysDone, day].sort((a, b) => a - b); p.stars += 3 }
    if (!p.activeDates.includes(today())) p.activeDates = [...p.activeDates, today()]
    setFamily({ ...f, progress: { ...f.progress, [id]: p } })
  },
}

export function activeChild(s: State): Child | undefined {
  const f = family(s)
  return f.children.find((c) => c.id === f.activeId) ?? f.children[0]
}

export function progressOf(s: State, id?: string): Progress {
  return (id && family(s).progress[id]) || blankProgress()
}

/** Racha de días seguidos con actividad, contando desde hoy o ayer. */
export function streak(p: Progress): number {
  const days = new Set(p.activeDates)
  const d = new Date()
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
