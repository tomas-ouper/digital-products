// Tipografías de trazo. Imprenta: Andika (diseñada para alfabetización, licencia OFL).
// Cursiva: la familia Playwrite de Google Fonts, que tiene una versión por país
// basada en el modelo escolar de cada uno (OFL, uso comercial permitido).
import type { Country, Script } from './store'

const PLAYWRITE: Record<Country, string> = {
  AR: 'Playwrite AR', MX: 'Playwrite MX', CO: 'Playwrite CO', PE: 'Playwrite PE', CL: 'Playwrite CL', ES: 'Playwrite ES',
}

const loaded = new Set<string>()

export function fontFor(script: Script, country: Country): string {
  if (script === 'imprenta') return 'Andika'
  const fam = PLAYWRITE[country]
  if (!loaded.has(fam)) {
    loaded.add(fam)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}:wght@400&display=swap`
    document.head.appendChild(link)
  }
  return fam
}

export const COUNTRIES: { id: Country; label: string }[] = [
  { id: 'AR', label: 'Argentina' }, { id: 'MX', label: 'México' }, { id: 'CO', label: 'Colombia' },
  { id: 'PE', label: 'Perú' }, { id: 'CL', label: 'Chile' }, { id: 'ES', label: 'España' },
]
