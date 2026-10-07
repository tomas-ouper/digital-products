// Guardado local seguro: si localStorage no está disponible (modo privado, iframe), usa memoria.
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
  const v = rawGet('mp:' + key);
  if (v === null) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  rawSet('mp:' + key, JSON.stringify(value));
}

export function remove(key: string) {
  rawDel('mp:' + key);
}
