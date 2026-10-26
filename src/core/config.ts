// Configuración leída de variables de entorno de Vite (.env / Vercel).
import { EN } from './i18n';

const env = import.meta.env as Record<string, string | undefined>;

// Palabra clave: CALIGRAFIA en /, HANDWRITING en /en/ (la del Kit en inglés).
export const ACCESS_CODE = (EN ? env.VITE_ACCESS_CODE_EN || 'HANDWRITING' : env.VITE_ACCESS_CODE || 'CALIGRAFIA').trim().toUpperCase();
export const DEFAULT_DAILY_LIMIT_MIN = Number(env.VITE_DAILY_LIMIT_MIN || 20) || 20;
export const MAX_PROFILES = 3;
