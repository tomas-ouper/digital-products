// Editor de fichas: la mamá arma la ficha renglón por renglón con sus propias
// palabras y elige letra, tamaño y pauta. Vista previa en vivo, lista para imprimir.
import { useState } from 'react'
import type { Child } from '../lib/store'
import { ALPHABET, cap, personalWords, pick, sentencesFor, show } from '../lib/content'
import { EMOJI_PALETTE, lookupWord } from '../lib/themes'
import { SheetPages, newRow, type FontChoice, type Mode, type Pauta, type SheetDoc, type SheetRow, type Size } from '../components/Sheet'

const MODES: { id: Mode; label: string }[] = [
  { id: 'modelo-repaso', label: 'Modelo y repaso' },
  { id: 'gris', label: 'Gris para repasar' },
  { id: 'punteado', label: 'Punteada' },
  { id: 'contorno', label: 'Contorno para pintar' },
  { id: 'modelo-vacio', label: 'Modelo y espacio para copiar' },
  { id: 'modelo', label: 'Solo modelo' },
  { id: 'vacio', label: 'Renglón vacío' },
]
const FONTS: { id: FontChoice; label: string }[] = [{ id: 'imprenta', label: 'Imprenta' }, { id: 'cursiva', label: 'Cursiva' }, { id: 'mayusculas', label: 'MAYÚSCULAS' }]
const SIZES: { id: Size; label: string }[] = [{ id: 'grande', label: 'Grande' }, { id: 'mediana', label: 'Mediana' }, { id: 'chica', label: 'Chica' }]
const PAUTAS: { id: Pauta; label: string }[] = [{ id: 'montessori', label: 'Montessori' }, { id: 'doble', label: 'Doble línea' }, { id: 'simple', label: 'Una línea' }, { id: 'cuadricula', label: 'Cuadrícula' }]

function starter(child: Child): SheetDoc {
  const name = cap(child.name)
  const words = pick(personalWords(child).filter((w) => w.e), 3)
  return {
    title: `La ficha de ${name}`,
    style: { font: child.script, size: 'grande', pauta: 'montessori', images: true },
    rows: [newRow(name, 'modelo-repaso', true, child.mascot), ...words.map((w) => newRow(show(w), 'modelo-repaso', true, w.e)), newRow('', 'vacio')],
  }
}

export function SheetEditor({ child }: { child: Child }) {
  const [doc, setDoc] = useState<SheetDoc>(() => starter(child))
  const [palette, setPalette] = useState<string | null>(null)
  const [letter, setLetter] = useState('')
  const set = (patch: Partial<SheetDoc>) => setDoc((d) => ({ ...d, ...patch }))
  const setRow = (id: string, patch: Partial<SheetRow>) => setDoc((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const add = (...rows: SheetRow[]) => setDoc((d) => ({ ...d, rows: [...d.rows, ...rows] }))
  const move = (i: number, dir: -1 | 1) => setDoc((d) => {
    const rows = [...d.rows]; const j = i + dir
    if (j < 0 || j >= rows.length) return d
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
    return { ...d, rows }
  })

  return (
    <div className="editor">
      <div className="editor-controls no-print">
        <h1>Crea su ficha</h1>
        <p className="muted">Escribe lo que quieras que practique: su nombre, palabras de su mundo o una frase. Cada renglón puede ir distinto.</p>

        <label className="field" htmlFor="ed-title"><span>Título de la ficha</span>
          <input id="ed-title" className="input" value={doc.title} onChange={(e) => set({ title: e.target.value })} maxLength={40} />
        </label>

        <p className="label">Agregar rápido</p>
        <div className="chips">
          <button className="chip" onClick={() => add(newRow(cap(child.name), 'gris', true, child.mascot))}>✏️ Su nombre</button>
          <button className="chip" onClick={() => add(...pick(personalWords(child).filter((w) => w.e), 4).map((w) => newRow(show(w), 'modelo-repaso', true, w.e)))}>🌎 4 palabras de su mundo</button>
          <button className="chip" onClick={() => add(newRow(pick(sentencesFor(child), 1)[0], 'modelo', false), newRow('', 'vacio'))}>💬 Una frase</button>
          <button className="chip" onClick={() => add(newRow('', 'vacio'))}>➖ Renglón vacío</button>
        </div>
        <div className="add-row">
          <select id="ed-letter" className="input" value={letter} onChange={(e) => setLetter(e.target.value)} aria-label="Letra para practicar">
            <option value="">Una letra…</option>
            {ALPHABET.map((l) => <option key={l} value={l}>{l.toUpperCase()} {l}</option>)}
          </select>
          <button className="btn" disabled={!letter} onClick={() => { add(newRow(letter.toUpperCase(), 'gris'), newRow(letter, 'gris'), newRow(letter, 'punteado')); setLetter('') }}>Agregar letra</button>
        </div>

        <p className="label">Renglones <small>{doc.rows.length}</small></p>
        <ol className="rows">
          {doc.rows.map((r, i) => (
            <li key={r.id} className="row-card">
              <div className="row-top">
                <button className="emoji-btn" aria-label="Elegir dibujo" onClick={() => setPalette(palette === r.id ? null : r.id)}>{r.e || '＋'}</button>
                <input className="input" aria-label={`Texto del renglón ${i + 1}`} value={r.text} placeholder={r.mode === 'vacio' ? 'Renglón vacío' : 'Escribe una palabra o frase'}
                  onChange={(e) => {
                    const text = e.target.value
                    const auto = lookupWord(text)?.e
                    setRow(r.id, { text, e: auto ?? (r.e && lookupWord(r.text)?.e === r.e ? undefined : r.e), mode: r.mode === 'vacio' && text ? 'modelo-repaso' : r.mode })
                  }} />
                <div className="row-move">
                  <button aria-label="Subir" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button aria-label="Bajar" onClick={() => move(i, 1)} disabled={i === doc.rows.length - 1}>↓</button>
                  <button aria-label="Borrar renglón" onClick={() => set({ rows: doc.rows.filter((x) => x.id !== r.id) })}>✕</button>
                </div>
              </div>
              {palette === r.id && (
                <div className="palette small">
                  <button onClick={() => { setRow(r.id, { e: undefined }); setPalette(null) }}>∅</button>
                  {[child.mascot, ...EMOJI_PALETTE].map((e) => <button key={e} onClick={() => { setRow(r.id, { e }); setPalette(null) }}>{e}</button>)}
                </div>
              )}
              <div className="row-opts">
                <select className="input" aria-label="Cómo se escribe" value={r.mode} onChange={(e) => setRow(r.id, { mode: e.target.value as Mode })}>
                  {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <label className="check"><input type="checkbox" checked={r.repeat} onChange={(e) => setRow(r.id, { repeat: e.target.checked })} /> Llenar el renglón</label>
              </div>
            </li>
          ))}
        </ol>
        <button className="btn wide" onClick={() => add(newRow('', 'modelo-repaso'))}>＋ Agregar renglón</button>

        <p className="label">Estilo</p>
        <div className="seg-group">
          <Seg label="Letra" options={FONTS} value={doc.style.font} onChange={(font) => set({ style: { ...doc.style, font } })} />
          <Seg label="Tamaño" options={SIZES} value={doc.style.size} onChange={(size) => set({ style: { ...doc.style, size } })} />
          <Seg label="Pauta" options={PAUTAS} value={doc.style.pauta} onChange={(pauta) => set({ style: { ...doc.style, pauta } })} />
          <label className="check"><input type="checkbox" checked={doc.style.images} onChange={(e) => set({ style: { ...doc.style, images: e.target.checked } })} /> Mostrar dibujos</label>
        </div>
        <div className="row-btns">
          <button className="btn primary big" onClick={() => window.print()}>🖨️ Imprimir o guardar PDF</button>
          <button className="btn ghost" onClick={() => setDoc(starter(child))}>Empezar de nuevo</button>
        </div>
      </div>
      <div className="editor-preview">
        <SheetPages child={child} doc={doc} />
      </div>
    </div>
  )
}

function Seg<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg-row">
      <span>{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map((o) => <button key={o.id} role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>)}
      </div>
    </div>
  )
}
