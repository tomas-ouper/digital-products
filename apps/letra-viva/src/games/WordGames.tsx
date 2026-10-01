// Juegos de palabras. Todos usan las palabras de su mundo (su gente, sus temas,
// sus palabras propias) y se arman una sola vez al empezar la partida.
import { useEffect, useState } from 'react'
import { GameShell, useGame, usePlayer, type GameProps } from './GameShell'
import { actions, type Child } from '../lib/store'
import { ALPHABET, bankFor, firstLetter, letters as lettersOf, pick, shuffle, show, strip, syllables, type Word } from '../lib/content'
import { cheer, letterSound, say } from '../lib/speech'

const praise = (c: Child) => `${cheer()} ${c.name}`

/** Palabras con dibujo para jugar; las de las letras del día van primero. */
function wordsFor(child: Child, prefer: string[] = [], n = 5, maxLen?: number): Word[] {
  const bank = bankFor(child, { withEmoji: true, maxLen })
  const first = shuffle(bank.filter((w) => prefer.includes(firstLetter(w.w))))
  const rest = shuffle(bank.filter((w) => !first.includes(w)))
  // Mezcla: hasta 3 de las letras del día y el resto de su mundo, para que no se repita siempre lo mismo
  return shuffle([...first.slice(0, 3), ...rest]).slice(0, n)
}

/* ---------- ¿Con qué letra empieza? ---------- */
export function SoundGame({ letters, onExit, onWin }: GameProps) {
  const player = usePlayer()
  const g = useGame(() => wordsFor(player, letters, 5).map((w) => {
    const right = firstLetter(w.w)
    const wrong = pick(ALPHABET.filter((l) => l !== right && !'ñwkx'.includes(l)), 2)
    return { w, right, options: shuffle([right, ...wrong]) }
  }))
  const r = g.current
  useEffect(() => { if (!g.done) { const t = setTimeout(() => say(show(r.w)), 700); return () => clearTimeout(t) } }, [g.round]) // eslint-disable-line
  return (
    <GameShell player={player} title="¿Con qué letra empieza?" round={g.round} rounds={g.rounds.length} done={g.done} onExit={onExit} onWin={onWin}
      instruction="Escucha la palabra y toca la letra con la que empieza" feedback={g.feedback}>
      <button className={`big-emoji ${g.shake ? 'shake' : ''}`} onClick={() => say(show(r.w))} aria-label="Escuchar la palabra">{r.w.e}</button>
      <div className="options">
        {r.options.map((l) => (
          <button key={l} data-ok={l === r.right || undefined} className={`tile letter ${g.busy && l === r.right ? 'good' : ''}`} disabled={g.busy} onClick={() => {
            if (l === r.right) { actions.reward({ letter: l, game: 'sonido', stars: 0 }); say(`${praise(player)}. ${show(r.w)} empieza con ${letterSound(l)}`); g.right(`¡Sí! ${show(r.w)} empieza con ${l.toUpperCase()}`, 2200) }
            else { say(`Mmm, escucha otra vez: ${show(r.w)}`); g.wrong('Casi. Escucha otra vez 👂') }
          }}>{l.toUpperCase()}{l}</button>
        ))}
      </div>
    </GameShell>
  )
}

/* ---------- Lee y elige el dibujo ---------- */
export function ReadGame({ onExit, onWin }: GameProps) {
  const player = usePlayer()
  const g = useGame(() => {
    const bank = bankFor(player, { withEmoji: true, maxLen: player.level === 1 ? 5 : 8 })
    return pick(bank, 5).map((w) => ({ w, options: shuffle([w, ...pick(bank.filter((x) => x.e !== w.e), 2)]) }))
  })
  const r = g.current
  return (
    <GameShell player={player} title="Lee y elige" round={g.round} rounds={g.rounds.length} done={g.done} onExit={onExit} onWin={onWin}
      instruction="Lee la palabra y toca su dibujo" feedback={g.feedback}>
      <div className={`read-word ${g.shake ? 'shake' : ''}`}>{show(r.w)}</div>
      <button className="btn ghost" onClick={() => say(show(r.w))}>🔊 Ayuda: escuchar</button>
      <div className="options">
        {r.options.map((o) => (
          <button key={o.w} data-ok={o === r.w || undefined} className={`tile pic ${g.busy && o === r.w ? 'good' : ''}`} disabled={g.busy} aria-label={o.w} onClick={() => {
            if (o === r.w) { actions.reward({ game: 'leer', stars: 0 }); say(`${praise(player)}. Dice ${show(r.w)}`); g.right(`¡Sí! Dice "${show(r.w)}"`) }
            else { say('Ese no. Lee otra vez despacito'); g.wrong('Ese no. Léela despacito 👀') }
          }}>{o.e}</button>
        ))}
      </div>
    </GameShell>
  )
}

/* ---------- Completa la palabra con la sílaba que falta ---------- */
export function CompleteGame({ letters, onExit, onWin }: GameProps) {
  const player = usePlayer()
  const g = useGame(() => {
    const pool = wordsFor(player, letters, 30).filter((w) => !w.proper && syllables(w.w).length >= 2 && syllables(w.w).length <= 4)
    const allSyl = [...new Set(pool.flatMap((w) => syllables(w.w)))]
    return pool.slice(0, 5).map((w) => {
      const syl = syllables(w.w)
      const hole = player.level >= 2 ? Math.floor(Math.random() * syl.length) : 0
      const right = syl[hole]
      const distract = pick(allSyl.filter((s) => s !== right), 2)
      const filler = ['ma', 'pe', 'lo', 'su', 'ti'].filter((s) => s !== right && !distract.includes(s))
      return { w, syl, hole, right, options: shuffle([right, ...[...distract, ...filler].slice(0, 2)]) }
    })
  })
  const r = g.current
  return (
    <GameShell player={player} title="Completa la palabra" round={g.round} rounds={g.rounds.length} done={g.done} onExit={onExit} onWin={onWin}
      instruction="Mira el dibujo y toca la sílaba que falta" feedback={g.feedback}>
      <button className="big-emoji small" onClick={() => say(r.w.w)}>{r.w.e}</button>
      <div className={`syl-word ${g.shake ? 'shake' : ''}`}>
        {r.syl.map((s, i) => <span key={i} className={i === r.hole ? (g.busy ? 'hole filled' : 'hole') : ''}>{i === r.hole && !g.busy ? '?' : s}</span>)}
      </div>
      <div className="options">
        {r.options.map((o) => (
          <button key={o} data-ok={o === r.right || undefined} className="tile syl" disabled={g.busy} onClick={() => {
            if (o === r.right) { actions.reward({ game: 'completa', stars: 0 }); say(`${praise(player)}. ${r.w.w}`); g.right(`¡Sí! ${r.w.w}`) }
            else { say(`Esa no. Escucha: ${r.w.w}`); g.wrong('Esa no. Escúchala otra vez 👂') }
          }}>{o}</button>
        ))}
      </div>
    </GameShell>
  )
}

/* ---------- Arma la palabra (la primera siempre es su nombre) ---------- */
export function BuildGame({ onExit, onWin }: GameProps) {
  const player = usePlayer()
  const g = useGame(() => {
    const maxLen = player.level === 1 ? 5 : player.level === 2 ? 7 : 9
    const own = { w: player.name, e: player.mascot || '🧒', proper: true }
    const people = player.people.filter((p) => lettersOf(p.name).length <= maxLen).map((p) => ({ w: p.name, e: p.e, proper: true }))
    const others = wordsFor(player, [], 10, maxLen).filter((w) => !w.proper)
    return [own, ...pick(people, 1), ...others].slice(0, 3)
  })
  const word = g.current
  const target = lettersOf(word.w)
  const [placed, setPlaced] = useState<number[]>([])
  const [tiles, setTiles] = useState(() => shuffle(target.map((c, i) => ({ c, i }))))
  useEffect(() => {
    setPlaced([])
    setTiles(shuffle(lettersOf(g.current.w).map((c, i) => ({ c, i }))))
    if (!g.done) { const t = setTimeout(() => say(g.round === 0 ? `Arma tu nombre: ${player.name}` : show(g.current)), 700); return () => clearTimeout(t) }
  }, [g.round]) // eslint-disable-line

  function tap(t: { c: string; i: number }) {
    if (g.busy || placed.includes(t.i)) return
    const expected = target[placed.length]
    if (t.c === expected) {
      const np = [...placed, t.i]
      setPlaced(np)
      say(letterSound(t.c), 1)
      if (np.length === target.length) { actions.reward({ game: 'armar', stars: 0 }); say(`${praise(player)}. ${show(word)}`); g.right(`¡Armaste "${show(word)}"!`, 1800) }
    } else { say(`Busca la ${letterSound(expected)}`); g.wrong(`Busca la que sigue: ${expected.toUpperCase()} ${expected}`) }
  }

  return (
    <GameShell player={player} title={g.round === 0 ? 'Arma tu nombre' : 'Arma la palabra'} round={g.round} rounds={g.rounds.length} done={g.done} onExit={onExit} onWin={onWin}
      instruction="Toca las letras en orden para armar la palabra" feedback={g.feedback}>
      <button className="big-emoji small" onClick={() => say(show(word))}>{word.e}</button>
      <div className={`slots ${g.shake ? 'shake' : ''}`}>
        {target.map((c, i) => (
          <span key={i} data-c={c} className={i < placed.length ? 'slot on' : 'slot'}>
            {i < placed.length ? (i === 0 && word.proper ? c.toUpperCase() : c) : player.level === 1 ? <i className="ghost">{c}</i> : ''}
          </span>
        ))}
      </div>
      <div className="options wrap">
        {tiles.map((t) => (
          <button key={`${g.round}-${t.i}`} className={`tile letter ${placed.includes(t.i) ? 'used' : ''}`} onClick={() => tap(t)} disabled={placed.includes(t.i) || g.busy}>{t.c}</button>
        ))}
      </div>
    </GameShell>
  )
}

/* ---------- Memoria: dibujo con su palabra ---------- */
export function MemoryGame({ onExit, onWin }: GameProps) {
  const player = usePlayer()
  const pairs = player.level === 1 ? 3 : player.level === 2 ? 4 : 6
  const [cards] = useState(() => {
    const ws = pick(bankFor(player, { withEmoji: true, maxLen: 8 }).filter((w, i, a) => a.findIndex((x) => x.e === w.e) === i), pairs)
    return shuffle(ws.flatMap((w) => [{ id: w.w + ':e', key: w.w, emoji: true, w }, { id: w.w + ':w', key: w.w, emoji: false, w }]))
  })
  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'no'; text: string } | null>(null)
  const done = found.length === pairs

  function flip(c: (typeof cards)[number]) {
    if (open.length === 2 || open.includes(c.id) || found.includes(c.key)) return
    const o = [...open, c.id]
    setOpen(o)
    say(show(c.w))
    if (o.length === 2) {
      const [a, b] = o.map((id) => cards.find((x) => x.id === id)!)
      if (a.key === b.key) {
        setTimeout(() => { setFound((f) => [...f, a.key]); setOpen([]); setFeedback({ kind: 'ok', text: `¡Pareja! ${a.w.e} ${show(a.w)}` }); say(praise(player)) }, 500)
      } else setTimeout(() => { setOpen([]); setFeedback({ kind: 'no', text: 'No son pareja. ¡Sigue buscando!' }) }, 1100)
    }
  }

  return (
    <GameShell player={player} title="Memoria" round={found.length} rounds={pairs} done={done} onExit={onExit} onWin={onWin}
      instruction="Encuentra cada dibujo con su palabra" feedback={feedback}>
      <div className={`memory p${pairs}`}>
        {cards.map((c) => {
          const up = open.includes(c.id) || found.includes(c.key)
          return (
            <button key={c.id} data-key={c.key} className={`card ${up ? 'up' : ''} ${found.includes(c.key) ? 'found' : ''}`} onClick={() => flip(c)} aria-label={up ? show(c.w) : 'Carta tapada'}>
              {up ? <span className={c.emoji ? 'e' : 'w'}>{c.emoji ? c.w.e : show(c.w)}</span> : <span className="back">{player.mascot || '?'}</span>}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}

/* ---------- Caza la letra: tocar todas las que son iguales ---------- */
export function HuntGame({ letters, onExit, onWin }: GameProps) {
  const player = usePlayer()
  const g = useGame(() => {
    const base = letters.length ? letters : ['a', 'm']
    const targets = [...base, ...pick(lettersOf(player.name).filter((l) => !base.includes(l)), 3)].slice(0, 3)
    return targets.map((t) => {
      const n = 4
      const others = ALPHABET.filter((l) => l !== t && !'ñwkx'.includes(l))
      const cells = shuffle([
        ...Array.from({ length: n }, (_, i) => ({ c: i % 2 ? t.toUpperCase() : t, hit: true })),
        ...pick(others, 8).map((l, i) => ({ c: i % 3 ? l : l.toUpperCase(), hit: false })),
      ]).map((x, i) => ({ ...x, id: i }))
      return { t, cells, n }
    })
  })
  const r = g.current
  const [got, setGot] = useState<number[]>([])
  useEffect(() => { setGot([]); if (!g.done) { const t = setTimeout(() => say(`Caza todas las ${letterSound(g.current.t)}. Mayúsculas y minúsculas`), 600); return () => clearTimeout(t) } }, [g.round]) // eslint-disable-line
  const deco = [player.mascot, ...bankFor(player, { withEmoji: true }).slice(0, 6).map((w) => w.e)]

  return (
    <GameShell player={player} title="Caza la letra" round={g.round} rounds={g.rounds.length} done={g.done} onExit={onExit} onWin={onWin}
      instruction="Toca todas las letras iguales a la de arriba" feedback={g.feedback}>
      <div className="hunt-target">{r.t.toUpperCase()}{r.t} <small>{got.length}/{r.n}</small></div>
      <div className={`hunt ${g.shake ? 'shake' : ''}`}>
        {r.cells.map((cell) => (
          <button key={`${g.round}-${cell.id}`} data-ok={cell.hit || undefined} className={`hunt-cell ${got.includes(cell.id) ? 'got' : ''}`} disabled={g.busy || got.includes(cell.id)} onClick={() => {
            if (cell.hit) {
              const ng = [...got, cell.id]
              setGot(ng)
              say(letterSound(r.t), 1)
              if (ng.length === r.n) { actions.reward({ letter: r.t, game: 'caza', stars: 0 }); say(praise(player)); g.right(`¡Cazaste todas las ${r.t.toUpperCase()}!`) }
            } else { say(`Esa es la ${letterSound(strip(cell.c.toLowerCase()))}`); g.wrong(`Esa es otra letra: ${cell.c}`) }
          }}>
            {got.includes(cell.id) ? <span>{deco[cell.id % deco.length]}</span> : cell.c}
          </button>
        ))}
      </div>
    </GameShell>
  )
}

