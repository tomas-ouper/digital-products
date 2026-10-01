// Juegos de palabras: sonido inicial, armar la palabra, memoria y sílabas.
import { useEffect, useMemo, useState } from 'react'
import { GameShell, useRounds, type GameProps } from './GameShell'
import { actions, useStore, activeChild } from '../lib/store'
import { ALPHABET, VOWELS, firstLetter, pick, shuffle, strip, vocabFor, type Word } from '../lib/content'
import { cheer, say } from '../lib/speech'

function useVocab() {
  const s = useStore()
  const child = activeChild(s)
  return { child, vocab: useMemo(() => vocabFor(child?.interests ?? []), [child?.interests]) }
}

/* ---------- ¿Con qué letra empieza? ---------- */
export function SoundGame({ letters, onExit, onWin }: GameProps) {
  const { vocab } = useVocab()
  const rounds = useMemo(() => {
    const preferred = vocab.filter((w) => letters.includes(firstLetter(w.w)))
    const pool = [...shuffle(preferred), ...shuffle(vocab.filter((w) => !preferred.includes(w)))]
    return pool.slice(0, 5).map((w) => {
      const right = firstLetter(w.w)
      const wrong = pick(ALPHABET.filter((l) => l !== right && l !== 'ñ' && l !== 'w' && l !== 'k'), 2)
      return { w, options: shuffle([right, ...wrong]), right }
    })
  }, [vocab, letters])
  const { round, done, next, miss, shake } = useRounds(rounds.length)
  const r = rounds[Math.min(round, rounds.length - 1)]
  useEffect(() => { if (!done) setTimeout(() => say(r.w.w), 900) }, [round]) // eslint-disable-line

  return (
    <GameShell title="¿Con qué letra empieza?" round={round} rounds={rounds.length} done={done} onExit={onExit} onWin={onWin}
      instruction="Escucha la palabra y toca la letra con la que empieza">
      <button className={`big-emoji ${shake ? 'shake' : ''}`} onClick={() => say(r.w.w)} aria-label="Escuchar la palabra">{r.w.e}</button>
      <div className="options">
        {r.options.map((l) => (
          <button key={l} className="tile letter" onClick={() => {
            if (l === r.right) { actions.reward({ letter: l, game: 'sonido' }); say(`${cheer()} ${r.w.w} empieza con ${l}`); setTimeout(next, 1400) }
            else { miss(); say('Mmm, escucha otra vez: ' + r.w.w) }
          }}>{l.toUpperCase()} {l}</button>
        ))}
      </div>
    </GameShell>
  )
}

/* ---------- Arma la palabra (la primera es su nombre) ---------- */
export function BuildGame({ onExit, onWin }: GameProps) {
  const { child, vocab } = useVocab()
  const words = useMemo<Word[]>(() => {
    const name = strip((child?.name ?? 'mamá').toLowerCase().trim()).replace(/[^a-zñ]/g, '')
    return [{ w: name, e: '🧒' }, ...pick(vocab.filter((w) => w.w.length <= 6), 2)]
  }, [child?.name, vocab])
  const { round, done, next, miss, shake } = useRounds(words.length)
  const word = words[Math.min(round, words.length - 1)]
  const target = strip(word.w)
  const [placed, setPlaced] = useState<number[]>([])
  const tiles = useMemo(() => shuffle([...target].map((c, i) => ({ c, i }))), [target])
  useEffect(() => { setPlaced([]); if (!done) setTimeout(() => say(round === 0 ? `Arma tu nombre: ${child?.name}` : word.w), 900) }, [round]) // eslint-disable-line

  function tap(t: { c: string; i: number }) {
    if (placed.includes(t.i)) return
    const expected = target[placed.length]
    if (t.c === expected) {
      const np = [...placed, t.i]
      setPlaced(np)
      say(t.c, 1)
      if (np.length === target.length) { actions.reward({ game: 'armar' }); setTimeout(() => say(`${cheer()} ${word.w}`), 500); setTimeout(next, 1800) }
    } else miss()
  }

  return (
    <GameShell title={round === 0 ? 'Arma tu nombre' : 'Arma la palabra'} round={round} rounds={words.length} done={done} onExit={onExit} onWin={onWin}
      instruction="Toca las letras en orden para armar la palabra">
      <button className="big-emoji small" onClick={() => say(word.w)}>{word.e}</button>
      <div className={`slots ${shake ? 'shake' : ''}`}>
        {[...target].map((c, i) => <span key={i} className={i < placed.length ? 'slot on' : 'slot'}>{i < placed.length ? (i === 0 ? c.toUpperCase() : c) : ''}</span>)}
      </div>
      <div className="options wrap">
        {tiles.map((t) => (
          <button key={t.i} className={`tile letter ${placed.includes(t.i) ? 'used' : ''}`} onClick={() => tap(t)} disabled={placed.includes(t.i)}>{t.c}</button>
        ))}
      </div>
    </GameShell>
  )
}

/* ---------- Memoria: dibujo con palabra ---------- */
export function MemoryGame({ onExit, onWin }: GameProps) {
  const { vocab } = useVocab()
  const cards = useMemo(() => {
    const ws = pick(vocab.filter((w) => w.w.length <= 7), 4)
    return shuffle(ws.flatMap((w) => [{ id: w.w + 'e', key: w.w, show: w.e, emoji: true }, { id: w.w + 'w', key: w.w, show: w.w, emoji: false }]))
  }, [vocab])
  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<string[]>([])
  const done = found.length === 4

  function flip(c: (typeof cards)[number]) {
    if (open.length === 2 || open.includes(c.id) || found.includes(c.key)) return
    const o = [...open, c.id]
    setOpen(o)
    if (!c.emoji) say(c.key)
    if (o.length === 2) {
      const [a, b] = o.map((id) => cards.find((x) => x.id === id)!)
      if (a.key === b.key) {
        setTimeout(() => { setFound((f) => [...f, a.key]); setOpen([]); say(cheer()); actions.reward({ game: 'memoria', stars: 0 }) }, 500)
      } else setTimeout(() => setOpen([]), 1100)
    }
  }

  return (
    <GameShell title="Memoria" round={found.length} rounds={4} done={done} onExit={onExit} onWin={onWin}
      instruction="Encuentra cada dibujo con su palabra">
      <div className="memory">
        {cards.map((c) => {
          const up = open.includes(c.id) || found.includes(c.key)
          return (
            <button key={c.id} className={`card ${up ? 'up' : ''} ${found.includes(c.key) ? 'found' : ''}`} onClick={() => flip(c)}>
              {up ? <span className={c.emoji ? 'e' : 'w'}>{c.show}</span> : <span className="back">?</span>}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}

/* ---------- Sílabas: escucha y toca ---------- */
export function SyllableGame({ letters, onExit, onWin }: GameProps) {
  const consonants = letters.filter((l) => !VOWELS.includes(l))
  const pool = consonants.length ? consonants : ['m', 'p', 'l', 's']
  const rounds = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const c = pool[i % pool.length]
    const opts = VOWELS.map((v) => syl(c, v))
    const right = opts[Math.floor(Math.random() * opts.length)]
    return { right, options: shuffle([right, ...pick(opts.filter((o) => o !== right), 2)]) }
  }), [pool.join('')]) // eslint-disable-line
  const { round, done, next, miss, shake } = useRounds(rounds.length)
  const r = rounds[Math.min(round, rounds.length - 1)]
  useEffect(() => { if (!done) setTimeout(() => say(r.right, 0.7), 900) }, [round]) // eslint-disable-line

  return (
    <GameShell title="Sílabas" round={round} rounds={rounds.length} done={done} onExit={onExit} onWin={onWin}
      instruction="Escucha y toca la sílaba que suena">
      <button className={`big-emoji ${shake ? 'shake' : ''}`} onClick={() => say(r.right, 0.7)} aria-label="Escuchar otra vez">🔊</button>
      <div className="options">
        {r.options.map((o) => (
          <button key={o} className="tile syl" onClick={() => {
            if (o === r.right) { actions.reward({ game: 'silabas' }); say(cheer()); setTimeout(next, 1100) } else { miss(); say(r.right, 0.7) }
          }}>{o}</button>
        ))}
      </div>
    </GameShell>
  )
}

function syl(c: string, v: string) {
  if (c === 'c') return { a: 'ca', e: 'que', i: 'qui', o: 'co', u: 'cu' }[v]!
  if (c === 'g') return { a: 'ga', e: 'gue', i: 'gui', o: 'go', u: 'gu' }[v]!
  if (c === 'q') return { a: 'ca', e: 'que', i: 'qui', o: 'co', u: 'cu' }[v]!
  return c + v
}
