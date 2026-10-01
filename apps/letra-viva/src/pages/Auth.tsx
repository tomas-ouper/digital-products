import { useState } from 'react'
import { auth, isEmail } from '../lib/auth'
import { actions } from '../lib/store'
import { Confetti } from '../games/GameShell'
import mailTemplate from '../../emails/bienvenida.html?raw'

const go = (p: string) => { location.hash = p }

/** Primera pantalla después de comprar. */
export function Welcome() {
  return (
    <main className="auth">
      <Confetti />
      <div className="auth-card welcome">
        <div className="logo">Letra <b>Viva</b></div>
        <p className="eyebrow">¡Felicitaciones por tu compra!</p>
        <h1>Bienvenida a Letra Viva</h1>
        <p className="muted">La app que arma fichas y juegos con el nombre de tu hijo y con lo que más le gusta. Así practica con ganas, porque todo habla de su mundo.</p>
        <ol className="steps">
          <li><span>1</span><div><b>Crea tu acceso</b><small>con el correo con el que compraste</small></div></li>
          <li><span>2</span><div><b>Cuéntanos de tu hijo</b><small>su nombre, su gente y lo que le encanta</small></div></li>
          <li><span>3</span><div><b>Imprime su primera ficha</b><small>hoy mismo, en 3 minutos</small></div></li>
        </ol>
        <button className="btn primary big wide" onClick={() => go('/registro')}>Crear mi acceso</button>
        <button className="btn ghost wide" onClick={() => go('/ingresar')}>Ya tengo cuenta, ingresar</button>
      </div>
      <a className="demo-link" href="#/mail">Ver el correo de bienvenida que recibe la compradora</a>
    </main>
  )
}

function Field(props: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; hint?: string; autoFocus?: boolean; auto?: string }) {
  const [show, setShow] = useState(false)
  const isPw = props.type === 'password'
  return (
    <label className="field" htmlFor={props.id}>
      <span>{props.label}</span>
      <div className="input-wrap">
        <input id={props.id} className="input" type={isPw && !show ? 'password' : isPw ? 'text' : props.type ?? 'text'} value={props.value}
          onChange={(e) => props.onChange(e.target.value)} autoFocus={props.autoFocus} autoComplete={props.auto} />
        {isPw && <button type="button" className="peek" onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Ver'}</button>}
      </div>
      {props.hint && <small>{props.hint}</small>}
    </label>
  )
}

export function SignUp() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== pw2) return setErr('Las contraseñas no coinciden.')
    setBusy(true)
    const r = await auth.signUp(email, pw)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    actions.setSession(r.email)
    go('/nuevo')
  }
  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit}>
        <a className="back" href="#/bienvenida">← Volver</a>
        <h1>Crea tu acceso</h1>
        <p className="muted">Usa el mismo correo con el que compraste: así encontramos tu compra.</p>
        <Field id="su-email" label="Correo" type="email" value={email} onChange={(v) => { setEmail(v); setErr('') }} autoFocus auto="email" />
        <Field id="su-pw" label="Crea una contraseña" type="password" value={pw} onChange={(v) => { setPw(v); setErr('') }} hint="Al menos 6 caracteres." auto="new-password" />
        <Field id="su-pw2" label="Repite la contraseña" type="password" value={pw2} onChange={(v) => { setPw2(v); setErr('') }} auto="new-password" />
        {err && <p className="hint">{err}</p>}
        <button className="btn primary big wide" disabled={busy || !isEmail(email) || !pw}>{busy ? 'Creando…' : 'Crear mi cuenta'}</button>
        <p className="small center">¿Ya tienes cuenta? <a href="#/ingresar">Ingresa</a></p>
      </form>
    </main>
  )
}

export function SignIn() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await auth.signIn(email, pw)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    actions.setSession(r.email)
    go('/')
  }
  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit}>
        <a className="back" href="#/bienvenida">← Volver</a>
        <h1>Ingresa a Letra Viva</h1>
        <Field id="si-email" label="Correo" type="email" value={email} onChange={(v) => { setEmail(v); setErr('') }} autoFocus auto="email" />
        <Field id="si-pw" label="Contraseña" type="password" value={pw} onChange={(v) => { setPw(v); setErr('') }} auto="current-password" />
        {err && <p className="hint">{err}</p>}
        <button className="btn primary big wide" disabled={busy || !email || !pw}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        <p className="small center"><a href="#/recuperar">Olvidé mi contraseña</a> · <a href="#/registro">Crear acceso</a></p>
      </form>
    </main>
  )
}

export function Reset() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const r = await auth.requestReset(email)
    if (!r.ok) return setErr(r.error)
    setSent(true)
  }
  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit}>
        <a className="back" href="#/ingresar">← Volver</a>
        {sent ? (
          <>
            <div className="big-check">📬</div>
            <h1>Revisa tu correo</h1>
            <p className="muted">Si <b>{email}</b> tiene una cuenta, te llega un enlace para crear una contraseña nueva. Puede tardar un par de minutos; mira también en promociones o spam.</p>
            <p className="note">Vista de prueba: en esta versión todavía no se envían correos.</p>
          </>
        ) : (
          <>
            <h1>Recupera tu contraseña</h1>
            <p className="muted">Escribe el correo con el que compraste y te enviamos un enlace.</p>
            <Field id="rs-email" label="Correo" type="email" value={email} onChange={(v) => { setEmail(v); setErr('') }} autoFocus auto="email" />
            {err && <p className="hint">{err}</p>}
            <button className="btn primary big wide" disabled={!email}>Enviar enlace</button>
          </>
        )}
      </form>
    </main>
  )
}

/** Vista previa del correo que sale al aprobarse el pago. */
export function MailPreview() {
  // Se muestra el <body> del correo tal cual: los estilos van en línea, como en cualquier cliente de correo.
  const body = (mailTemplate.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '')
    .replace(/{{EMAIL}}/g, 'mama.de.martina@gmail.com').replace(/{{LINK}}/g, '#/registro')
  return (
    <main className="auth mail">
      <div className="mail-head">
        <a className="back" href="#/bienvenida">← Volver</a>
        <div className="mail-meta">
          <b>De:</b> Letra Viva &lt;hola@caligrafiamontessori.com&gt;<br />
          <b>Asunto:</b> 🎉 Tu acceso a Letra Viva está listo
        </div>
      </div>
      <div className="mail-frame" dangerouslySetInnerHTML={{ __html: body }} />
    </main>
  )
}
