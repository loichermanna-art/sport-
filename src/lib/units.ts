import type { Settings } from '../data/types';

const LB = 2.2046226218;

/** Convertit une charge stockée en kg vers l'unité d'affichage choisie. */
export function toDisplay(kg: number, units: Settings['units']): number {
  return units === 'lb' ? kg * LB : kg;
}

/** Convertit une charge saisie dans l'unité d'affichage vers des kg (stockage). */
export function toKg(value: number, units: Settings['units']): number {
  return units === 'lb' ? value / LB : value;
}

export function unitLabel(units: Settings['units']): string {
  return units === 'lb' ? 'lb' : 'kg';
}

/** Formate une charge pour l'affichage, sans décimales inutiles. */
export function formatLoad(kg: number, units: Settings['units']): string {
  const v = toDisplay(kg, units);
  const rounded = Math.round(v * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1).replace('.', ',')} ${unitLabel(units)}`;
}

/** Volume en tonnes ou en kg selon l'ordre de grandeur. */
export function formatVolume(kg: number, units: Settings['units']): string {
  const v = toDisplay(kg, units);
  const u = unitLabel(units);
  if (v >= 1000) return `${(v / 1000).toFixed(1)} t`;
  return `${Math.round(v)} ${u}`;
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
