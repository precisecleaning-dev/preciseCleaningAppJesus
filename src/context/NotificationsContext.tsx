// src/context/NotificationsContext.tsx
// ⭐ CENTRO DE NOTIFICACIONES DEL EMPLEADO.
//
//    No hace falta que la web "mande" nada: la app compara lo que el empleado
//    ya vio con lo que llega en vivo de Firestore y genera un aviso por cada
//    cambio que le importa:
//
//      · assigned  → la oficina le asignó una casa nueva
//      · removed   → una casa salió de su lista
//      · schedule  → cambió la fecha o el horario
//      · status    → cambió el status (p. ej. pasó a Recall)
//      · note      → la oficina escribió una nota en la casa
//      · payroll   → se registró un pago a su nombre
//      · paid      → un pago pasó a Paid
//
//    Lo "ya visto" se guarda por empleado en el teléfono. La primera vez solo
//    se toma la foto inicial (no se avisa de todo lo que ya existía).
//    Mientras la app está abierta, cada aviso nuevo aparece como banner animado
//    con vibración suave; todos quedan en la campana con contador de no leídos.
//
//    Límite conocido: con la app CERRADA no hay aviso del sistema (push). Eso
//    requiere una Cloud Function + Firebase Cloud Messaging; los cambios
//    igual aparecen en la campana al abrir la app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { PayrollRecord, Property } from '../types';
import { useJobs } from './JobsContext';
import { recordTotal, usePayroll } from './PayrollContext';
import { useCurrentUser } from './SessionContext';

export type NotifKind = 'assigned' | 'removed' | 'schedule' | 'status' | 'note' | 'payroll' | 'paid';

export interface AppNotification {
  id: string;
  kind: NotifKind;
  at: number;
  read: boolean;
  jobId?: string;
  /** Datos para armar el texto en el idioma actual (no se guarda texto traducido). */
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

interface Stored {
  jobs: Record<string, JobFingerprint> | null;
  pay: Record<string, string> | null;
  list: AppNotification[];
}

interface NotificationsValue {
  list: AppNotification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Aviso flotante actual (lo pinta <NotificationToast/>). */
  toast: AppNotification | null;
  dismissToast: () => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

const MAX_ITEMS = 60;
const SETTLE_MS = 1200;
const keyFor = (uid: string) => `pc_crew_notifications_v1_${uid}`;
const makeId = () => `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const { jobs, settled, statusOf, clientName } = useJobs();
  const { records, loaded: payrollLoaded } = usePayroll();
  const [stored, setStored] = useState<Stored | null>(null);
  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);
  const storedRef = useRef<Stored | null>(null);

  // Cargar lo guardado de ESTE empleado.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(keyFor(user.id))
      .then((raw) => (raw ? (JSON.parse(raw) as Stored) : { jobs: null, pay: null, list: [] }))
      .catch(() => ({ jobs: null, pay: null, list: [] }) as Stored)
      .then((s) => {
        if (!alive) return;
        storedRef.current = s;
        setStored(s);
      });
    return () => {
      alive = false;
    };
  }, [user.id]);

  const save = useCallback(
    (next: Stored) => {
      storedRef.current = next;
      setStored(next);
      AsyncStorage.setItem(keyFor(user.id), JSON.stringify(next)).catch(() => undefined);
    },
    [user.id],
  );

  // Huella de cada casa: solo los campos que al empleado le importa saber que cambiaron.
  const fingerprint = useCallback(
    (p: Property): JobFingerprint => {
      const me = user.email.toLowerCase();
      return {
        status: statusOf(p)?.name || p.statusId || '',
        date: String(p.scheduleDate || ''),
        time: [p.timeIn, p.timeOut].filter(Boolean).join(' – '),
        othersNotes: (p.notesHistory || []).filter((e) => e.field !== 'officeNote' && String(e.user || '').toLowerCase() !== me).length,
        note: String(p.note || '').trim(),
        client: clientName(p),
        address: p.address || '',
      };
    },
    [user.email, statusOf, clientName],
  );

  // Comparar SOLO cuando todo llegó y los datos se quedaron quietos un momento.
  useEffect(() => {
    if (!stored || !settled || !payrollLoaded) return;
    const timer = setTimeout(() => {
      const prev = storedRef.current;
      if (!prev) return;
      const jobsNow: Record<string, JobFingerprint> = {};
      jobs.forEach((j) => (jobsNow[j.id] = fingerprint(j)));
      const payNow: Record<string, string> = {};
      records.forEach((r) => (payNow[r.id] = r.status || 'Pending'));

      // Primera vez en este teléfono: solo la foto inicial.
      if (!prev.jobs || !prev.pay) {
        save({ ...prev, jobs: jobsNow, pay: payNow });
        return;
      }

      const fresh: AppNotification[] = [];
      const base = () => ({ id: makeId(), at: Date.now(), read: false });
      const me = user.email.toLowerCase();

      for (const j of jobs) {
        const now = jobsNow[j.id];
        const before = prev.jobs[j.id];
        const where = { jobId: j.id, client: now.client, address: now.address };
        if (!before) {
          fresh.push({ ...base(), kind: 'assigned', ...where, from: now.date, to: now.time });
          continue;
        }
        if (before.date !== now.date || before.time !== now.time) {
          fresh.push({ ...base(), kind: 'schedule', ...where, from: [before.date, before.time].filter(Boolean).join(' '), to: [now.date, now.time].filter(Boolean).join(' ') });
        }
        if (before.status !== now.status && now.status) {
          fresh.push({ ...base(), kind: 'status', ...where, from: before.status, to: now.status });
        }
        if (now.othersNotes > before.othersNotes) {
          const last = [...(j.notesHistory || [])].reverse().find((e) => e.field !== 'officeNote' && String(e.user || '').toLowerCase() !== me);
          fresh.push({ ...base(), kind: 'note', ...where, text: last?.text || now.note });
        } else if (now.note && now.note !== before.note) {
          fresh.push({ ...base(), kind: 'note', ...where, text: now.note });
        }
      }
      for (const id of Object.keys(prev.jobs)) {
        if (!jobsNow[id]) {
          const gone = prev.jobs[id];
          fresh.push({ ...base(), kind: 'removed', client: gone.client, address: gone.address });
        }
      }

      const recById = new Map<string, PayrollRecord>(records.map((r) => [r.id, r]));
      for (const [id, status] of Object.entries(payNow)) {
        const r = recById.get(id);
        if (!r) continue;
        if (!(id in prev.pay)) fresh.push({ ...base(), kind: status === 'Paid' ? 'paid' : 'payroll', amount: recordTotal(r), jobId: r.propertyId || undefined });
        else if (prev.pay[id] !== 'Paid' && status === 'Paid') fresh.push({ ...base(), kind: 'paid', amount: recordTotal(r), jobId: r.propertyId || undefined });
      }

      const unchanged = JSON.stringify(prev.jobs) === JSON.stringify(jobsNow) && JSON.stringify(prev.pay) === JSON.stringify(payNow);
      if (unchanged && fresh.length === 0) return;
      save({ jobs: jobsNow, pay: payNow, list: [...fresh, ...prev.list].slice(0, MAX_ITEMS) });

      if (fresh.length > 0 && AppState.currentState === 'active') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        setToastQueue((q) => [...q, ...fresh.slice(0, 3)]);
      }
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [stored, settled, payrollLoaded, jobs, records, fingerprint, save, user.email]);

  const markRead = useCallback(
    (id: string) => {
      const s = storedRef.current;
      if (!s) return;
      save({ ...s, list: s.list.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    },
    [save],
  );

  const markAllRead = useCallback(() => {
    const s = storedRef.current;
    if (!s) return;
    save({ ...s, list: s.list.map((n) => ({ ...n, read: true })) });
  }, [save]);

  const dismissToast = useCallback(() => setToastQueue((q) => q.slice(1)), []);

  const value = useMemo<NotificationsValue>(() => {
    const list = stored?.list || [];
    return {
      list,
      unread: list.filter((n) => !n.read).length,
      markRead,
      markAllRead,
      toast: toastQueue[0] || null,
      dismissToast,
    };
  }, [stored, markRead, markAllRead, toastQueue, dismissToast]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
