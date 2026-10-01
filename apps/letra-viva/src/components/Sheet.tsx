// Fichas imprimibles en A4. Todo es SVG en milímetros (viewBox 210×297): se ve igual
// en pantalla, en PDF y en la impresora. Una ficha es una lista de renglones con un
// estilo; si no entra en una hoja, sigue en la siguiente.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Child } from '../lib/store'
import { bankFor, cap, firstLetter, personalWords, pick, sentencesFor, shuffle, show, strip, syllables, type SheetKind, type Word } from '../lib/content'
import { themeById } from '../lib/themes'
import { fontFor } from '../lib/fonts'

export type Mode = 'modelo' | 'modelo-repaso' | 'gris' | 'punteado' | 'contorno' | 'modelo-vacio' | 'vacio'
export type Pauta = 'montessori' | 'doble' | 'simple' | 'cuadricula'
export type Size = 'grande' | 'mediana' | 'chica'
export type FontChoice = 'imprenta' | 'cursiva' | 'mayusculas'

export type SheetRow = { id: string; text: string; mode: Mode; repeat: boolean; e?: string }
export type SheetStyle = { font: FontChoice; size: Size; pauta: Pauta; images: boolean }
export type LetterBox = { letter: string; examples: Word[] }
export type SheetDoc = { title: string; hint?: string; rows: SheetRow[]; style: SheetStyle; letterBox?: LetterBox }

const W = 210, H = 297, M = 14
const C = {
  ink: '#18223A', soft: '#4A5672', faint: '#9AA4B8',
  band: '#E3ECFA', xline: '#8FB0E6', base: '#C8443A', guide: '#C9D5E4', grey: '#C3CAD6', grid: '#DCE4EE',
}
const ROW_H: Record<Size, number> = { grande: 21, mediana: 15, chica: 11 }
const GAP: Record<Size, number> = { grande: 6, mediana: 5, chica: 4 }
const TOP = 40, BOTTOM = H - 16

let rid = 0
export const newRow = (text: string, mode: Mode, repeat = true, e?: string): SheetRow => ({ id: `r${++rid}`, text, mode, repeat, e })

/** Familia con respaldo: si la tipografía no cargó, que no caiga en una letra con serifas. */
const ff = (font: string) => `"${font}", Andika, Nunito, sans-serif`

/* ---------- Medición real del texto (en mm) con la tipografía cargada ---------- */
const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
function measure(text: string, font: string, fs: number) {
  if (!ctx) return text.length * fs * 0.55
  ctx.font = `${fs * 10}px ${ff(font)}`
  return ctx.measureText(text).width / 10
}
/** Vuelve a dibujar cuando terminan de cargar las tipografías (cambian los anchos). */
function useFontsReady() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const f = document.fonts
    if (!f) return
    const on = () => setTick((t) => t + 1)
    f.ready.then(on)
    f.addEventListener?.('loadingdone', on)
    return () => f.removeEventListener?.('loadingdone', on)
  }, [])
}

/* ---------- Fichas prearmadas ---------- */
export function presetDoc(kind: SheetKind, child: Child, letter = 'a'): SheetDoc | null {
  const name = cap(child.name)
  const style: SheetStyle = { font: child.script, size: 'grande', pauta: 'montessori', images: true }
  switch (kind) {
    case 'nombre':
      return {
        title: 'Escribo mi nombre', hint: 'Primero repasa con el dedo. Después con lápiz, de izquierda a derecha.', style,
        rows: [newRow(name, 'modelo', false, child.mascot), newRow(name, 'gris'), newRow(name, 'gris'), newRow(name, 'gris'),
          newRow(name, 'punteado'), newRow(name, 'punteado'), newRow(name, 'modelo-vacio', false), newRow('', 'vacio'), newRow('', 'vacio')],
      }
    case 'letra': {
      const bank = bankFor(child, { withEmoji: true })
      const starts = bank.filter((w) => firstLetter(w.w) === letter)
      const has = bank.filter((w) => !starts.includes(w) && strip(w.w.toLowerCase()).includes(letter))
      const examples = [...starts, ...has].slice(0, 3)
      return {
        title: `La letra ${letter.toUpperCase()} ${letter}`, style, letterBox: { letter, examples },
        rows: [newRow(letter.toUpperCase(), 'gris'), newRow(letter.toUpperCase(), 'punteado'), newRow(letter, 'gris'), newRow(letter, 'punteado'),
          ...examples.slice(0, 2).map((w) => newRow(show(w), 'modelo-repaso', true, w.e)), newRow('', 'vacio')],
      }
    }
    case 'palabras': {
      const words = pick(personalWords(child).filter((w) => w.e), 6)
      return {
        title: 'Palabras de mi mundo', hint: 'Di la palabra en voz alta, repásala y después escríbela sola.', style: { ...style, size: 'mediana' },
        rows: words.flatMap((w) => [newRow(show(w), 'modelo-repaso', true, w.e), newRow('', 'vacio')]),
      }
    }
    case 'frases':
      return {
        title: 'Mis frases', hint: 'Lee la frase con ayuda, cópiala debajo y haz un dibujo.', style: { ...style, size: 'mediana' },
        rows: pick(sentencesFor(child), 5).flatMap((s) => [newRow(s, 'modelo', false), newRow('', 'vacio')]),
      }
    default:
      return null
  }
}

/* ---------- Render de una ficha por renglones, con paginado ---------- */
export function SheetPages({ child, doc }: { child: Child; doc: SheetDoc }) {
  useFontsReady()
  const font = doc.style.font === 'cursiva' ? fontFor('cursiva', child.country) : 'Andika'
  const cursive = doc.style.font === 'cursiva'
  const h = ROW_H[doc.style.size] * (cursive ? 1.1 : 1)
  const gap = GAP[doc.style.size]
  const pages = useMemo(() => {
    const out: SheetRow[][] = [[]]
    let y = TOP + (doc.hint ? 4 : 0) + (doc.letterBox ? 52 : 0)
    for (const r of doc.rows) {
      if (y + h > BOTTOM) { out.push([]); y = TOP }
      out[out.length - 1].push(r)
      y += h + gap
    }
    return out
  }, [doc, h, gap])
  return (
    <div className="pages">
      {pages.map((rows, pi) => (
        <Page key={pi} child={child} title={doc.title} page={pi + 1} pages={pages.length}>
          {pi === 0 && doc.hint && <Hint y={TOP - 3} text={doc.hint} />}
          {pi === 0 && doc.letterBox && <LetterBoxView box={doc.letterBox} font={font} y={TOP + (doc.hint ? 4 : 0)} />}
          {rows.map((r, i) => {
            const y0 = (pi === 0 ? TOP + (doc.hint ? 4 : 0) + (doc.letterBox ? 52 : 0) : TOP) + i * (h + gap)
            return <Row key={r.id} row={r} y={y0} h={h} font={font} style={doc.style} />
          })}
        </Page>
      ))}
    </div>
  )
}

function Page({ child, title, page, pages, children, header = true }: { child: Child; title: string; page?: number; pages?: number; children: ReactNode; header?: boolean }) {
  const name = cap(child.name)
  const icons = [child.mascot, ...child.themes.map((t) => themeById(t)?.e)].filter(Boolean).slice(0, 3).join(' ')
  return (
    <svg className="sheet" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
      <rect width={W} height={H} fill="#fff" />
      {header && (
        <g>
          <text x={M} y={18} fontFamily="Fredoka, sans-serif" fontSize={9} fontWeight={700} fill={C.ink}>{title}</text>
          <text x={M} y={27} fontFamily="Nunito, sans-serif" fontSize={4.4} fill={C.soft}>Nombre: {name}    Fecha: ____ / ____</text>
          <text x={W - M} y={22} textAnchor="end" fontSize={10}>{icons}</text>
          <line x1={M} x2={W - M} y1={32} y2={32} stroke={C.guide} strokeWidth={0.4} />
        </g>
      )}
      {children}
      <text x={W / 2} y={H - 7} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={2.6} fill={C.faint}>
        Letra Viva · ficha hecha para {name}{child.hand === 'zurdo' ? ' · zurdo: inclinar la hoja hacia la derecha' : ''}{pages && pages > 1 ? ` · hoja ${page} de ${pages}` : ''}
      </text>
    </svg>
  )
}

function Hint({ y, text }: { y: number; text: string }) {
  return <text x={M} y={y} fontFamily="Nunito, sans-serif" fontSize={3.8} fontStyle="italic" fill={C.soft}>{text}</text>
}

function LetterBoxView({ box, font, y }: { box: LetterBox; font: string; y: number }) {
  return (
    <g transform={`translate(${M}, ${y})`}>
      <rect width={52} height={44} rx={4} fill={C.band} />
      <text x={26} y={34} textAnchor="middle" fontFamily={ff(font)} fontSize={30} fill={C.ink}>{box.letter.toUpperCase()}{box.letter}</text>
      <text x={60} y={12} fontFamily="Nunito, sans-serif" fontSize={5} fontWeight={700} fill={C.ink}>Suena así:</text>
      {box.examples.map((w, i) => (
        <text key={w.w} x={60} y={23 + i * 9} fontFamily="Nunito, sans-serif" fontSize={6.2} fill={C.soft}>{w.e} {hl(show(w), box.letter)}</text>
      ))}
    </g>
  )
}

function hl(word: string, l: string) {
  const i = [...strip(word.toLowerCase())].indexOf(l)
  if (i < 0) return word
  return <>{word.slice(0, i)}<tspan fontWeight={800} fill={C.base}>{word[i]}</tspan>{word.slice(i + 1)}</>
}

/** Un renglón: pauta, dibujo opcional y el texto en el modo elegido. */
function Row({ row, y, h, font, style }: { row: SheetRow; y: number; h: number; font: string; style: SheetStyle }) {
  const cursive = style.font === 'cursiva'
  const img = style.images && row.e
  const x = M + (img ? 15 : 0)
  const w = W - 2 * M - (img ? 15 : 0)
  const text = style.font === 'mayusculas' ? row.text.toUpperCase() : row.text
  const fs0 = h * (cursive ? 0.6 : 0.78)
  // Si una frase no entra en el renglón, se achica la letra para que entre entera
  const raw = text ? measure(text, font, fs0) : 0
  const fs = raw > w - 4 ? fs0 * ((w - 4) / raw) : fs0
  const base = y + h * 0.72
  const xline = base - fs * (cursive ? 0.4 : 0.5)
  const capline = base - fs * (cursive ? 0.88 : 0.72)
  const desc = base + fs * 0.26
  const tw = text ? measure(text, font, fs) : 0
  const gap = Math.max(5, fs * 0.6)
  const fits = tw ? Math.max(1, Math.floor((w - 3 + gap) / (tw + gap))) : 0
  // Qué se dibuja en cada copia del renglón
  const copies: ('solid' | 'grey' | 'dots' | 'outline')[] = []
  if (text && row.mode !== 'vacio') {
    const n = row.repeat ? fits : 1
    for (let i = 0; i < n; i++) {
      if (row.mode === 'modelo' || row.mode === 'modelo-vacio') { if (i === 0) copies.push('solid') }
      else if (row.mode === 'modelo-repaso') copies.push(i === 0 ? 'solid' : 'grey')
      else if (row.mode === 'gris') copies.push('grey')
      else if (row.mode === 'punteado') copies.push('dots')
      else if (row.mode === 'contorno') copies.push('outline')
    }
  }
  return (
    <g>
      {img && <text x={M + 6} y={y + h * 0.75} textAnchor="middle" fontSize={Math.min(12, h * 0.62)}>{row.e}</text>}
      <Guides x={x} w={w} y={y} h={h} base={base} xline={xline} capline={capline} desc={desc} pauta={style.pauta} />
      {copies.map((k, i) => (
        <text key={i} x={x + 2 + i * (tw + gap)} y={base} fontFamily={ff(font)} fontSize={fs}
          fill={k === 'solid' ? C.ink : k === 'grey' ? C.grey : 'none'}
          stroke={k === 'dots' ? C.faint : k === 'outline' ? C.ink : 'none'}
          strokeWidth={k === 'dots' ? 0.35 : k === 'outline' ? 0.3 : 0}
          strokeDasharray={k === 'dots' ? '0.8 0.8' : undefined}>
          {text}
        </text>
      ))}
    </g>
  )
}

function Guides(p: { x: number; w: number; y: number; h: number; base: number; xline: number; capline: number; desc: number; pauta: Pauta }) {
  const { x, w, base, xline, capline, desc, pauta } = p
  const line = (yy: number, color: string, sw: number, dash?: string) => <line x1={x} x2={x + w} y1={yy} y2={yy} stroke={color} strokeWidth={sw} strokeDasharray={dash} />
  if (pauta === 'simple') return line(base, C.base, 0.45)
  if (pauta === 'doble') return <g>{line(xline, C.xline, 0.35)}{line(base, C.base, 0.45)}</g>
  if (pauta === 'cuadricula') {
    const step = (base - xline)
    const top = capline - step * 0.2
    const lines = []
    for (let yy = top; yy <= desc + 0.1; yy += step / 2) lines.push(<line key={'h' + yy} x1={x} x2={x + w} y1={yy} y2={yy} stroke={C.grid} strokeWidth={0.25} />)
    for (let xx = x; xx <= x + w + 0.1; xx += step / 2) lines.push(<line key={'v' + xx} x1={xx} x2={xx} y1={top} y2={desc} stroke={C.grid} strokeWidth={0.25} />)
    return <g>{lines}{line(base, C.base, 0.45)}</g>
  }
  return (
    <g>
      <rect x={x} y={xline} width={w} height={base - xline} fill={C.band} />
      {line(capline, C.guide, 0.3, '1.5 1.2')}
      {line(xline, C.xline, 0.3)}
      {line(base, C.base, 0.45)}
      {line(desc, C.guide, 0.3, '1.5 1.2')}
    </g>
  )
}

/* ---------- Fichas con diseño propio: completar, unir, diploma y cartel ---------- */
export function SpecialSheet({ child, kind, letter = 'm', seed = 0 }: { child: Child; kind: SheetKind; letter?: string; seed?: number }) {
  useFontsReady()
  const font = fontFor(child.script, child.country)
  const cursive = child.script === 'cursiva'
  const name = cap(child.name)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => makeSpecial(child, kind, letter), [child, kind, letter, seed])
  const top = 44
  if (kind === 'silabas' && data.kind === 'silabas') {
    return (
      <div className="pages">
        <Page child={child} title="Completo la palabra">
          <Hint y={top - 4} text="Mira el dibujo, di la palabra y escribe la sílaba que falta." />
          <g transform={`translate(${M}, ${top + 2})`}>
            <rect width={W - 2 * M} height={16} rx={3} fill={C.band} />
            {data.bank.map((s, i) => <text key={i} x={10 + i * ((W - 2 * M - 14) / data.bank.length)} y={11} fontFamily={ff(font)} fontSize={9} fill={C.ink}>{s}</text>)}
          </g>
          {data.items.map((w, i) => {
            const syl = syllables(show(w))
            const y = top + 28 + i * 34
            return (
              <g key={w.w}>
                <text x={M + 10} y={y + 17} textAnchor="middle" fontSize={16}>{w.e}</text>
                <rect x={M + 26} y={y + 2} width={34} height={22} rx={3} fill="none" stroke={C.guide} strokeDasharray="2 1.5" strokeWidth={0.5} />
                <text x={M + 64} y={y + 19} fontFamily={ff(font)} fontSize={cursive ? 13 : 15} fill={C.ink}>{syl.slice(1).join('')}</text>
                <line x1={M} x2={W - M} y1={y + 30} y2={y + 30} stroke={C.guide} strokeWidth={0.3} />
              </g>
            )
          })}
        </Page>
      </div>
    )
  }
  if (kind === 'unir' && data.kind === 'unir') {
    return (
      <div className="pages">
        <Page child={child} title="Uno cada dibujo con su palabra">
          <Hint y={top - 4} text="Lee cada palabra con ayuda y une con una línea al dibujo." />
          {data.items.map((w, i) => (
            <g key={w.w}><text x={M + 18} y={top + 20 + i * 37} textAnchor="middle" fontSize={20}>{w.e}</text><circle cx={M + 40} cy={top + 13 + i * 37} r={1.6} fill={C.ink} /></g>
          ))}
          {data.right.map((w, i) => (
            <g key={w.w}><circle cx={W - M - 72} cy={top + 13 + i * 37} r={1.6} fill={C.ink} /><text x={W - M - 64} y={top + 17 + i * 37} fontFamily={ff(font)} fontSize={cursive ? 10 : 12} fill={C.ink}>{show(w)}</text></g>
          ))}
        </Page>
      </div>
    )
  }
  if (kind === 'diploma') {
    const date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    return (
      <div className="pages">
        <Page child={child} title="Diploma" header={false}>
          <rect x={10} y={10} width={W - 20} height={H - 24} rx={6} fill="none" stroke={C.xline} strokeWidth={1.4} />
          <rect x={14} y={14} width={W - 28} height={H - 32} rx={4} fill="none" stroke={C.base} strokeWidth={0.5} strokeDasharray="3 2" />
          <text x={W / 2} y={60} textAnchor="middle" fontSize={26}>{child.mascot || '🏅'}</text>
          <text x={W / 2} y={84} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={16} fontWeight={700} fill={C.ink}>DIPLOMA</text>
          <text x={W / 2} y={102} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={6} fill={C.soft}>Este diploma es para</text>
          <text x={W / 2} y={132} textAnchor="middle" fontFamily={ff(font)} fontSize={cursive ? 22 : 28} fill={C.ink}>{name}</text>
          <line x1={40} x2={W - 40} y1={138} y2={138} stroke={C.base} strokeWidth={0.6} />
          <text x={W / 2} y={158} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={11} fontWeight={600} fill={C.ink}>¡Ya escribo mi nombre!</text>
          <text x={W / 2} y={172} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={5.5} fill={C.soft}>Completó los 21 días de su camino de la letra</text>
          <text x={W / 2} y={196} textAnchor="middle" fontSize={12}>⭐ ⭐ ⭐ ⭐ ⭐</text>
          <text x={W / 2} y={214} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={5} fill={C.soft}>Aquí lo escribo yo solo:</text>
          <Row row={newRow('', 'vacio')} y={218} h={20} font={font} style={{ font: child.script, size: 'grande', pauta: 'montessori', images: false }} />
          <line x1={36} x2={96} y1={262} y2={262} stroke={C.soft} strokeWidth={0.3} />
          <line x1={W - 96} x2={W - 36} y1={262} y2={262} stroke={C.soft} strokeWidth={0.3} />
          <text x={66} y={268} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={4} fill={C.soft}>{date}</text>
          <text x={W - 66} y={268} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={4} fill={C.soft}>Firma de mamá o papá</text>
        </Page>
      </div>
    )
  }
  if (kind === 'cartel' && data.kind === 'cartel') {
    const fs = Math.min(cursive ? 52 : 64, 230 / Math.max(3, name.length))
    return (
      <div className="pages">
        <Page child={child} title="Cartel para la puerta" header={false}>
          <rect x={10} y={10} width={W - 20} height={H - 24} rx={10} fill="none" stroke={C.guide} strokeWidth={1} strokeDasharray="4 3" />
          <text x={W / 2} y={70} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={13} fontWeight={600} fill={C.soft}>El cuarto de</text>
          <text x={W / 2} y={150} textAnchor="middle" fontFamily={ff(font)} fontSize={fs} fill="none" stroke={C.ink} strokeWidth={0.7}>{name}</text>
          {data.deco.map((e, i) => <text key={i} x={36 + i * ((W - 72) / Math.max(1, data.deco.length - 1))} y={210} textAnchor="middle" fontSize={20}>{e}</text>)}
          <text x={W / 2} y={250} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={5.5} fill={C.soft}>Pinta las letras de tu nombre con tus colores favoritos</text>
        </Page>
      </div>
    )
  }
  return null
}

type Special =
  | { kind: 'silabas'; items: Word[]; bank: string[] }
  | { kind: 'unir'; items: Word[]; right: Word[] }
  | { kind: 'cartel'; deco: string[] }
  | { kind: 'none' }

function makeSpecial(child: Child, kind: SheetKind, letter: string): Special {
  const bank = bankFor(child, { withEmoji: true })
  if (kind === 'silabas') {
    const pool = bank.filter((w) => syllables(w.w).length >= 2)
    const withL = pool.filter((w) => strip(w.w.toLowerCase()).startsWith(letter))
    const items = [...shuffle(withL), ...shuffle(pool.filter((w) => !withL.includes(w)))].slice(0, 6)
    return { kind, items, bank: shuffle(items.map((w) => syllables(show(w))[0])) }
  }
  if (kind === 'unir') {
    const items = pick(bank.filter((w) => w.w.length <= 8), 6)
    return { kind, items, right: shuffle(items) }
  }
  if (kind === 'cartel') {
    const icons = [child.mascot, ...personalWords(child).map((w) => w.e)].filter(Boolean)
    return { kind, deco: pick([...new Set(icons)], 5) }
  }
  return { kind: 'none' }
}

export const isSpecial = (k: SheetKind) => k === 'silabas' || k === 'unir' || k === 'diploma' || k === 'cartel'

/** Cualquier ficha prearmada, sea por renglones o con diseño propio. */
export function PresetSheet({ child, kind, letter, seed }: { child: Child; kind: SheetKind; letter?: string; seed?: number }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doc = useMemo(() => (isSpecial(kind) ? null : presetDoc(kind, child, letter)), [kind, child, letter, seed])
  if (isSpecial(kind)) return <SpecialSheet child={child} kind={kind} letter={letter} seed={seed} />
  return doc ? <SheetPages child={child} doc={doc} /> : null
}
