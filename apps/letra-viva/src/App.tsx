import { useEffect, useMemo, useState } from 'react'
import { actions, activeChild, progressOf, streak, useStore, type Child } from './lib/store'
import { buildPlan, ALPHABET, type DayPlan, type GameId, type SheetKind } from './lib/content'
import { Sheet, type SheetOptions } from './components/Sheet'
import { ProfileForm } from './pages/ProfileForm'
import { TraceGame } from './games/TraceGame'
import { BuildGame, MemoryGame, SoundGame, SyllableGame } from './games/WordGames'
import type { GameProps } from './games/GameShell'

/* ---------- Ruteo por hash: sin dependencias y funciona en Vercel sin configuración extra ---------- */
function useRoute() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || '/')
  useEffect(() => {
    const on = () => { setHash(location.hash.slice(1) || '/'); window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash.split('?')[0].split('/').filter(Boolean)
}
export const go = (path: string) => { location.hash = path }

export const GAMES: Record<GameId, { label: string; e: string; desc: string; C: (p: GameProps) => React.ReactElement }> = {
  trazar: { label: 'Trazar', e: '✍️', desc: 'Repasa la letra con el dedo', C: TraceGame },
  sonido: { label: '¿Con qué empieza?', e: '👂', desc: 'Escucha y elige la letra', C: SoundGame },
  armar: { label: 'Arma la palabra', e: '🧩', desc: 'Empieza por su nombre', C: BuildGame },
  silabas: { label: 'Sílabas', e: '🎵', desc: 'Escucha y toca la sílaba', C: SyllableGame },
  memoria: { label: 'Memoria', e: '🃏', desc: 'Dibujo con su palabra', C: MemoryGame },
}

export const SHEETS: { kind: SheetKind; label: string; e: string; needsLetter?: boolean }[] = [
  { kind: 'nombre', label: 'Su nombre', e: '✏️' },
  { kind: 'letra', label: 'Letra del día', e: '🔤', needsLetter: true },
  { kind: 'palabras', label: 'Palabras de su mundo', e: '🌎' },
  { kind: 'silabas', label: 'Completa la sílaba', e: '🧩', needsLetter: true },
  { kind: 'unir', label: 'Une dibujo y palabra', e: '🔗' },
  { kind: 'diploma', label: 'Diploma', e: '🏅' },
  { kind: 'cartel', label: 'Cartel para su puerta', e: '🚪' },
]

const ACCESS = (import.meta.env.VITE_ACCESS_CODES as string | undefined)?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) ?? []

export default function App() {
  const s = useStore()
  const route = useRoute()
  const child = activeChild(s)

  if (ACCESS.length && !s.unlocked) return <Unlock />
  if (!child || route[0] === 'nuevo') return <Frame bare><ProfileForm onDone={() => go('/')} /></Frame>
  if (route[0] === 'editar') return <Frame bare><ProfileForm initial={child} onDone={() => go('/padres')} /></Frame>

  const plan = buildPlan(child.name, child.known)
  const p = progressOf(s, child.id)
  const letters = plan.flatMap((d) => d.letters)
  const currentDay = plan.find((d) => !p.daysDone.includes(d.day)) ?? plan[plan.length - 1]

  if (route[0] === 'juego' && route[1] in GAMES) {
    const G = GAMES[route[1] as GameId].C
    const day = route[2] ? plan[Number(route[2]) - 1] : undefined
    const ls = day?.letters.length ? day.letters : letters.slice(0, Math.max(2, p.daysDone.length * 2 + 2))
    return <Frame bare><G letters={ls} onExit={() => history.back()} onWin={() => actions.reward({ stars: 1 })} /></Frame>
  }

  return (
    <Frame child={child} stars={p.stars} tab={route[0] ?? ''}>
      {route[0] === 'dia' ? <DayView day={plan[Number(route[1]) - 1] ?? currentDay} child={child} done={p.daysDone} />
        : route[0] === 'fichas' ? <SheetsPage child={child} letters={letters} />
        : route[0] === 'juegos' ? <GamesPage />
        : route[0] === 'padres' ? <ParentsPage child={child} plan={plan} />
        : <Home child={child} plan={plan} current={currentDay} done={p.daysDone} />}
    </Frame>
  )
}

function Frame({ children, child, stars, tab, bare }: { children: React.ReactNode; child?: Child; stars?: number; tab?: string; bare?: boolean }) {
  if (bare) return <main className="shell bare">{children}</main>
  const tabs = [['', '🗺️', 'Camino'], ['juegos', '🎮', 'Juegos'], ['fichas', '🖨️', 'Fichas'], ['padres', '👪', 'Padres']]
  return (
    <div className="app">
      <header className="top no-print">
        <span className="brand">Letra <b>Viva</b></span>
        {child && <span className="who">{child.name} · ⭐ {stars}</span>}
      </header>
      <main className="shell">{children}</main>
      <nav className="tabs no-print">
        {tabs.map(([path, e, label]) => (
          <a key={path} href={`#/${path}`} className={tab === path || (tab === 'dia' && path === '') ? 'on' : ''}><span>{e}</span>{label}</a>
        ))}
      </nav>
    </div>
  )
}

/* ---------- Camino de 21 días ---------- */
function Home({ child, plan, current, done }: { child: Child; plan: DayPlan[]; current: DayPlan; done: number[] }) {
  return (
    <>
      <section className="hero-card">
        <p className="eyebrow">El camino de {child.name}</p>
        <h1>Día {current.day}: {current.title}</h1>
        <p className="muted">15 minutos: {current.sheets.length} ficha{current.sheets.length > 1 ? 's' : ''} para imprimir y {current.games.length} juegos.</p>
        <a className="btn primary big" href={`#/dia/${current.day}`}>Empezar el día {current.day}</a>
      </section>
      <ol className="path">
        {plan.map((d) => {
          const state = done.includes(d.day) ? 'done' : d.day === current.day ? 'now' : 'next'
          return (
            <li key={d.day} className={`${state} ${d.milestone ? 'milestone' : ''}`}>
              <a href={`#/dia/${d.day}`}>
                <span className="node">{state === 'done' ? '⭐' : d.milestone ? '🏁' : d.day}</span>
                <span className="lbl"><b>{d.title}</b>{d.milestone && <small>{d.milestone}</small>}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function DayView({ day, child, done }: { day: DayPlan; child: Child; done: number[] }) {
  const [preview, setPreview] = useState<SheetOptions | null>(null)
  const isDone = done.includes(day.day)
  return (
    <>
      <a className="back" href="#/">← Camino</a>
      <p className="eyebrow">Día {day.day} de 21</p>
      <h1>{day.title}</h1>
      {day.letters.length > 0 && <div className="letters-big">{day.letters.map((l) => <span key={l}>{l.toUpperCase()}{l}</span>)}</div>}
      <div className="tip">💡 <b>Para mamá o papá:</b> {day.tip}</div>

      <h2>1 · Juegos en la pantalla <small>5 min</small></h2>
      <div className="grid">
        {day.games.map((g) => (
          <a key={g} className="game-card" href={`#/juego/${g}/${day.day}`}><span className="e">{GAMES[g].e}</span><b>{GAMES[g].label}</b><small>{GAMES[g].desc}</small></a>
        ))}
      </div>

      <h2>2 · Fichas en papel <small>10 min</small></h2>
      <div className="grid">
        {day.sheets.map((sh, i) => {
          const meta = SHEETS.find((x) => x.kind === sh.kind)!
          return (
            <button key={i} className="game-card" onClick={() => setPreview({ ...sh, seed: Date.now() })}>
              <span className="e">{meta.e}</span><b>{meta.label}{sh.letter ? ` · ${sh.letter.toUpperCase()}` : ''}</b><small>Ver e imprimir</small>
            </button>
          )
        })}
      </div>

      <button className={`btn big ${isDone ? '' : 'primary'} finish`} onClick={() => { if (!isDone) actions.completeDay(day.day); go('/') }}>
        {isDone ? 'Día completado ⭐' : `¡Terminamos el día ${day.day}!`}
      </button>
      {preview && <PrintModal child={child} opts={preview} onClose={() => setPreview(null)} />}
    </>
  )
}

/* ---------- Generador de fichas ---------- */
function SheetsPage({ child, letters }: { child: Child; letters: string[] }) {
  const [kind, setKind] = useState<SheetKind>('nombre')
  const [letter, setLetter] = useState(letters[0] ?? 'a')
  const [seed, setSeed] = useState(1)
  const meta = SHEETS.find((x) => x.kind === kind)!
  const opts = useMemo(() => ({ kind, letter, seed }), [kind, letter, seed])
  return (
    <>
      <div className="no-print">
        <h1>Fichas de {child.name}</h1>
        <p className="muted">Cada ficha sale con su nombre y con palabras de lo que le gusta. Toca "Otra versión" para sortear palabras nuevas.</p>
        <div className="chips">
          {SHEETS.map((s) => <button key={s.kind} className={`chip ${kind === s.kind ? 'on' : ''}`} onClick={() => setKind(s.kind)}>{s.e} {s.label}</button>)}
        </div>
        {meta.needsLetter && (
          <div className="chips letters">
            {ALPHABET.map((l) => <button key={l} className={`chip ${letter === l ? 'on' : ''}`} onClick={() => setLetter(l)}>{l.toUpperCase()}</button>)}
          </div>
        )}
        <div className="row-btns">
          <button className="btn" onClick={() => setSeed(seed + 1)}>🔀 Otra versión</button>
          <button className="btn primary" onClick={() => window.print()}>🖨️ Imprimir o guardar PDF</button>
        </div>
      </div>
      <div className="paper"><Sheet child={child} opts={opts} /></div>
    </>
  )
}

function PrintModal({ child, opts, onClose }: { child: Child; opts: SheetOptions; onClose: () => void }) {
  useEffect(() => { document.body.classList.add('modal-open'); return () => document.body.classList.remove('modal-open') }, [])
  return (
    <div className="modal" role="dialog" aria-modal>
      <div className="modal-bar no-print">
        <button className="btn ghost" onClick={onClose}>✕ Cerrar</button>
        <button className="btn primary" onClick={() => window.print()}>🖨️ Imprimir o guardar PDF</button>
      </div>
      <div className="paper"><Sheet child={child} opts={opts} /></div>
    </div>
  )
}

/* ---------- Juegos libres ---------- */
function GamesPage() {
  return (
    <>
      <h1>Juegos</h1>
      <p className="muted">Cortitos y con voz: tu hijo puede jugar solo. Las letras salen de su camino.</p>
      <div className="grid">
        {(Object.keys(GAMES) as GameId[]).map((g) => (
          <a key={g} className="game-card" href={`#/juego/${g}`}><span className="e">{GAMES[g].e}</span><b>{GAMES[g].label}</b><small>{GAMES[g].desc}</small></a>
        ))}
      </div>
    </>
  )
}

/* ---------- Panel de padres ---------- */
function ParentsPage({ child, plan }: { child: Child; plan: DayPlan[] }) {
  const s = useStore()
  const p = progressOf(s, child.id)
  const learned = Object.entries(p.letters).filter(([, n]) => n >= 2).map(([l]) => l)
  const pct = Math.round((p.daysDone.length / plan.length) * 100)
  return (
    <>
      <h1>Panel para mamá y papá</h1>
      <div className="stats">
        <div><b>{p.daysDone.length}/21</b><small>días completados</small></div>
        <div><b>{streak(p)}</b><small>días seguidos</small></div>
        <div><b>⭐ {p.stars}</b><small>estrellas</small></div>
        <div><b>{learned.length}</b><small>letras dominadas</small></div>
      </div>
      <div className="meter" aria-label={`${pct}% del camino`}><i style={{ width: `${pct}%` }} /></div>

      <h2>Letras de {child.name}</h2>
      <p className="muted">Una letra queda "dominada" cuando la traza bien dos veces en los juegos.</p>
      <div className="chips letters">
        {ALPHABET.map((l) => (
          <span key={l} className={`chip ${learned.includes(l) ? 'on' : child.known.includes(l) ? 'half' : ''}`}>{l.toUpperCase()}</span>
        ))}
      </div>

      <h2>Hijos</h2>
      <div className="kids">
        {s.children.map((c) => (
          <button key={c.id} className={`chip big ${c.id === child.id ? 'on' : ''}`} onClick={() => actions.setActive(c.id)}>{c.name}</button>
        ))}
        <a className="chip big" href="#/nuevo">＋ Agregar otro hijo</a>
      </div>
      <div className="row-btns">
        <a className="btn" href="#/editar">Editar datos de {child.name}</a>
        <button className="btn ghost danger" onClick={() => { if (confirm(`¿Borrar el perfil de ${child.name}?`)) actions.removeChild(child.id) }}>Borrar perfil</button>
      </div>
    </>
  )
}

function Unlock() {
  const [code, setCode] = useState('')
  const [err, setErr] = useState(false)
  return (
    <main className="shell bare onboard">
      <p className="eyebrow">Letra Viva</p>
      <h1>Ingresa tu código de acceso</h1>
      <p className="muted">Está en el correo que te llegó después de la compra.</p>
      <input className="input big" value={code} onChange={(e) => { setCode(e.target.value); setErr(false) }} placeholder="Tu código" />
      {err && <p className="hint">Ese código no es válido. Revisa el correo o escríbenos.</p>}
      <button className="btn primary big" onClick={() => (ACCESS.includes(code.trim().toUpperCase()) ? actions.unlock() : setErr(true))}>Entrar</button>
    </main>
  )
}
