import { useEffect, useMemo, useState } from 'react'
import { actions, activeChild, family, progressOf, streak, useStore, type Child } from './lib/store'
import { ALPHABET, buildPlan, cap, type DayPlan, type GameId, type SheetKind } from './lib/content'
import { themeById } from './lib/themes'
import { PresetSheet } from './components/Sheet'
import { ProfileForm } from './pages/ProfileForm'
import { SheetEditor } from './pages/SheetEditor'
import { MailPreview, Reset, SignIn, SignUp, Welcome } from './pages/Auth'
import { TraceGame } from './games/TraceGame'
import { BuildGame, CompleteGame, HuntGame, MemoryGame, ReadGame, SoundGame } from './games/WordGames'
import type { GameProps } from './games/GameShell'

/* ---------- Ruteo por hash: sin dependencias ---------- */
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
  caza: { label: 'Caza la letra', e: '🎯', desc: 'Toca todas las iguales', C: HuntGame },
  sonido: { label: '¿Con qué empieza?', e: '👂', desc: 'Escucha y elige la letra', C: SoundGame },
  leer: { label: 'Lee y elige', e: '📖', desc: 'Lee la palabra, toca el dibujo', C: ReadGame },
  completa: { label: 'Completa la palabra', e: '🧩', desc: 'La sílaba que falta', C: CompleteGame },
  armar: { label: 'Arma la palabra', e: '🔤', desc: 'Empieza por su nombre', C: BuildGame },
  memoria: { label: 'Memoria', e: '🃏', desc: 'Dibujo con su palabra', C: MemoryGame },
}

export const SHEETS: { kind: SheetKind; label: string; e: string; needsLetter?: boolean; minLevel?: number }[] = [
  { kind: 'nombre', label: 'Su nombre', e: '✏️' },
  { kind: 'letra', label: 'Letra del día', e: '🔤', needsLetter: true },
  { kind: 'palabras', label: 'Palabras de su mundo', e: '🌎' },
  { kind: 'frases', label: 'Frases con su gente', e: '💬', minLevel: 2 },
  { kind: 'silabas', label: 'Completa la palabra', e: '🧩', needsLetter: true },
  { kind: 'unir', label: 'Une dibujo y palabra', e: '🔗' },
  { kind: 'diploma', label: 'Diploma', e: '🏅' },
  { kind: 'cartel', label: 'Cartel para su puerta', e: '🚪' },
]

export default function App() {
  const s = useStore()
  const route = useRoute()
  const child = activeChild(s)

  // Sin sesión: bienvenida, registro, ingreso y vista del correo
  if (route[0] === 'mail') return <MailPreview />
  if (!s.session) {
    if (route[0] === 'registro') return <SignUp />
    if (route[0] === 'ingresar') return <SignIn />
    if (route[0] === 'recuperar') return <Reset />
    return <Welcome />
  }
  if (!child || route[0] === 'nuevo') return <Frame bare><ProfileForm onDone={() => go('/')} /></Frame>
  if (route[0] === 'editar') return <Frame bare><ProfileForm initial={child} onDone={() => go('/padres')} /></Frame>

  const plan = buildPlan(child)
  const p = progressOf(s, child.id)
  const letters = plan.flatMap((d) => d.letters)
  const currentDay = plan.find((d) => !p.daysDone.includes(d.day)) ?? plan[plan.length - 1]

  if (route[0] === 'juego' && route[1] in GAMES) {
    const G = GAMES[route[1] as GameId].C
    const day = route[2] ? plan[Number(route[2]) - 1] : undefined
    const ls = day?.letters.length ? day.letters : currentDay.letters
    // key: si cambia de chico o de juego, la partida empieza de cero
    return <Frame bare><G key={`${child.id}-${route.join('/')}`} letters={ls} onExit={() => history.back()} onWin={() => actions.reward({ stars: 1 })} /></Frame>
  }

  return (
    <Frame child={child} stars={p.stars} tab={route[0] ?? ''}>
      {route[0] === 'dia' ? <DayView day={plan[Number(route[1]) - 1] ?? currentDay} child={child} done={p.daysDone} />
        : route[0] === 'fichas' ? <SheetsPage child={child} letters={letters} />
        : route[0] === 'juegos' ? <GamesPage child={child} />
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
        {child && <span className="who">{child.mascot} {child.name} · ⭐ {stars}</span>}
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

function WorldChips({ child }: { child: Child }) {
  const items = [...child.themes.map((id) => themeById(id)).filter(Boolean).map((t) => `${t!.e} ${t!.label}`), ...child.people.slice(0, 3).map((p) => `${p.e} ${cap(p.name)}`)]
  if (!items.length) return null
  return <div className="world">{items.map((x) => <span key={x}>{x}</span>)}</div>
}

/* ---------- Camino de 21 días ---------- */
function Home({ child, plan, current, done }: { child: Child; plan: DayPlan[]; current: DayPlan; done: number[] }) {
  return (
    <>
      <section className="hero-card">
        <div className="hero-buddy"><span>{child.mascot}</span><p>¡Hola, {child.name}! Hoy jugamos con {current.letters.length ? current.letters.map((l) => l.toUpperCase()).join(' y ') : 'tu nombre'}.</p></div>
        <p className="eyebrow">El camino de {child.name}</p>
        <h1>Día {current.day}: {current.title}</h1>
        <p className="muted">15 minutos: {current.games.length} juegos y {current.sheets.length} fichas para imprimir.</p>
        <WorldChips child={child} />
        <a className="btn primary big" href={`#/dia/${current.day}`}>Empezar el día {current.day}</a>
      </section>
      <ol className="path">
        {plan.map((d) => {
          const state = done.includes(d.day) ? 'done' : d.day === current.day ? 'now' : 'next'
          return (
            <li key={d.day} className={`${state} ${d.milestone ? 'milestone' : ''}`}>
              <a href={`#/dia/${d.day}`}>
                <span className="node">{state === 'done' ? '⭐' : state === 'now' ? child.mascot : d.milestone ? '🏁' : d.day}</span>
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
  const [preview, setPreview] = useState<{ kind: SheetKind; letter?: string; seed: number } | null>(null)
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
        <a className="game-card dashed" href="#/fichas"><span className="e">🛠️</span><b>Crear la mía</b><small>Con tus propias palabras</small></a>
      </div>

      <button className={`btn big ${isDone ? '' : 'primary'} finish`} onClick={() => { if (!isDone) actions.completeDay(day.day); go('/') }}>
        {isDone ? 'Día completado ⭐' : `¡Terminamos el día ${day.day}!`}
      </button>
      {preview && <PrintModal child={child} preview={preview} onClose={() => setPreview(null)} />}
    </>
  )
}

/* ---------- Fichas: editor propio y fichas listas ---------- */
function SheetsPage({ child, letters }: { child: Child; letters: string[] }) {
  const [tab, setTab] = useState<'crear' | 'listas'>('crear')
  return (
    <>
      <div className="seg big-seg no-print" role="tablist">
        <button role="tab" aria-selected={tab === 'crear'} className={tab === 'crear' ? 'on' : ''} onClick={() => setTab('crear')}>🛠️ Crear la mía</button>
        <button role="tab" aria-selected={tab === 'listas'} className={tab === 'listas' ? 'on' : ''} onClick={() => setTab('listas')}>📄 Listas para imprimir</button>
      </div>
      {tab === 'crear' ? <SheetEditor key={child.id} child={child} /> : <Presets child={child} letters={letters} />}
    </>
  )
}

function Presets({ child, letters }: { child: Child; letters: string[] }) {
  const options = SHEETS.filter((x) => !x.minLevel || child.level >= x.minLevel)
  const [kind, setKind] = useState<SheetKind>('nombre')
  const [letter, setLetter] = useState(letters[0] ?? 'a')
  const [seed, setSeed] = useState(1)
  const meta = SHEETS.find((x) => x.kind === kind)!
  return (
    <>
      <div className="no-print">
        <h1>Fichas de {child.name}</h1>
        <p className="muted">Salen con su nombre y con las palabras de su mundo. "Otra versión" sortea palabras nuevas.</p>
        <div className="chips">
          {options.map((s) => <button key={s.kind} className={`chip ${kind === s.kind ? 'on' : ''}`} onClick={() => setKind(s.kind)}>{s.e} {s.label}</button>)}
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
      <div className="paper"><PresetSheet child={child} kind={kind} letter={letter} seed={seed} /></div>
    </>
  )
}

function PrintModal({ child, preview, onClose }: { child: Child; preview: { kind: SheetKind; letter?: string; seed: number }; onClose: () => void }) {
  useEffect(() => { document.body.classList.add('modal-open'); return () => document.body.classList.remove('modal-open') }, [])
  return (
    <div className="modal" role="dialog" aria-modal>
      <div className="modal-bar no-print">
        <button className="btn ghost" onClick={onClose}>✕ Cerrar</button>
        <button className="btn primary" onClick={() => window.print()}>🖨️ Imprimir o guardar PDF</button>
      </div>
      <div className="paper"><PresetSheet child={child} kind={preview.kind} letter={preview.letter} seed={preview.seed} /></div>
    </div>
  )
}

/* ---------- Juegos libres ---------- */
function GamesPage({ child }: { child: Child }) {
  const ids = (Object.keys(GAMES) as GameId[]).filter((g) => child.level > 1 || g !== 'leer')
  return (
    <>
      <h1>Juegos de {child.name}</h1>
      <p className="muted">Cortitos, con voz y con las palabras de su mundo. {child.mascot} lo acompaña en cada uno.</p>
      <WorldChips child={child} />
      <div className="grid">
        {ids.map((g) => (
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
  const kids = family(s).children
  const games = useMemo(() => Object.entries(p.games).sort((a, b) => b[1] - a[1]).slice(0, 3), [p.games])
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
      {games.length > 0 && <p className="muted">Lo que más juega: {games.map(([g, n]) => `${GAMES[g as GameId]?.label ?? g} (${n})`).join(', ')}.</p>}

      <h2>Letras de {child.name}</h2>
      <p className="muted">Una letra queda "dominada" cuando la acierta dos veces en los juegos.</p>
      <div className="chips letters">
        {ALPHABET.map((l) => <span key={l} className={`chip ${learned.includes(l) ? 'on' : child.known.includes(l) ? 'half' : ''}`}>{l.toUpperCase()}</span>)}
      </div>

      <h2>El mundo de {child.name}</h2>
      <WorldChips child={child} />
      <p className="muted">{child.words.length ? `Palabras suyas: ${child.words.map((w) => `${w.e} ${w.w}`).join(', ')}.` : 'Todavía no agregaste palabras propias.'}</p>
      <a className="btn" href="#/editar">Editar sus gustos y su gente</a>

      <h2>Hijos</h2>
      <div className="kids">
        {kids.map((c) => <button key={c.id} className={`chip big ${c.id === child.id ? 'on' : ''}`} onClick={() => actions.setActive(c.id)}>{c.mascot} {c.name}</button>)}
        <a className="chip big" href="#/nuevo">＋ Agregar otro hijo</a>
      </div>

      <h2>Cuenta</h2>
      <p className="muted">Ingresaste como <b>{s.session}</b>.</p>
      <div className="row-btns">
        <button className="btn" onClick={() => { actions.setSession(null); go('/bienvenida') }}>Cerrar sesión</button>
        <RemoveChild child={child} />
      </div>
    </>
  )
}

function RemoveChild({ child }: { child: Child }) {
  const [ask, setAsk] = useState(false)
  if (!ask) return <button className="btn ghost danger" onClick={() => setAsk(true)}>Borrar el perfil de {child.name}</button>
  return (
    <span className="confirm">¿Seguro? Se borra su progreso.
      <button className="btn danger" onClick={() => actions.removeChild(child.id)}>Sí, borrar</button>
      <button className="btn ghost" onClick={() => setAsk(false)}>Cancelar</button>
    </span>
  )
}
