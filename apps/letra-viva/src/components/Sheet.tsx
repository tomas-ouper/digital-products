// Ficha imprimible en A4. Todo es SVG en milímetros (viewBox 210×297),
// así se ve igual en pantalla, en el PDF y en la impresora.
import { useMemo, type ReactNode } from 'react'
import type { Child } from '../lib/store'
import type { SheetKind, Word } from '../lib/content'
import { THEMES, firstLetter, pick, shuffle, syllables, vocabFor, strip } from '../lib/content'
import { fontFor } from '../lib/fonts'

type Ink = 'modelo' | 'gris' | 'punteado' | 'vacio'

const W = 210, H = 297, M = 14
const C = {
  ink: '#18223A', soft: '#4A5672', faint: '#9AA4B8',
  band: '#E3ECFA', xline: '#8FB0E6', base: '#C8443A', guide: '#C9D5E4', grey: '#C3CAD6',
}

export type SheetOptions = { kind: SheetKind; letter?: string; seed?: number }

export function Sheet({ child, opts }: { child: Child; opts: SheetOptions }) {
  const font = fontFor(child.script, child.country)
  const cursive = child.script === 'cursiva'
  const name = cap(child.name.trim())
  const vocab = useMemo(() => vocabFor(child.interests), [child.interests])
  const body = useMemo(
    () => renderBody(opts, { child, name, font, cursive, vocab }),
    // seed fuerza un nuevo sorteo de palabras al tocar "otra versión"
    [opts.kind, opts.letter, opts.seed, child, font],
  )
  return (
    <svg className="sheet" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={body.title}>
      <rect width={W} height={H} fill="#fff" />
      {body.header !== false && <Header title={body.title} name={name} interests={child.interests} />}
      {body.node}
      <text x={W / 2} y={H - 7} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="2.6" fill={C.faint}>
        Letra Viva · Kit Caligrafía Montessori® · ficha hecha para {name}
        {child.hand === 'zurdo' ? ' · zurdo: inclinar la hoja hacia la derecha' : ''}
      </text>
    </svg>
  )
}

type Ctx = { child: Child; name: string; font: string; cursive: boolean; vocab: Word[] }

function renderBody(opts: SheetOptions, ctx: Ctx): { title: string; node: ReactNode; header?: false } {
  const { name, font, cursive, vocab } = ctx
  const rowH = cursive ? 22 : 19
  const top = 44
  switch (opts.kind) {
    case 'nombre': {
      const inks: Ink[] = ['modelo', 'gris', 'gris', 'gris', 'punteado', 'punteado', 'vacio', 'vacio', 'vacio', 'vacio']
      return {
        title: 'Escribo mi nombre',
        node: (
          <g>
            <Hint y={top - 4} text="Primero repasa con el dedo. Después con lápiz, de izquierda a derecha." />
            {inks.map((ink, i) => (
              <Row key={i} y={top + i * (rowH + 4)} h={rowH} text={name} ink={ink} font={font} cursive={cursive} repeat={ink !== 'modelo'} />
            ))}
          </g>
        ),
      }
    }
    case 'letra': {
      const l = opts.letter ?? 'a'
      const words = wordsWith(l, vocab, 2)
      const big = cursive ? 30 : 32
      return {
        title: `La letra ${l.toUpperCase()} ${l}`,
        node: (
          <g>
            <g transform={`translate(${M}, ${top})`}>
              <rect width={52} height={44} rx={4} fill={C.band} />
              <text x={26} y={34} textAnchor="middle" fontFamily={font} fontSize={big} fill={C.ink}>{l.toUpperCase()}{l}</text>
              <text x={60} y={14} fontFamily="Nunito, sans-serif" fontSize={5} fontWeight={700} fill={C.ink}>Suena así:</text>
              {words.map((w, i) => (
                <text key={w.w} x={60} y={26 + i * 10} fontFamily="Nunito, sans-serif" fontSize={6.5} fill={C.soft}>
                  {w.e} {hl(w.w, l)}
                </text>
              ))}
            </g>
            {[
              { t: l.toUpperCase(), ink: 'gris' as Ink }, { t: l.toUpperCase(), ink: 'punteado' as Ink },
              { t: l, ink: 'gris' as Ink }, { t: l, ink: 'punteado' as Ink },
              ...words.map((w) => ({ t: w.w, ink: 'gris' as Ink })),
              { t: '', ink: 'vacio' as Ink }, { t: '', ink: 'vacio' as Ink },
            ].map((r, i) => (
              <Row key={i} y={top + 54 + i * (rowH + 4)} h={rowH} text={r.t} ink={r.ink} font={font} cursive={cursive} repeat gap={r.t.length > 1 ? 10 : 7} />
            ))}
          </g>
        ),
      }
    }
    case 'palabras': {
      const words = pick(vocabFor(ctx.child.interests).slice(0, Math.max(8, ctx.child.interests.length * 8)), 7)
      return {
        title: 'Palabras de mi mundo',
        node: (
          <g>
            <Hint y={top - 4} text="Di la palabra en voz alta, repásala y después escríbela sola." />
            {words.map((w, i) => (
              <g key={w.w}>
                <text x={M + 7} y={top + i * (rowH + 15) + rowH * 0.72} textAnchor="middle" fontSize={12}>{w.e}</text>
                <Row x={M + 16} w={W - 2 * M - 16} y={top + i * (rowH + 15)} h={rowH} text={w.w} ink="gris" font={font} cursive={cursive} />
                <Row x={M + 16} w={W - 2 * M - 16} y={top + i * (rowH + 15) + rowH + 1} h={12} text="" ink="vacio" font={font} cursive={cursive} thin />
              </g>
            ))}
          </g>
        ),
      }
    }
    case 'silabas': {
      const l = opts.letter ?? 'm'
      const pool = vocab.filter((w) => syllables(w.w).length >= 2)
      const withL = pool.filter((w) => strip(w.w).startsWith(l))
      const items = [...withL, ...shuffle(pool.filter((w) => !withL.includes(w)))].slice(0, 6)
      const bank = shuffle(items.map((w) => syllables(w.w)[0]))
      return {
        title: 'Completo la sílaba',
        node: (
          <g>
            <Hint y={top - 4} text="Mira el dibujo, di la palabra y escribe la sílaba que falta." />
            <g transform={`translate(${M}, ${top + 2})`}>
              <rect width={W - 2 * M} height={16} rx={3} fill={C.band} />
              {bank.map((s, i) => (
                <text key={i} x={12 + i * ((W - 2 * M - 16) / bank.length)} y={11} fontFamily={font} fontSize={9} fill={C.ink}>{s}</text>
              ))}
            </g>
            {items.map((w, i) => {
              const syl = syllables(w.w)
              const y = top + 28 + i * 34
              return (
                <g key={w.w}>
                  <text x={M + 10} y={y + 17} textAnchor="middle" fontSize={16}>{w.e}</text>
                  <rect x={M + 26} y={y + 2} width={34} height={22} rx={3} fill="none" stroke={C.guide} strokeDasharray="2 1.5" strokeWidth={0.5} />
                  <text x={M + 64} y={y + 19} fontFamily={font} fontSize={cursive ? 13 : 15} fill={C.ink}>{syl.slice(1).join('')}</text>
                  <line x1={M} x2={W - M} y1={y + 30} y2={y + 30} stroke={C.guide} strokeWidth={0.3} />
                </g>
              )
            })}
          </g>
        ),
      }
    }
    case 'unir': {
      const items = pick(vocab.filter((w) => w.w.length <= 8), 6)
      const right = shuffle(items)
      return {
        title: 'Uno cada dibujo con su palabra',
        node: (
          <g>
            <Hint y={top - 4} text="Lee cada palabra con ayuda y une con una línea al dibujo." />
            {items.map((w, i) => (
              <g key={w.w}>
                <text x={M + 18} y={top + 20 + i * 37} textAnchor="middle" fontSize={20}>{w.e}</text>
                <circle cx={M + 40} cy={top + 13 + i * 37} r={1.6} fill={C.ink} />
              </g>
            ))}
            {right.map((w, i) => (
              <g key={w.w}>
                <circle cx={W - M - 72} cy={top + 13 + i * 37} r={1.6} fill={C.ink} />
                <text x={W - M - 64} y={top + 17 + i * 37} fontFamily={font} fontSize={cursive ? 10 : 12} fill={C.ink}>{w.w}</text>
              </g>
            ))}
          </g>
        ),
      }
    }
    case 'diploma': {
      const date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
      return {
        title: 'Diploma',
        header: false,
        node: (
          <g>
            <rect x={10} y={10} width={W - 20} height={H - 24} rx={6} fill="none" stroke={C.xline} strokeWidth={1.4} />
            <rect x={14} y={14} width={W - 28} height={H - 32} rx={4} fill="none" stroke={C.base} strokeWidth={0.5} strokeDasharray="3 2" />
            <text x={W / 2} y={60} textAnchor="middle" fontSize={26}>🏅</text>
            <text x={W / 2} y={84} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={16} fontWeight={700} fill={C.ink}>DIPLOMA</text>
            <text x={W / 2} y={102} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={6} fill={C.soft}>Este diploma es para</text>
            <text x={W / 2} y={132} textAnchor="middle" fontFamily={font} fontSize={cursive ? 22 : 28} fill={C.ink}>{name}</text>
            <line x1={40} x2={W - 40} y1={138} y2={138} stroke={C.base} strokeWidth={0.6} />
            <text x={W / 2} y={158} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={11} fontWeight={600} fill={C.ink}>¡Ya escribo mi nombre!</text>
            <text x={W / 2} y={172} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={5.5} fill={C.soft}>Completó los 21 días de su camino de la letra</text>
            <text x={W / 2} y={196} textAnchor="middle" fontSize={12}>⭐ ⭐ ⭐ ⭐ ⭐</text>
            <text x={W / 2} y={214} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={5} fill={C.soft}>Aquí lo escribo yo solo:</text>
            <Row x={36} w={W - 72} y={218} h={20} text="" ink="vacio" font={font} cursive={cursive} />
            <line x1={36} x2={96} y1={262} y2={262} stroke={C.soft} strokeWidth={0.3} />
            <line x1={W - 96} x2={W - 36} y1={262} y2={262} stroke={C.soft} strokeWidth={0.3} />
            <text x={66} y={268} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={4} fill={C.soft}>{date}</text>
            <text x={W - 66} y={268} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={4} fill={C.soft}>Firma de mamá o papá</text>
          </g>
        ),
      }
    }
    case 'cartel': {
      const icons = ctx.child.interests.flatMap((t) => (THEMES[t]?.words ?? []).slice(0, 3).map((w) => w.e))
      const deco = pick(icons.length ? icons : ['⭐', '🌈', '🎈', '🌸'], 4)
      const fs = Math.min(cursive ? 52 : 64, 230 / Math.max(3, name.length))
      return {
        title: 'Cartel para la puerta',
        header: false,
        node: (
          <g>
            <rect x={10} y={10} width={W - 20} height={H - 24} rx={10} fill="none" stroke={C.guide} strokeWidth={1} strokeDasharray="4 3" />
            <text x={W / 2} y={70} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontSize={13} fontWeight={600} fill={C.soft}>El cuarto de</text>
            <text x={W / 2} y={150} textAnchor="middle" fontFamily={font} fontSize={fs} fill="none" stroke={C.ink} strokeWidth={0.7}>{name}</text>
            {deco.map((e, i) => (
              <text key={i} x={40 + i * ((W - 80) / Math.max(1, deco.length - 1))} y={210} textAnchor="middle" fontSize={22}>{e}</text>
            ))}
            <text x={W / 2} y={250} textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={5.5} fill={C.soft}>Pinta las letras de tu nombre con tus colores favoritos</text>
          </g>
        ),
      }
    }
  }
}

/** Resalta en rojo la primera aparición de la letra dentro de la palabra. */
function hl(word: string, l: string) {
  const i = [...strip(word.toLowerCase())].indexOf(l)
  if (i < 0) return word
  return <>{word.slice(0, i)}<tspan fontWeight={800} fill={C.base}>{word[i]}</tspan>{word.slice(i + 1)}</>
}

function wordsWith(l: string, vocab: Word[], n: number): Word[] {
  const starts = vocab.filter((w) => firstLetter(w.w) === l)
  const has = vocab.filter((w) => !starts.includes(w) && strip(w.w).includes(l))
  return [...starts, ...has].slice(0, n)
}

function Header({ title, name, interests }: { title: string; name: string; interests: string[] }) {
  const icons = interests.map((t) => THEMES[t]?.e).filter(Boolean).slice(0, 3).join(' ')
  return (
    <g>
      <text x={M} y={18} fontFamily="Fredoka, sans-serif" fontSize={9} fontWeight={700} fill={C.ink}>{title}</text>
      <text x={M} y={27} fontFamily="Nunito, sans-serif" fontSize={4.4} fill={C.soft}>Nombre: {name}    Fecha: ____ / ____</text>
      <text x={W - M} y={22} textAnchor="end" fontSize={10}>{icons}</text>
      <line x1={M} x2={W - M} y1={32} y2={32} stroke={C.guide} strokeWidth={0.4} />
    </g>
  )
}

function Hint({ y, text }: { y: number; text: string }) {
  return <text x={M} y={y} fontFamily="Nunito, sans-serif" fontSize={3.8} fontStyle="italic" fill={C.soft}>{text}</text>
}

/**
 * Un renglón con pauta Montessori: línea de mayúsculas, banda de minúsculas
 * y renglón base en rojo. Puede llevar el texto de modelo, en gris para
 * repasar, punteado o vacío.
 */
function Row(props: {
  y: number; h: number; text: string; ink: Ink; font: string; cursive: boolean
  x?: number; w?: number; repeat?: boolean; gap?: number; thin?: boolean
}) {
  const { y, h, text, ink, font, cursive, repeat, thin } = props
  const x = props.x ?? M
  const w = props.w ?? W - 2 * M
  const fs = h * (cursive ? 0.62 : 0.8)
  const base = y + h * 0.72
  const xline = base - fs * (cursive ? 0.42 : 0.5)
  const capline = base - fs * (cursive ? 0.9 : 0.72)
  const desc = base + fs * 0.26
  const charW = fs * (cursive ? 0.78 : 0.52)
  const gap = props.gap ?? 8
  const unit = Math.max(charW, text.length * charW) + gap
  const n = text ? (repeat ? Math.max(1, Math.floor((w - 4) / unit)) : 1) : 0
  const fill = ink === 'modelo' ? C.ink : ink === 'gris' ? C.grey : 'none'
  const stroke = ink === 'punteado' ? C.faint : 'none'
  return (
    <g>
      {!thin && <rect x={x} y={xline} width={w} height={base - xline} fill={C.band} />}
      {!thin && <line x1={x} x2={x + w} y1={capline} y2={capline} stroke={C.guide} strokeWidth={0.3} strokeDasharray="1.5 1.2" />}
      <line x1={x} x2={x + w} y1={xline} y2={xline} stroke={C.xline} strokeWidth={0.3} />
      <line x1={x} x2={x + w} y1={base} y2={base} stroke={C.base} strokeWidth={0.45} />
      {!thin && <line x1={x} x2={x + w} y1={desc} y2={desc} stroke={C.guide} strokeWidth={0.3} strokeDasharray="1.5 1.2" />}
      {Array.from({ length: n }, (_, i) => (
        <text key={i} x={x + 2 + i * unit} y={base} fontFamily={font} fontSize={fs} fill={fill} stroke={stroke}
          strokeWidth={ink === 'punteado' ? 0.35 : 0} strokeDasharray={ink === 'punteado' ? '0.8 0.8' : undefined}>
          {text}
        </text>
      ))}
    </g>
  )
}

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}
