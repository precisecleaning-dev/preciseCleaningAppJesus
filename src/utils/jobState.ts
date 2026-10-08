// src/utils/jobState.ts
// Estado de trabajo según el Work Log (mismo criterio que homeData.ts en la web).
import type { Property } from '../types';
import { DAY_MS, dateSortValue, startOfToday } from './dateFormat';

export type WorkState = 'notStarted' | 'inProgress' | 'finished';

export const workStateOf = (p: Property): WorkState =>
  p.employeeFinishedAt ? 'finished' : p.employeeStartedAt ? 'inProgress' : 'notStarted';

export type Segment = 'today' | 'upcoming' | 'history';

/** Días hacia atrás que una casa sin terminar sigue apareciendo como "Atrasada" en Hoy. */
const OVERDUE_WINDOW_DAYS = 14;

/**
 * Reparte cada casa en una pestaña:
 *  · Hoy: agendada hoy, en curso, o atrasada (sin terminar, hasta 14 días).
 *  · Próximas: agendada a futuro y sin terminar.
 *  · Historial: terminadas, o atrasadas viejas (datos legacy sin Work Log).
 */
export function segmentOf(p: Property, now = new Date()): Segment {
  const state = workStateOf(p);
  if (state === 'finished') return 'history';
  if (state === 'inProgress') return 'today';
  const t = dateSortValue(p.scheduleDate || p.receiveDate);
  const today = startOfToday(now);
  if (!t) return 'today';
  if (t >= today + DAY_MS) return 'upcoming';
  if (t >= today - OVERDUE_WINDOW_DAYS * DAY_MS) return 'today';
  return 'history';
}

export const isOverdue = (p: Property, now = new Date()): boolean => {
  if (workStateOf(p) !== 'notStarted') return false;
  const t = dateSortValue(p.scheduleDate || p.receiveDate);
  return !!t && t < startOfToday(now);
};
