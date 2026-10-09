import { createContext, useContext, useRef, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { usePersistentList } from '../hooks/usePersistentList';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { logActivity } from '../services/activityLog';
import { applyEmployeeNote, applyMark, MARK_LABEL, markField, markPayload, type MarkKind, type MarkPayload } from '../services/jobsService';
import type { NoteHistoryEntry, Property } from '../types';
import { errorCode, makeId } from '../utils/ids';
import { useLanguage } from './LanguageContext';
import { checkOnline } from './NetworkContext';
import { useCurrentUser } from './SessionContext';

type Op =
  | { type: 'mark'; id: string; userId: string; propertyId: string; label: string; payload: MarkPayload }
  | { type: 'note'; id: string; userId: string; propertyId: string; label: string; entry: NoteHistoryEntry };
type MarkOp = Extract<Op, { type: 'mark' }>;
type NoteOp = Extract<Op, { type: 'note' }>;

interface OutboxValue {
  mark: (p: Property, kind: MarkKind, label: string) => void;
  addNote: (propertyId: string, text: string, label: string) => void;
  pendingNotes: (propertyId: string) => NoteHistoryEntry[];
  pendingCount: number;
}

const OutboxContext = createContext<OutboxValue | null>(null);
const isPermanent = (err: unknown) => /permission-denied|not-found|invalid-argument/.test(errorCode(err));

export function OutboxProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const { t } = useLanguage();
  const { items, loaded, ref, update } = usePersistentList<Op>('pc_crew_outbox_v1');
  const inFlight = useRef(new Set<string>());
  const notesRunning = useRef(false);

  const drop = (id: string) => update((prev) => prev.filter((o) => o.id !== id));
  const reject = (op: Op, err: unknown) => {
    console.error('Cambio rechazado por el servidor:', err);
    drop(op.id);
    Alert.alert(t.error, `${op.label}\n${errorCode(err)}`);
  };

  const sendMark = (op: MarkOp) => {
    if (inFlight.current.has(op.id)) return;
    inFlight.current.add(op.id);
    applyMark(op.propertyId, op.payload)
      .then(() => drop(op.id))
      .catch((err) => {
        if (isPermanent(err)) reject(op, err);
      })
      .finally(() => inFlight.current.delete(op.id));
  };

  const nextNote = () => ref.current.find((o): o is NoteOp => o.type === 'note' && o.userId === user.id);
  const drainNotes = async () => {
    for (let op = nextNote(); op; op = nextNote()) {
      try {
        const res = await applyEmployeeNote(op.propertyId, op.entry);
        drop(op.id);
        if (res) logActivity({ action: 'update', user, targetId: op.propertyId, targetLabel: op.label, changes: [{ field: 'employeeNote', ...res }] });
      } catch (err) {
        if (!isPermanent(err)) return;
        reject(op, err);
      }
    }
  };
  const sendNotes = async () => {
    if (notesRunning.current || !(await checkOnline())) return;
    notesRunning.current = true;
    drainNotes()
      .catch((err) => console.error('Error enviando notas:', err))
      .then(() => {
        notesRunning.current = false;
      });
  };

  useWhenOnline(() => {
    ref.current.forEach((o) => {
      if (o.type === 'mark' && o.userId === user.id) sendMark(o);
    });
    sendNotes();
  }, loaded);

  const mine = items.filter((o) => o.userId === user.id);
  const value: OutboxValue = {
    mark: (p, kind, label) => {
      const payload = markPayload(kind, user, new Date().toISOString());
      const op: MarkOp = { type: 'mark', id: makeId('op'), userId: user.id, propertyId: p.id, label, payload };
      update((prev) => [...prev, op]);
      sendMark(op);
      const field = markField(kind);
      logActivity({
        action: 'update',
        user,
        targetId: p.id,
        targetLabel: label,
        changes: [{ field, before: p[field] || '', after: payload[field] || '' }],
        detail: MARK_LABEL[kind],
      });
    },
    addNote: (propertyId, text, label) => {
      const entry: NoteHistoryEntry = { field: 'employeeNote', text, user: user.email, at: new Date().toISOString(), action: 'created' };
      update((prev) => [...prev, { type: 'note', id: makeId('op'), userId: user.id, propertyId, label, entry }]);
      sendNotes();
    },
    pendingNotes: (propertyId) => mine.filter((o): o is NoteOp => o.type === 'note' && o.propertyId === propertyId).map((o) => o.entry),
    pendingCount: mine.length,
  };

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
}

export function useOutbox(): OutboxValue {
  const ctx = useContext(OutboxContext);
  if (!ctx) throw new Error('useOutbox debe usarse dentro de <OutboxProvider>');
  return ctx;
}
