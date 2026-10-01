// Estado local de la app. En el MVP vive en el navegador (localStorage);
// en producción se reemplaza por Supabase sin tocar los componentes.
import { useSyncExternalStore } from 'react'

export type Country = 'AR' | 'MX' | 'CO' | 'PE' | 'CL' | 'ES'
export type Script = 'imprenta' | 'cursiva'

export type Child = {
  id: string
  name: string
  age: number
  hand: 'diestro' | 'zurdo'
  known: string[]
  interests: string[]
  country: Country
  script: Script
  createdAt: string
}

export type Progress = {
  stars: number
  daysDone: number[]
  letters: Record<string, number> // letra → veces trazada bien
  games: Record<string, number> // juego → partidas ganadas
  activeDates: string[] // yyyy-mm-dd
}

type State = {
  unlocked: boolean
  children: Child[]
  activeId: string | null
  progress: Record<string, Progress>
}

const KEY = 'letra-viva:v1'
const empty: State = { unlocked: false, children: [], activeId: null, progress: {} }

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
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => state,
  )
}

const blankProgress = (): Progress => ({ stars: 0, daysDone: [], letters: {}, games: {}, activeDates: [] })
const today = () => new Date().toISOString().slice(0, 10)

export const actions = {
  unlock() { set({ ...state, unlocked: true }) },
  saveChild(c: Omit<Child, 'id' | 'createdAt'> & { id?: string }) {
    const id = c.id ?? crypto.randomUUID()
    const existing = state.children.find((x) => x.id === id)
    const child: Child = { ...c, id, createdAt: existing?.createdAt ?? new Date().toISOString() }
    const children = existing ? state.children.map((x) => (x.id === id ? child : x)) : [...state.children, child]
    set({ ...state, children, activeId: id, progress: { ...state.progress, [id]: state.progress[id] ?? blankProgress() } })
    return id
  },
  removeChild(id: string) {
    const children = state.children.filter((c) => c.id !== id)
    const { [id]: _, ...progress } = state.progress
    set({ ...state, children, progress, activeId: children[0]?.id ?? null })
  },
  setActive(id: string) { set({ ...state, activeId: id }) },
  reward(kind: { letter?: string; game?: string; stars?: number }) {
    const id = state.activeId
    if (!id) return
    const p = { ...(state.progress[id] ?? blankProgress()) }
    p.stars += kind.stars ?? 1
    if (kind.letter) p.letters = { ...p.letters, [kind.letter]: (p.letters[kind.letter] ?? 0) + 1 }
    if (kind.game) p.games = { ...p.games, [kind.game]: (p.games[kind.game] ?? 0) + 1 }
    if (!p.activeDates.includes(today())) p.activeDates = [...p.activeDates, today()]
    set({ ...state, progress: { ...state.progress, [id]: p } })
  },
  completeDay(day: number) {
    const id = state.activeId
    if (!id) return
    const p = { ...(state.progress[id] ?? blankProgress()) }
    if (!p.daysDone.includes(day)) p.daysDone = [...p.daysDone, day].sort((a, b) => a - b)
    p.stars += 3
    if (!p.activeDates.includes(today())) p.activeDates = [...p.activeDates, today()]
    set({ ...state, progress: { ...state.progress, [id]: p } })
  },
}

export function activeChild(s: State): Child | undefined {
  return s.children.find((c) => c.id === s.activeId) ?? s.children[0]
}

export function progressOf(s: State, id?: string): Progress {
  return (id && s.progress[id]) || blankProgress()
}

/** Racha de días seguidos con actividad, contando hacia atrás desde hoy o ayer. */
export function streak(p: Progress): number {
  const set = new Set(p.activeDates)
  const d = new Date()
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
