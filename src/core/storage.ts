// Guardado local seguro: si localStorage no está disponible (modo privado, iframe), usa memoria.
// Cada idioma guarda aparte (mp: español, mp-en: inglés): perfiles, progreso y palabra clave no se mezclan.
import { EN } from './i18n';

const PREFIX = EN ? 'mp-en:' : 'mp:';
const mem = new Map<string, string>();

function rawGet(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    if (v !== null) return v;
  } catch {
    /* sin localStorage */
  }
  return mem.has(key) ? mem.get(key)! : null;
}

function rawSet(key: string, value: string) {
  mem.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* sin localStorage */
  }
}

function rawDel(key: string) {
  mem.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* sin localStorage */
  }
}

export function load<T>(key: string, fallback: T): T {
  const v = rawGet(PREFIX + key);
  if (v === null) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  rawSet(PREFIX + key, JSON.stringify(value));
}

export function remove(key: string) {
  rawDel(PREFIX + key);
}
