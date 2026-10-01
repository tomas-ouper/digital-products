// Acceso a la cuenta. Esta versión guarda las cuentas en el navegador para poder
// probar el recorrido completo. En producción se reemplaza `localAuth` por un
// adaptador de Supabase con la misma forma (ver README, sección Supabase).

export type AuthResult = { ok: true; email: string } | { ok: false; error: string }

export interface AuthAdapter {
  signUp(email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  requestReset(email: string): Promise<AuthResult>
}

const KEY = 'letra-viva:accounts'

type Accounts = Record<string, { hash: string; createdAt: string }>

function read(): Accounts {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function write(a: Accounts) {
  try { localStorage.setItem(KEY, JSON.stringify(a)) } catch { /* sin almacenamiento */ }
}

async function hash(s: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('lv:' + s))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    let h = 0
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
    return 'x' + h
  }
}

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
export const normEmail = (e: string) => e.trim().toLowerCase()

export const localAuth: AuthAdapter = {
  async signUp(email, password) {
    const e = normEmail(email)
    if (!isEmail(e)) return { ok: false, error: 'Revisa el correo: parece que le falta algo.' }
    if (password.length < 6) return { ok: false, error: 'La contraseña tiene que tener al menos 6 caracteres.' }
    const a = read()
    if (a[e]) return { ok: false, error: 'Ya hay una cuenta con ese correo. Ingresa con tu contraseña.' }
    // En producción: acá se verifica que el correo tenga una compra aprobada del upsell o el downsell.
    a[e] = { hash: await hash(password), createdAt: new Date().toISOString() }
    write(a)
    return { ok: true, email: e }
  },
  async signIn(email, password) {
    const e = normEmail(email)
    const a = read()
    if (!a[e]) return { ok: false, error: 'No encontramos una cuenta con ese correo. ¿Es el mismo con el que compraste?' }
    if (a[e].hash !== (await hash(password))) return { ok: false, error: 'La contraseña no coincide. Prueba otra vez o recupérala.' }
    return { ok: true, email: e }
  },
  async requestReset(email) {
    const e = normEmail(email)
    if (!isEmail(e)) return { ok: false, error: 'Revisa el correo: parece que le falta algo.' }
    return { ok: true, email: e }
  },
}

export const auth: AuthAdapter = localAuth
