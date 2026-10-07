import { load, save, remove } from './storage';
import { DEFAULT_DAILY_LIMIT_MIN, MAX_PROFILES } from './config';

export type AgeGroup = '3-5' | '6-8';
export type Device = 'phone' | 'tablet' | 'desktop';

export interface Profile {
  id: string;
  name: string;
  avatar: number;
  age: AgeGroup;
  createdAt: number;
}

export interface ProfileData {
  /** estrellas por juego, índice = nivel */
  stars: Record<string, number[]>;
  /** segundos jugados por día (YYYY-MM-DD) */
  playLog: Record<string, number>;
  /** veces que completó cada letra (clave: "a", "A", "c:a" cursiva) */
  letters: Record<string, number>;
  /** misión del día marcada como hecha */
  missionsDone: Record<string, string>;
  /** minutos extra que dieron los padres hoy */
  bonusMin: Record<string, number>;
}

export interface Settings {
  unlocked: boolean;
  sound: boolean;
  voice: boolean;
  device: Device | null;
  dailyLimitMin: number; // 0 = sin límite
  activeProfile: string | null;
}

const defaultSettings: Settings = {
  unlocked: false,
  sound: true,
  voice: true,
  device: null,
  dailyLimitMin: DEFAULT_DAILY_LIMIT_MIN,
  activeProfile: null,
};

export const settings: Settings = { ...defaultSettings, ...load<Partial<Settings>>('settings', {}) };

export function saveSettings() {
  save('settings', settings);
}

export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---- Perfiles ----
export function getProfiles(): Profile[] {
  return load<Profile[]>('profiles', []);
}

export function saveProfiles(list: Profile[]) {
  save('profiles', list);
}

export function canAddProfile() {
  return getProfiles().length < MAX_PROFILES;
}

export function addProfile(p: Omit<Profile, 'id' | 'createdAt'>): Profile {
  const list = getProfiles();
  const prof: Profile = { ...p, id: Math.random().toString(36).slice(2, 10), createdAt: Date.now() };
  list.push(prof);
  saveProfiles(list);
  return prof;
}

export function updateProfile(p: Profile) {
  saveProfiles(getProfiles().map((x) => (x.id === p.id ? p : x)));
}

export function deleteProfile(id: string) {
  saveProfiles(getProfiles().filter((p) => p.id !== id));
  remove('data:' + id);
  if (settings.activeProfile === id) {
    settings.activeProfile = null;
    saveSettings();
  }
}

export function activeProfile(): Profile | null {
  const id = settings.activeProfile;
  return getProfiles().find((p) => p.id === id) || null;
}

const emptyData = (): ProfileData => ({ stars: {}, playLog: {}, letters: {}, missionsDone: {}, bonusMin: {} });

const dataCache = new Map<string, ProfileData>();

export function getData(profileId: string): ProfileData {
  let d = dataCache.get(profileId);
  if (!d) {
    d = { ...emptyData(), ...load<Partial<ProfileData>>('data:' + profileId, {}) };
    dataCache.set(profileId, d);
  }
  return d;
}

export function saveData(profileId: string) {
  const d = dataCache.get(profileId);
  if (d) save('data:' + profileId, d);
}

// ---- Progreso por juego ----
export function getStars(profileId: string, gameId: string): number[] {
  return getData(profileId).stars[gameId] || [];
}

export function setLevelStars(profileId: string, gameId: string, level: number, stars: number) {
  const d = getData(profileId);
  const arr = d.stars[gameId] || [];
  arr[level] = Math.max(arr[level] || 0, stars);
  for (let i = 0; i < arr.length; i++) if (arr[i] == null) arr[i] = 0;
  d.stars[gameId] = arr;
  saveData(profileId);
}

export function totalStars(profileId: string): number {
  const d = getData(profileId);
  return Object.values(d.stars).reduce((a, arr) => a + arr.reduce((x, y) => x + (y || 0), 0), 0);
}

export function markLetter(profileId: string, key: string) {
  const d = getData(profileId);
  d.letters[key] = (d.letters[key] || 0) + 1;
  saveData(profileId);
}

// ---- Tiempo de juego ----
export function addPlaySeconds(profileId: string, secs: number) {
  const d = getData(profileId);
  const t = today();
  d.playLog[t] = (d.playLog[t] || 0) + secs;
  saveData(profileId);
}

export function playedTodaySec(profileId: string): number {
  return getData(profileId).playLog[today()] || 0;
}

export function limitTodaySec(profileId: string): number {
  if (!settings.dailyLimitMin) return Infinity;
  const bonus = getData(profileId).bonusMin[today()] || 0;
  return (settings.dailyLimitMin + bonus) * 60;
}

export function remainingTodaySec(profileId: string): number {
  return Math.max(0, limitTodaySec(profileId) - playedTodaySec(profileId));
}

export function addBonusMinutes(profileId: string, min: number) {
  const d = getData(profileId);
  const t = today();
  d.bonusMin[t] = (d.bonusMin[t] || 0) + min;
  saveData(profileId);
}

/** Días seguidos con juego (incluye hoy si ya jugó; si no, cuenta desde ayer). */
export function streak(profileId: string): number {
  const log = getData(profileId).playLog;
  const d = new Date();
  if (!(log[today(d)] > 0)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (log[today(d)] > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
