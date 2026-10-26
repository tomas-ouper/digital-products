// Idioma de la app. Lo fija el atributo lang del HTML de entrada:
// index.html (lang="es", ruta /) y en/index.html (lang="en", ruta /en/). Mismo código, otro idioma.
export type Lang = 'es' | 'en';

export const LANG: Lang = typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
export const EN = LANG === 'en';

/** Texto en el idioma activo: tr('Entrar', 'Enter'). */
export function tr(es: string, en: string): string {
  return EN ? en : es;
}

/** Elige entre dos valores (datos de niveles, listas) según el idioma. */
export function pick<T>(es: T, en: T): T {
  return EN ? en : es;
}
