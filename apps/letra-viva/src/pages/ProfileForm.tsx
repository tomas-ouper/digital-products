import { useState } from 'react'
import { actions, type Child, type Country, type Script } from '../lib/store'
import { ALPHABET, THEMES } from '../lib/content'
import { COUNTRIES } from '../lib/fonts'

/** Las cinco preguntas: alcanza con esto para armar todo lo personalizado. */
export function ProfileForm({ initial, onDone }: { initial?: Child; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initial?.name ?? '')
  const [age, setAge] = useState(initial?.age ?? 5)
  const [hand, setHand] = useState<Child['hand']>(initial?.hand ?? 'diestro')
  const [known, setKnown] = useState<string[]>(initial?.known ?? [])
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? [])
  const [country, setCountry] = useState<Country>(initial?.country ?? 'MX')
  const [script, setScript] = useState<Script>(initial?.script ?? 'imprenta')

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const steps = [
    {
      q: '¿Cómo se llama tu hijo o hija?',
      ok: name.trim().length > 1,
      body: (
        <>
          <input className="input big" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Martina" maxLength={16} />
          <p className="muted">Va a aparecer en cada ficha y en los juegos. Escríbelo como quieras que lo aprenda.</p>
        </>
      ),
    },
    {
      q: `¿Cuántos años tiene ${name || 'tu hijo'}?`,
      ok: true,
      body: (
        <div className="chips">
          {[3, 4, 5, 6, 7, 8].map((a) => <button key={a} className={`chip big ${age === a ? 'on' : ''}`} onClick={() => setAge(a)}>{a} años</button>)}
        </div>
      ),
    },
    {
      q: '¿Con qué mano escribe?',
      ok: true,
      body: (
        <div className="chips">
          <button className={`chip big ${hand === 'diestro' ? 'on' : ''}`} onClick={() => setHand('diestro')}>✋ Derecha</button>
          <button className={`chip big ${hand === 'zurdo' ? 'on' : ''}`} onClick={() => setHand('zurdo')}>🤚 Izquierda</button>
        </div>
      ),
    },
    {
      q: '¿Qué letras ya reconoce?',
      ok: true,
      body: (
        <>
          <div className="chips letters">
            {ALPHABET.map((l) => <button key={l} className={`chip ${known.includes(l) ? 'on' : ''}`} onClick={() => toggle(known, setKnown, l)}>{l.toUpperCase()}</button>)}
          </div>
          <p className="muted">Si no estás segura, déjalo vacío: empezamos por las vocales.</p>
        </>
      ),
    },
    {
      q: '¿Qué le encanta?',
      ok: interests.length > 0,
      body: (
        <>
          <div className="chips">
            {Object.entries(THEMES).map(([k, t]) => <button key={k} className={`chip big ${interests.includes(k) ? 'on' : ''}`} onClick={() => toggle(interests, setInterests, k)}>{t.e} {t.label}</button>)}
          </div>
          <p className="muted">Las palabras de sus fichas y juegos salen de aquí. Elige uno o más.</p>
        </>
      ),
    },
    {
      q: '¿Qué letra usan en su escuela?',
      ok: true,
      body: (
        <>
          <div className="chips">
            <button className={`chip big ${script === 'imprenta' ? 'on' : ''}`} onClick={() => setScript('imprenta')}><span style={{ fontFamily: 'Andika' }}>Imprenta</span></button>
            <button className={`chip big ${script === 'cursiva' ? 'on' : ''}`} onClick={() => setScript('cursiva')}>Cursiva</button>
          </div>
          <label className="field">País (define el modelo de cursiva escolar)
            <select className="input" value={country} onChange={(e) => setCountry(e.target.value as Country)}>
              {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
        </>
      ),
    },
  ]
  const s = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="onboard">
      <div className="progress-bar"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <p className="eyebrow">Pregunta {step + 1} de {steps.length}</p>
      <h1>{s.q}</h1>
      {s.body}
      <div className="row-btns">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Atrás</button>}
        <button className="btn primary big" disabled={!s.ok} onClick={() => {
          if (!last) return setStep(step + 1)
          actions.saveChild({ id: initial?.id, name: name.trim(), age, hand, known, interests, country, script })
          onDone()
        }}>{last ? `Armar el camino de ${name.trim() || 'mi hijo'}` : 'Siguiente'}</button>
      </div>
    </div>
  )
}
