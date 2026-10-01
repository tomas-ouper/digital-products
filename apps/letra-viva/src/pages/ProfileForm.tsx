import { useMemo, useState } from 'react'
import { actions, type Child, type Country, type Level, type Person, type Script } from '../lib/store'
import { ALPHABET, cap } from '../lib/content'
import { COUNTRIES } from '../lib/fonts'
import { EMOJI_PALETTE, RELATIONS, SUGGESTED, lookupWord, matchInterest, themeById, type Word } from '../lib/themes'

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: 1, label: 'Está empezando', desc: 'Reconoce pocas letras o ninguna' },
  { id: 2, label: 'Conoce letras', desc: 'Reconoce varias letras y algunas sílabas' },
  { id: 3, label: 'Lee palabras', desc: 'Lee palabras cortas y quiere frases' },
]

/** El quiz: todo lo que hace falta para que la app hable de su mundo. */
export function ProfileForm({ initial, onDone }: { initial?: Child; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initial?.name ?? '')
  const [age, setAge] = useState(initial?.age ?? 5)
  const [level, setLevel] = useState<Level>(initial?.level ?? 1)
  const [hand, setHand] = useState<Child['hand']>(initial?.hand ?? 'diestro')
  const [known, setKnown] = useState<string[]>(initial?.known ?? [])
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? [])
  const [themes, setThemes] = useState<string[]>(initial?.themes ?? [])
  const [removed, setRemoved] = useState<string[]>(initial?.removed ?? [])
  const [people, setPeople] = useState<Person[]>(initial?.people ?? [])
  const [words, setWords] = useState<Word[]>(initial?.words ?? [])
  const [mascot, setMascot] = useState(initial?.mascot ?? '')
  const [country, setCountry] = useState<Country>(initial?.country ?? 'MX')
  const [script, setScript] = useState<Script>(initial?.script ?? 'imprenta')
  const [building, setBuilding] = useState(false)
  const n = cap(name) || 'tu hijo'

  const mascots = useMemo(() => {
    const fromThemes = themes.flatMap((id) => themeById(id)?.mascots ?? [])
    return [...new Set([...fromThemes, ...words.map((w) => w.e).filter(Boolean), '🦉', '🐶', '🦄', '🐻', '🤖', '🐲'])].slice(0, 12)
  }, [themes, words])

  const steps: { key: string; q: string; sub?: string; ok: boolean; optional?: boolean; body: React.ReactNode }[] = [
    {
      key: 'nombre', q: '¿Cómo se llama tu hijo o hija?', ok: name.trim().length > 1,
      body: (
        <>
          <input id="q-name" className="input big" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Martina" maxLength={16} />
          {name.trim().length > 1 && <p className="name-preview">{cap(name)}</p>}
          <p className="muted">Va a aparecer en cada ficha y en los juegos. Escríbelo como quieres que lo aprenda.</p>
        </>
      ),
    },
    {
      key: 'nivel', q: `¿Cuántos años tiene ${n}?`, sub: 'Y cómo va con las letras hoy. Con esto ajustamos el largo de las palabras y los juegos.', ok: true,
      body: (
        <>
          <div className="chips">
            {[3, 4, 5, 6, 7, 8].map((a) => <button key={a} className={`chip big ${age === a ? 'on' : ''}`} onClick={() => setAge(a)}>{a} años</button>)}
          </div>
          <div className="choice-list">
            {LEVELS.map((l) => (
              <button key={l.id} className={`choice ${level === l.id ? 'on' : ''}`} onClick={() => setLevel(l.id)}>
                <b>{l.label}</b><small>{l.desc}</small>
              </button>
            ))}
          </div>
        </>
      ),
    },
    {
      key: 'escritura', q: `¿Cómo escribe ${n}?`, ok: true,
      body: (
        <>
          <p className="label">Mano</p>
          <div className="chips">
            <button className={`chip big ${hand === 'diestro' ? 'on' : ''}`} onClick={() => setHand('diestro')}>✋ Derecha</button>
            <button className={`chip big ${hand === 'zurdo' ? 'on' : ''}`} onClick={() => setHand('zurdo')}>🤚 Izquierda</button>
          </div>
          <p className="label">Letra que usan en su escuela</p>
          <div className="chips">
            <button className={`chip big ${script === 'imprenta' ? 'on' : ''}`} onClick={() => setScript('imprenta')}><span style={{ fontFamily: 'Andika' }}>Imprenta</span></button>
            <button className={`chip big ${script === 'cursiva' ? 'on' : ''}`} onClick={() => setScript('cursiva')}>Cursiva</button>
          </div>
          <label className="field" htmlFor="q-country"><span>País (define el modelo de cursiva escolar)</span>
            <select id="q-country" className="input" value={country} onChange={(e) => setCountry(e.target.value as Country)}>
              {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        </>
      ),
    },
    {
      key: 'letras', q: '¿Qué letras ya reconoce?', sub: 'Si no estás segura, déjalo vacío: empezamos por las vocales.', ok: true, optional: true,
      body: (
        <div className="chips letters">
          {ALPHABET.map((l) => <button key={l} className={`chip ${known.includes(l) ? 'on' : ''}`} onClick={() => setKnown(known.includes(l) ? known.filter((x) => x !== l) : [...known, l])}>{l.toUpperCase()}</button>)}
        </div>
      ),
    },
    {
      key: 'gustos', q: `¿Qué le encanta a ${n}?`, sub: 'Escríbelo con tus palabras: una película, un animal, un juego, lo que sea. Todas sus fichas y juegos van a salir de acá.',
      ok: themes.length > 0 || words.length > 0,
      body: <Interests {...{ interests, setInterests, themes, setThemes, removed, setRemoved, words, setWords }} />,
    },
    {
      key: 'gente', q: `¿Quiénes son importantes para ${n}?`, sub: 'Sus nombres son las palabras que más ganas tiene de leer. Aparecen en las fichas y en frases como "Mi perro se llama Toto".', ok: true, optional: true,
      body: <People people={people} setPeople={setPeople} />,
    },
    {
      key: 'palabras', q: '¿Alguna palabra suya?', sub: 'Las que usa en casa, su comida favorita, el nombre de su peluche. Les buscamos un dibujo.', ok: true, optional: true,
      body: <OwnWords words={words} setWords={setWords} />,
    },
    {
      key: 'companero', q: `Elige el compañero de ${n}`, sub: 'Lo acompaña en los juegos y festeja cada logro.', ok: !!mascot || true,
      body: (
        <>
          <div className="mascots">
            {mascots.map((m) => <button key={m} className={`mascot ${(mascot || mascots[0]) === m ? 'on' : ''}`} onClick={() => setMascot(m)}>{m}</button>)}
          </div>
          <div className="bubble"><span>{mascot || mascots[0]}</span><p>¡Hola, {n}! Vamos a jugar con las letras.</p></div>
        </>
      ),
    },
  ]
  const s = steps[step]
  const last = step === steps.length - 1

  function finish() {
    setBuilding(true)
    setTimeout(() => {
      actions.saveChild({ id: initial?.id, name: name.trim(), age, level, hand, known, interests, themes, removed, people, words, mascot: mascot || mascots[0], country, script })
      onDone()
    }, 1400)
  }

  if (building) {
    return (
      <div className="onboard building">
        <div className="spin">{mascot || mascots[0]}</div>
        <h1>Armando el mundo de {n}…</h1>
        <p className="muted">Su camino de 21 días, sus fichas y sus juegos.</p>
      </div>
    )
  }

  return (
    <div className="onboard">
      <div className="progress-bar"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <p className="eyebrow">Paso {step + 1} de {steps.length}</p>
      <h1>{s.q}</h1>
      {s.sub && <p className="muted">{s.sub}</p>}
      {s.body}
      <div className="row-btns sticky-actions">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Atrás</button>}
        {s.optional && !last && <button className="btn ghost" onClick={() => setStep(step + 1)}>Saltar</button>}
        <button className="btn primary big" disabled={!s.ok} onClick={() => (last ? finish() : setStep(step + 1))}>
          {last ? `Armar el mundo de ${n}` : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}

/* ---------- Gustos: texto libre que abre temas ---------- */
function Interests(p: {
  interests: string[]; setInterests: (v: string[]) => void
  themes: string[]; setThemes: (v: string[]) => void
  removed: string[]; setRemoved: (v: string[]) => void
  words: Word[]; setWords: (v: Word[]) => void
}) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState<string | null>(null) // algo que no conocemos: elegir dibujo

  function add(raw: string) {
    const input = raw.trim()
    if (!input || p.interests.some((x) => x.toLowerCase() === input.toLowerCase())) { setText(''); return }
    const m = matchInterest(input)
    if (m.themes.length) {
      p.setThemes([...new Set([...p.themes, ...m.themes.map((t) => t.id)])])
      // Si la palabra ya viene en el tema (delfines → delfín), no la repetimos como palabra propia
      const inTheme = m.word && m.themes.some((t) => t.words.some((w) => w.w === m.word!.w))
      if (m.word && !inTheme && !p.words.some((w) => w.w === m.word!.w)) p.setWords([...p.words, { w: m.word.w, e: m.word.e }])
      p.setInterests([...p.interests, input])
    } else if (m.word) {
      p.setWords([...p.words, { w: m.word.w, e: m.word.e }])
      p.setInterests([...p.interests, input])
    } else {
      setPending(input)
    }
    setText('')
  }

  const active = p.themes.map((id) => themeById(id)!).filter(Boolean)
  return (
    <>
      <form className="add-row" onSubmit={(e) => { e.preventDefault(); add(text) }}>
        <input id="q-likes" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej.: delfines, Toy Story, Minecraft…" />
        <button className="btn primary" disabled={!text.trim()}>Agregar</button>
      </form>
      {pending && (
        <div className="pending">
          <p>No conocemos <b>"{pending}"</b> todavía. Elige un dibujo y lo sumamos como palabra suya:</p>
          <div className="palette">
            {EMOJI_PALETTE.map((e) => (
              <button key={e} onClick={() => { p.setWords([...p.words, { w: pending.toLowerCase(), e }]); p.setInterests([...p.interests, pending]); setPending(null) }}>{e}</button>
            ))}
          </div>
          <button className="btn ghost" onClick={() => setPending(null)}>Cancelar</button>
        </div>
      )}
      <div className="chips">
        {SUGGESTED.filter((x) => !p.interests.includes(x)).slice(0, 10).map((x) => (
          <button key={x} className="chip ghosty" onClick={() => add(x)}>+ {x}</button>
        ))}
      </div>
      {active.length > 0 && (
        <div className="theme-preview">
          <p className="label">Sus palabras <small>Toca una para sacarla</small></p>
          {active.map((t) => (
            <div key={t.id} className="theme-block">
              <div className="theme-head">
                <b>{t.e} {t.label}</b>
                <small>por "{p.interests.find((i) => matchInterest(i).themes.some((x) => x.id === t.id)) ?? t.label}"</small>
                <button className="x" aria-label={`Quitar ${t.label}`} onClick={() => p.setThemes(p.themes.filter((x) => x !== t.id))}>✕</button>
              </div>
              <div className="word-chips">
                {t.words.map((w) => {
                  const off = p.removed.includes(w.w)
                  return (
                    <button key={w.w} className={`wchip ${off ? 'off' : ''}`} onClick={() => p.setRemoved(off ? p.removed.filter((x) => x !== w.w) : [...p.removed, w.w])}>
                      {w.e} {w.w}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {p.words.length > 0 && (
        <div className="theme-block">
          <div className="theme-head"><b>⭐ Palabras suyas</b></div>
          <div className="word-chips">
            {p.words.map((w) => <button key={w.w} className="wchip" onClick={() => p.setWords(p.words.filter((x) => x !== w))}>{w.e} {w.w} ✕</button>)}
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- Su gente ---------- */
function People({ people, setPeople }: { people: Person[]; setPeople: (v: Person[]) => void }) {
  const [rel, setRel] = useState('mama')
  const [nm, setNm] = useState('')
  const r = RELATIONS.find((x) => x.id === rel)!
  return (
    <>
      <div className="chips">
        {RELATIONS.map((x) => <button key={x.id} className={`chip ${rel === x.id ? 'on' : ''}`} onClick={() => setRel(x.id)}>{x.e} {x.label}</button>)}
      </div>
      <form className="add-row" onSubmit={(e) => { e.preventDefault(); if (nm.trim()) { setPeople([...people, { name: nm.trim(), rel, e: r.e }]); setNm('') } }}>
        <input id="q-person" className="input" value={nm} onChange={(e) => setNm(e.target.value)} placeholder={`Nombre (${r.label.toLowerCase()})`} maxLength={14} />
        <button className="btn primary" disabled={!nm.trim()}>Agregar</button>
      </form>
      <div className="people">
        {people.map((x, i) => (
          <div key={i} className="person"><span>{x.e}</span><b>{cap(x.name)}</b><small>{RELATIONS.find((r) => r.id === x.rel)?.label}</small>
            <button className="x" aria-label={`Quitar a ${x.name}`} onClick={() => setPeople(people.filter((_, j) => j !== i))}>✕</button></div>
        ))}
      </div>
    </>
  )
}

/* ---------- Palabras propias ---------- */
function OwnWords({ words, setWords }: { words: Word[]; setWords: (v: Word[]) => void }) {
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState('')
  const guess = lookupWord(text)?.e ?? ''
  const chosen = emoji || guess
  return (
    <>
      <form className="add-row" onSubmit={(e) => {
        e.preventDefault()
        const w = text.trim().toLowerCase()
        if (!w) return
        setWords([...words.filter((x) => x.w !== w), { w, e: chosen }]); setText(''); setEmoji('')
      }}>
        <span className="emoji-slot" aria-label="Dibujo elegido">{chosen || '❔'}</span>
        <input id="q-word" className="input" value={text} onChange={(e) => { setText(e.target.value); setEmoji('') }} placeholder="Ej.: chupete, empanada, Toto" maxLength={14} />
        <button className="btn primary" disabled={!text.trim()}>Agregar</button>
      </form>
      {text.trim() && (
        <div className="palette small">
          {EMOJI_PALETTE.map((e) => <button key={e} className={chosen === e ? 'on' : ''} onClick={() => setEmoji(e)}>{e}</button>)}
        </div>
      )}
      <div className="word-chips">
        {words.map((w) => <button key={w.w} className="wchip" onClick={() => setWords(words.filter((x) => x !== w))}>{w.e} {w.w} ✕</button>)}
      </div>
    </>
  )
}
