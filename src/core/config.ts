// Configuración leída de variables de entorno de Vite (.env / Vercel).
const env = import.meta.env as Record<string, string | undefined>;

export const ACCESS_CODE = (env.VITE_ACCESS_CODE || 'CALIGRAFIA').trim().toUpperCase();
export const DEFAULT_DAILY_LIMIT_MIN = Number(env.VITE_DAILY_LIMIT_MIN || 20) || 20;
export const MAX_PROFILES = 3;
