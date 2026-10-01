import { useEffect, useRef, useState, type ReactNode } from 'react'
import { say } from '../lib/speech'
import { activeChild, useStore, type Child } from '../lib/store'

export type GameProps = { letters: string[]; onExit: () => void; onWin: () => void }

export type Feedback = { kind: 'ok' | 'no'; text: string } | null

/**
 * Estado de una partida. Las rondas se arman UNA sola vez al empezar: aunque la app
 * se vuelva a dibujar (por ejemplo, al sumar una estrella) el contenido no cambia.
 * Mientras se festeja un acierto, los botones quedan bloqueados.
 */
export function useGame<T>(make: () => T[]) {
  const [rounds] = useState(make)
  const [round, setRound] = useState(0)
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const timers = useRef<number[]>([])
  const lock = useRef(false) // ref y no sólo estado: dos toques seguidos no pueden pasar los dos
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  return {
    rounds, round, busy, shake, feedback,
    current: rounds[Math.min(round, rounds.length - 1)],
    done: round >= rounds.length,
    right(text: string, ms = 1300) {
      if (lock.current) return
      lock.current = true
      setBusy(true)
      setFeedback({ kind: 'ok', text })
      later(() => { setFeedback(null); setRound((r) => r + 1); setBusy(false); lock.current = false }, ms)
    },
    wrong(text: string) {
      if (lock.current) return
      setShake(true)
      setFeedback({ kind: 'no', text })
      navigator.vibrate?.(60)
      later(() => setShake(false), 450)
    },
  }
}

/** El chico y su compañero, tomados al montar el juego. */
export function usePlayer(): Child {
  const s = useStore()
  const [child] = useState(() => activeChild(s)!)
  return child
}

/** Marco común: barra superior, compañero que festeja, rondas y pantalla final. */
export function GameShell(props: {
  title: string; round: number; rounds: number; done: boolean; onExit: () => void; onWin: () => void
  children: ReactNode; instruction: string; speakOnStart?: string; feedback?: Feedback; player: Child
}) {
  const { title, round, rounds, done, onExit, onWin, children, instruction, feedback, player } = props
  const won = useRef(false)
  useEffect(() => { say(props.speakOnStart ?? instruction) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (done && !won.current) { won.current = true; say(`¡Lo lograste, ${player.name}! Ganaste una estrella`); onWin() }
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="game">
      <div className="game-bar">
        <button className="btn ghost" onClick={onExit} aria-label="Volver">←</button>
        <b>{title}</b>
        <span className="dots" aria-label={`Ronda ${Math.min(round + 1, rounds)} de ${rounds}`}>
          {Array.from({ length: rounds }, (_, i) => <i key={i} className={i < round ? 'on' : ''} />)}
        </span>
      </div>
      {done ? (
        <div className="win">
          <Confetti />
          <div className="win-star">{player.mascot || '⭐'}</div>
          <h2>¡Lo lograste, {player.name}!</h2>
          <p>Ganaste una estrella ⭐</p>
          <button className="btn primary big" onClick={onExit}>Seguir</button>
        </div>
      ) : (
        <>
          <div className={`buddy ${feedback?.kind ?? ''}`}>
            <span className="buddy-face">{player.mascot || '🦉'}</span>
            <button className="buddy-say" onClick={() => say(instruction)}>{feedback ? feedback.text : `🔊 ${instruction}`}</button>
          </div>
          {children}
        </>
      )}
    </div>
  )
}

export function Confetti() {
  const [pieces] = useState(() => Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.6, hue: [8, 210, 45, 140, 280][i % 5], rot: Math.random() * 360,
  })))
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, background: `hsl(${p.hue} 80% 60%)`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  )
}
