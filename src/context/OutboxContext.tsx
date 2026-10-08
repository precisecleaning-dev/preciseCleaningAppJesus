// src/context/OutboxContext.tsx
// ⭐ COLA DE CAMBIOS PENDIENTES (Start/Finish y notas).
//
//    En React Native, Firestore no tiene caché persistente: un cambio hecho
//    sin señal vive solo en memoria y se pierde si se cierra la app antes de
//    reconectar. Esta cola guarda cada cambio en el teléfono hasta que el
//    servidor lo confirma:
//    · Start/Finish se aplican AL INSTANTE en pantalla (Firestore muestra el
//      cambio local de inmediato) y se re-envían al reabrir la app si no
//      llegaron. Re-enviar el mismo payload es inofensivo.
//    · Las notas necesitan conexión (transacción): quedan en cola, se muestran
//      como "pendientes" y se envían al volver la señal, sin duplicarse.
//    Los cambios se aplican en el orden en que se hicieron.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, AppState } from 'react-native';
import { logActivity } from '../services/activityLog';
import { applyEmployeeNote, applyMark, MARK_LABEL, markPayload, type MarkKind, type MarkPayload } from '../services/jobsService';
import type { NoteHistoryEntry, Property } from '../types';
import { useLanguage } from './LanguageContext';
import { checkOnline, useOnline } from './NetworkContext';
import { useCurrentUser } from './SessionContext';

const OUTBOX_KEY = 'pc_crew_outbox_v1';

type Op =
  | { type: 'mark'; id: string; userId: string; propertyId: string; label: string; payload: MarkPayload }
  | { type: 'note'; id: string; userId: string; propertyId: string; label: string; entry: NoteHistoryEntry };

interface OutboxValue {
  mark: (p: Property, kind: MarkKind, label: string) => Promise<void>;
  addNote: (propertyId: string, text: string, label: string) => Promise<void>;
  pendingNotes: (propertyId: string) => NoteHistoryEntry[];
  pendingCount: number;
}

const OutboxContext = createContext<OutboxValue | null>(null);

const makeId = () => `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const codeOf = (err: unknown) => String((err as { code?: string })?.code || '');
const isPermanent = (err: unknown) => ['permission-denied', 'not-found', 'invalid-argument'].some((c) => codeOf(err).includes(c));

export function OutboxProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const online = useOnline();
  const { t } = useLanguage();
  const [ops, setOps] = useState<Op[]>([]);
  const opsRef = useRef<Op[]>([]);
  const loadedRef = useRef(false);
  const runningRef = useRef(false);
  const inFlight = useRef(new Set<string>());
  const userRef = useRef(user);
  const tRef = useRef(t);
  useEffect(() => {
    userRef.current = user;
    tRef.current = t;
  }, [user, t]);

  const commit = useCallback((updater: (prev: Op[]) => Op[]) => {
    const next = updater(opsRef.current);
    opsRef.current = next;
    setOps(next);
    AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(next)).catch((e) => console.error('No se pudo guardar la cola de cambios', e));
  }, []);

  const drop = useCallback((id: string) => commit((prev) => prev.filter((o) => o.id !== id)), [commit]);

  const reportPermanent = useCallback(
    (op: Op, err: unknown) => {
      console.error('Cambio rechazado por el servidor:', err);
      drop(op.id);
      Alert.alert(tRef.current.error, `${op.label}\n${codeOf(err) || String(err)}`);
    },
    [drop],
  );

  /** Envía una marca. No se espera en la UI: offline la promesa sigue abierta hasta reconectar. */
  const sendMark = useCallback(
    (op: Extract<Op, { type: 'mark' }>) => {
      if (inFlight.current.has(op.id)) return;
      inFlight.current.add(op.id);
      applyMark(op.propertyId, op.payload)
        .then(() => drop(op.id))
        .catch((err) => {
          if (isPermanent(err)) reportPermanent(op, err);
        })
        .finally(() => inFlight.current.delete(op.id));
    },
    [drop, reportPermanent],
  );

  /** Las notas van en orden y solo con conexión. */
  const processNotes = useCallback(async () => {
    if (runningRef.current || !loadedRef.current) return;
    runningRef.current = true;
    try {
      if (!(await checkOnline())) return;
      for (;;) {
        const me = userRef.current.id;
        const op = opsRef.current.find((o): o is Extract<Op, { type: 'note' }> => o.type === 'note' && o.userId === me);
        if (!op) break;
        try {
          const res = await applyEmployeeNote(op.propertyId, op.entry);
          drop(op.id);
          if (res) {
            logActivity({
              action: 'update',
              user: userRef.current,
              targetId: op.propertyId,
              targetLabel: op.label,
              changes: [{ field: 'employeeNote', before: res.before, after: res.after }],
            });
          }
        } catch (err) {
          if (isPermanent(err)) {
            reportPermanent(op, err);
            continue;
          }
          console.error('Nota pendiente, se reintenta con señal:', err);
          break;
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [drop, reportPermanent]);

  const flush = useCallback(() => {
    const me = userRef.current.id;
    opsRef.current.forEach((o) => {
      if (o.type === 'mark' && o.userId === me) sendMark(o);
    });
    processNotes();
  }, [sendMark, processNotes]);

  useEffect(() => {
    AsyncStorage.getItem(OUTBOX_KEY)
      .then((raw) => {
        const list = raw ? (JSON.parse(raw) as Op[]) : [];
        opsRef.current = list;
        setOps(list);
      })
      .catch(() => undefined)
      .finally(() => {
        loadedRef.current = true;
        flush();
      });
  }, [flush]);

  useEffect(() => {
    if (online) flush();
  }, [online, flush]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  const mark = useCallback(
    async (p: Property, kind: MarkKind, label: string) => {
      const at = new Date().toISOString();
      const payload = markPayload(kind, userRef.current, at);
      const op: Op = { type: 'mark', id: makeId(), userId: userRef.current.id, propertyId: p.id, label, payload };
      commit((prev) => [...prev, op]);
      sendMark(op);
      const field = kind === 'start' || kind === 'undoStart' ? 'employeeStartedAt' : 'employeeFinishedAt';
      const before = (field === 'employeeStartedAt' ? p.employeeStartedAt : p.employeeFinishedAt) || '';
      logActivity({
        action: 'update',
        user: userRef.current,
        targetId: p.id,
        targetLabel: label,
        changes: [{ field, before, after: payload[field] || '' }],
        detail: MARK_LABEL[kind],
      });
    },
    [commit, sendMark],
  );

  const addNote = useCallback(
    async (propertyId: string, text: string, label: string) => {
      const entry: NoteHistoryEntry = {
        field: 'employeeNote',
        text,
        user: userRef.current.email,
        at: new Date().toISOString(),
        action: 'created',
      };
      commit((prev) => [...prev, { type: 'note', id: makeId(), userId: userRef.current.id, propertyId, label, entry }]);
      processNotes();
    },
    [commit, processNotes],
  );

  const value = useMemo<OutboxValue>(() => {
    const mine = ops.filter((o) => o.userId === user.id);
    return {
      mark,
      addNote,
      pendingNotes: (propertyId) =>
        mine.filter((o): o is Extract<Op, { type: 'note' }> => o.type === 'note' && o.propertyId === propertyId).map((o) => o.entry),
      pendingCount: mine.length,
    };
  }, [ops, user.id, mark, addNote]);

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
}

export function useOutbox(): OutboxValue {
  const ctx = useContext(OutboxContext);
  if (!ctx) throw new Error('useOutbox debe usarse dentro de <OutboxProvider>');
  return ctx;
}
