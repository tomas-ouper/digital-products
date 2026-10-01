// Trazar la letra con el dedo. Compara lo dibujado con la forma de la letra:
// gana si cubre buena parte de la letra sin salirse demasiado.
import { useEffect, useRef, useState } from 'react'
import { GameShell, useGame, usePlayer, type GameProps } from './GameShell'
import { actions } from '../lib/store'
import { bankFor, firstLetter, show } from '../lib/content'
import { cheer, letterSound, say } from '../lib/speech'

const SIZE = 600
const FONT = '440px Andika, sans-serif'

export function TraceGame({ letters, onExit, onWin }: GameProps) {
  const player = usePlayer()
  const g = useGame(() => {
    const base = letters.length ? letters : ['a', 'm']
    const bank = bankFor(player, { withEmoji: true })
    const ex = (l: string) => bank.find((w) => firstLetter(w.w) === l)
    return [base[0].toUpperCase(), base[0], (base[1] ?? base[0]).toLowerCase()].map((t) => ({ t, ex: ex(t.toLowerCase()) }))
  })
  const { t: target, ex } = g.current
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hint, setHint] = useState('')

  useEffect(() => {
    clear()
    if (!g.done) {
      const tm = setTimeout(() => say(`Traza la ${target === target.toUpperCase() ? 'mayúscula' : 'minúscula'}. Suena ${letterSound(target.toLowerCase())}${ex ? `, como ${show(ex)}` : ''}`), 700)
      return () => clearTimeout(tm)
    }
  }, [g.round]) // eslint-disable-line react-hooks/exhaustive-deps

  function paintGuide(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = '#E3ECFA'; ctx.fillRect(0, 250, SIZE, 170)
    ctx.strokeStyle = '#C8443A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 420); ctx.lineTo(SIZE, 420); ctx.stroke()
    ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#D4DAE4'; ctx.fillText(target, SIZE / 2, 420)
  }
  function clear() {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    document.fonts?.load(FONT).then(() => { if (!drawing.current) paintGuide(ctx) })
    paintGuide(ctx)
    setHint('')
  }
  function pos(e: React.PointerEvent) {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE }
  }
  function down(e: React.PointerEvent) {
    if (g.busy) return
    drawing.current = true; last.current = pos(e)
    canvas.current!.setPointerCapture(e.pointerId)
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return
    const ctx = canvas.current!.getContext('2d')!
    const p = pos(e)
    ctx.strokeStyle = '#2F62B8'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(last.current!.x, last.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    last.current = p
  }
  function up() { drawing.current = false; last.current = null }

  function check() {
    const ctx = canvas.current!.getContext('2d')!
    const drawn = ctx.getImageData(0, 0, SIZE, SIZE).data
    const m = document.createElement('canvas'); m.width = m.height = SIZE
    const mc = m.getContext('2d')!
    mc.font = FONT; mc.textAlign = 'center'; mc.fillStyle = '#000'; mc.fillText(target, SIZE / 2, 420)
    const mask = mc.getImageData(0, 0, SIZE, SIZE).data
    let inLetter = 0, covered = 0, ink = 0, outside = 0
    for (let i = 0; i < drawn.length; i += 16) {
      const isLetter = mask[i + 3] > 100
      const isInk = drawn[i + 2] > 150 && drawn[i] < 90 // azul del trazo
      if (isLetter) { inLetter++; if (isInk) covered++ }
      if (isInk) { ink++; if (!isLetter) outside++ }
    }
    const coverage = covered / Math.max(1, inLetter)
    const spill = outside / Math.max(1, ink)
    if (coverage > 0.5 && spill < 0.72) {
      actions.reward({ letter: target.toLowerCase(), game: 'trazar', stars: 0 })
      say(`${cheer()} ${player.name}`)
      g.right('¡Qué bien la trazaste!')
    } else {
      const msg = coverage <= 0.5 ? 'Te faltó un poquito de la letra. ¡Prueba otra vez!' : 'Intenta ir por adentro de la letra gris.'
      setHint(msg); g.wrong(msg); say(msg)
    }
  }

  return (
    <GameShell player={player} title="Trazar" round={g.round} rounds={g.rounds.length} done={g.done} onExit={onExit} onWin={onWin}
      instruction="Repasa la letra gris con el dedo" feedback={g.feedback}>
      <div className={`trace ${g.shake ? 'shake' : ''}`}>
        <canvas ref={canvas} width={SIZE} height={SIZE} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      </div>
      {ex && <p className="trace-ex">{ex.e} <b>{show(ex)[0]}</b>{show(ex).slice(1)}</p>}
      {hint && !g.feedback && <p className="hint">{hint}</p>}
      <div className="row-btns">
        <button className="btn" onClick={clear} disabled={g.busy}>Borrar</button>
        <button className="btn primary big" onClick={check} disabled={g.busy}>¡Listo!</button>
      </div>
    </GameShell>
  )
}
