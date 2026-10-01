import { useEffect, useState, type ReactNode } from 'react'
import { say } from '../lib/speech'

export type GameProps = { letters: string[]; onExit: () => void; onWin: () => void }

/** Marco común de los juegos: barra superior, rondas y festejo final. */
export function GameShell(props: {
  title: string; round: number; rounds: number; done: boolean; onExit: () => void; onWin: () => void
  children: ReactNode; instruction: string
}) {
  const { title, round, rounds, done, onExit, onWin, children, instruction } = props
  useEffect(() => { say(instruction) }, [instruction])
  useEffect(() => { if (done) { say('¡Lo lograste! Ganaste una estrella'); onWin() } }, [done]) // eslint-disable-line
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
          <div className="win-star">⭐</div>
          <h2>¡Lo lograste!</h2>
          <p>Ganaste una estrella.</p>
          <button className="btn primary big" onClick={onExit}>Seguir</button>
        </div>
      ) : (
        <>
          <button className="instruction" onClick={() => say(instruction)}>🔊 {instruction}</button>
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

/** Hook de rondas: avanza, marca el fin y da feedback de error con vibración suave. */
export function useRounds(rounds: number) {
  const [round, setRound] = useState(0)
  const [shake, setShake] = useState(false)
  return {
    round, done: round >= rounds, shake,
    next: () => setRound((r) => r + 1),
    miss: () => { setShake(true); navigator.vibrate?.(80); setTimeout(() => setShake(false), 450) },
  }
}
