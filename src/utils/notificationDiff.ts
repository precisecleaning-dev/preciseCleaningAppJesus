import type { PayrollRecord, Property } from '../types';
import { recordTotal } from '../services/payrollService';

export type NotifKind = 'assigned' | 'removed' | 'schedule' | 'status' | 'note' | 'payroll' | 'paid';

export interface AppNotification {
  id: string;
  kind: NotifKind;
  at: number;
  read: boolean;
  jobId?: string;
  client?: string;
  address?: string;
  from?: string;
  to?: string;
  amount?: number;
  text?: string;
}

interface JobFingerprint {
  status: string;
  date: string;
  time: string;
  othersNotes: number;
  note: string;
  client: string;
  address: string;
}

export interface Snapshot {
  jobs: Record<string, JobFingerprint>;
  pay: Record<string, string>;
}

interface Helpers {
  myEmail: string;
  statusName: (p: Property) => string;
  clientName: (p: Property) => string;
}

const byOthers = (myEmail: string) => (e: { field: string; user?: string }) => e.field !== 'officeNote' && String(e.user || '').toLowerCase() !== myEmail;

export function takeSnapshot(jobs: Property[], records: PayrollRecord[], h: Helpers): Snapshot {
  const snap: Snapshot = { jobs: {}, pay: {} };
  jobs.forEach((p) => {
    snap.jobs[p.id] = {
      status: h.statusName(p),
      date: String(p.scheduleDate || ''),
      time: [p.timeIn, p.timeOut].filter(Boolean).join(' – '),
      othersNotes: (p.notesHistory || []).filter(byOthers(h.myEmail)).length,
      note: String(p.note || '').trim(),
      client: h.clientName(p),
      address: p.address || '',
    };
  });
  records.forEach((r) => (snap.pay[r.id] = r.status || 'Pending'));
  return snap;
}

export function diffSnapshots(prev: Snapshot, now: Snapshot, jobs: Property[], records: PayrollRecord[], myEmail: string): AppNotification[] {
  const out: AppNotification[] = [];
  const add = (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => out.push({ ...n, id: `n-${Date.now()}-${out.length}`, at: Date.now(), read: false });
  const when = (f: JobFingerprint) => [f.date, f.time].filter(Boolean).join(' ');

  for (const j of jobs) {
    const cur = now.jobs[j.id];
    const old = prev.jobs[j.id];
    const where = { jobId: j.id, client: cur.client, address: cur.address };
    if (!old) {
      add({ kind: 'assigned', ...where });
      continue;
    }
    if (when(old) !== when(cur)) add({ kind: 'schedule', ...where, from: when(old), to: when(cur) });
    if (cur.status && old.status !== cur.status) add({ kind: 'status', ...where, from: old.status, to: cur.status });
    if (cur.othersNotes > old.othersNotes) add({ kind: 'note', ...where, text: [...(j.notesHistory || [])].reverse().find(byOthers(myEmail))?.text || cur.note });
    else if (cur.note && cur.note !== old.note) add({ kind: 'note', ...where, text: cur.note });
  }
  Object.entries(prev.jobs).forEach(([id, gone]) => !now.jobs[id] && add({ kind: 'removed', client: gone.client, address: gone.address }));
  records.forEach((r) => {
    const status = now.pay[r.id];
    const paidNow = status === 'Paid' && prev.pay[r.id] !== 'Paid';
    if (!(r.id in prev.pay) || paidNow) add({ kind: paidNow ? 'paid' : 'payroll', amount: recordTotal(r), jobId: r.propertyId || undefined });
  });
  return out;
}
