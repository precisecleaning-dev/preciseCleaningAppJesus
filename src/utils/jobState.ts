import type { Property } from '../types';
import { DAY_MS, dateSortValue, startOfToday } from './dateFormat';

export type WorkState = 'notStarted' | 'inProgress' | 'finished';

export const workStateOf = (p: Property): WorkState => (p.employeeFinishedAt ? 'finished' : p.employeeStartedAt ? 'inProgress' : 'notStarted');

export type Segment = 'today' | 'upcoming' | 'history';

const OVERDUE_WINDOW_DAYS = 14;

function segmentOf(p: Property, now = new Date()): Segment {
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

const HISTORY_LIMIT = 100;

export function groupJobs(jobs: Property[], now = new Date()): Record<Segment, Property[]> {
  const out: Record<Segment, Property[]> = { today: [], upcoming: [], history: [] };
  jobs.forEach((j) => out[segmentOf(j, now)].push(j));
  const when = (j: Property) => dateSortValue(j.scheduleDate || j.receiveDate);
  const running = (j: Property) => Number(workStateOf(j) === 'inProgress');
  out.today.sort((a, b) => running(b) - running(a) || when(a) - when(b) || String(a.timeIn || '').localeCompare(String(b.timeIn || '')));
  out.upcoming.sort((a, b) => when(a) - when(b));
  out.history = out.history.sort((a, b) => when(b) - when(a)).slice(0, HISTORY_LIMIT);
  return out;
}
