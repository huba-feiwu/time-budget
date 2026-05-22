// ---- Time Formatting ----

export function formatHours(hours: number): string {
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  const sign = hours < 0 ? '-' : '';
  if (h === 0) return `${sign}${m}min`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h${m}min`;
}

export function toDecimal(h: number, m: number): number {
  return Math.round((h + m / 60) * 100) / 100;
}

export function fromDecimal(hours: number): { h: number; m: number } {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return { h, m };
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const LS_KEY = 'dayStartHour';

export function getDayStartHour(): number {
  try { return parseInt(localStorage.getItem(LS_KEY) || '0', 10); }
  catch { return 0; }
}

export function setDayStartHour(h: number): void {
  localStorage.setItem(LS_KEY, String(h));
}

export function todayStr(): string {
  const hour = getDayStartHour();
  const d = new Date();
  if (hour > 0 && d.getHours() < hour) d.setDate(d.getDate() - 1);
  return dateStr(d);
}

const DARK_KEY = 'darkMode';

export function getDarkMode(): boolean {
  try { return localStorage.getItem(DARK_KEY) === 'true'; }
  catch { return false; }
}

export function setDarkMode(v: boolean): void {
  localStorage.setItem(DARK_KEY, String(v));
}

const SLEEP_KEY = 'sleepInPct';

export function getSleepInPct(): boolean {
  try { return localStorage.getItem(SLEEP_KEY) !== 'false'; }
  catch { return true; }
}

export function setSleepInPct(v: boolean): void {
  localStorage.setItem(SLEEP_KEY, String(v));
}

const TIME_MODE_KEY = 'recordTimeMode';

export function getRecordTimeMode(): 'start' | 'end' | 'estimated' {
  try {
    const v = localStorage.getItem(TIME_MODE_KEY);
    if (v === 'end' || v === 'start' || v === 'estimated') return v;
    return 'start';
  } catch { return 'start'; }
}

export function setRecordTimeMode(v: 'start' | 'end' | 'estimated'): void {
  localStorage.setItem(TIME_MODE_KEY, v);
}

const TRAY_KEY = 'closeToTray';

export function getCloseToTray(): boolean {
  try { return localStorage.getItem(TRAY_KEY) === 'true'; }
  catch { return false; }
}

export function setCloseToTray(v: boolean): void {
  localStorage.setItem(TRAY_KEY, String(v));
}
