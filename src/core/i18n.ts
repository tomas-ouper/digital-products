// Idioma de la app. Lo fija el atributo lang del HTML de entrada:
// index.html (lang="es", ruta /), en/index.html (lang="en", ruta /en/) y fr/index.html (lang="fr", ruta /fr/).
// Mismo código, otro idioma.
export type Lang = 'es' | 'en' | 'fr';

const DOC_LANG = typeof document !== 'undefined' ? document.documentElement.lang.toLowerCase() : 'es';
export const LANG: Lang = DOC_LANG.startsWith('en') ? 'en' : DOC_LANG.startsWith('fr') ? 'fr' : 'es';
export const EN = LANG === 'en';
export const FR = LANG === 'fr';

/** Texto en el idioma activo: tr('Entrar', 'Enter', 'Entrer'). */
export function tr(es: string, en: string, fr: string): string {
  return FR ? fr : EN ? en : es;
}

/** Elige entre tres valores (datos de niveles, listas) según el idioma. */
export function pick<T>(es: T, en: T, fr: T): T {
  return FR ? fr : EN ? en : es;
}
