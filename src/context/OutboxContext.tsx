import { createContext, useContext, useRef, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { usePersistentList } from '../hooks/usePersistentList';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { logActivity } from '../services/activityLog';
import { applyEmployeeNote, applyMark, MARK_CONFLICT_CODE, MARK_LABEL, markField, markPayload, type MarkGuard, type MarkKind, type MarkPayload } from '../services/jobsService';
import type { NoteHistoryEntry, Property } from '../types';
import { errorCode, makeId } from '../utils/ids';
import { checkOnline } from './NetworkContext';
import { useCurrentUser } from './SessionContext';
import { t } from '../constants/strings';

type Op =
    | { type: 'mark'; id: string; userId: string; propertyId: string; label: string; payload: MarkPayload; guard?: MarkGuard; kind?: MarkKind }
    | { type: 'note'; id: string; userId: string; propertyId: string; label: string; entry: NoteHistoryEntry };
type MarkOp = Extract<Op, { type: 'mark' }>;
type NoteOp = Extract<Op, { type: 'note' }>;

interface OutboxValue {
    mark: (p: Property, kind: MarkKind, label: string) => void;
    addNote: (propertyId: string, text: string, label: string) => void;
    pendingNotes: (propertyId: string) => NoteHistoryEntry[];
    withPendingMarks: (property: Property) => Property;
    pendingCount: number;
}

const OutboxContext = createContext<OutboxValue | null>(null);
const isPermanent = (error: unknown) => new RegExp(`permission-denied|not-found|invalid-argument|${MARK_CONFLICT_CODE}`).test(errorCode(error));
const rejectionMessage = (error: unknown) => (errorCode(error) === MARK_CONFLICT_CODE ? t.markConflict : errorCode(error));

export const OutboxProvider = ({ children }: { children: ReactNode }) => {
    const user = useCurrentUser();
    const { items, loaded, ref, update } = usePersistentList<Op>('pc_crew_outbox_v1');
    const inFlight = useRef(new Set<string>());
    const notesRunning = useRef(false);

    const drop = (id: string) => update((prev) => prev.filter((o) => o.id !== id));
    const reject = (op: Op, error: unknown) => {
        console.error('Change rejected by the server:', error);
        drop(op.id);
        Alert.alert(t.error, `${op.label}\n${rejectionMessage(error)}`);
    };

    const logConfirmedMark = (op: MarkOp) => {
        if (!op.kind || !op.guard) return;
        logActivity({
            action: 'update',
            user,
            targetId: op.propertyId,
            targetLabel: op.label,
            changes: [{ field: op.guard.field, before: op.guard.expected || '', after: op.payload[op.guard.field] || '' }],
            detail: MARK_LABEL[op.kind],
        });
    };

    const sendMark = (op: MarkOp) => {
        if (inFlight.current.has(op.id)) return;
        inFlight.current.add(op.id);
        applyMark(op.propertyId, op.payload, op.guard)
            .then(() => {
                drop(op.id);
                logConfirmedMark(op);
            })
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
    const sendNotes = () => {
        if (notesRunning.current) return;
        notesRunning.current = true;
        checkOnline()
            .then((ok) => (ok ? drainNotes() : undefined))
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
            const guard: MarkGuard = { field: markField(kind), expected: p[markField(kind)] ?? null };
            const op: MarkOp = { type: 'mark', id: makeId('op'), userId: user.id, propertyId: p.id, label, payload, guard, kind };
            update((prev) => [...prev, op]);
            sendMark(op);
        },
        addNote: (propertyId, text, label) => {
            const entry: NoteHistoryEntry = { field: 'employeeNote', text, user: user.email, at: new Date().toISOString(), action: 'created' };
            update((prev) => [...prev, { type: 'note', id: makeId('op'), userId: user.id, propertyId, label, entry }]);
            sendNotes();
        },
        pendingNotes: (propertyId) => mine.filter((o): o is NoteOp => o.type === 'note' && o.propertyId === propertyId).map((o) => o.entry),
        withPendingMarks: (property) =>
            mine
                .filter((pendingOp): pendingOp is MarkOp => pendingOp.type === 'mark' && pendingOp.propertyId === property.id)
                .reduce((view, pendingOp) => ({ ...view, ...pendingOp.payload }), property),
        pendingCount: mine.length,
    };

    return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
};

export const useOutbox = (): OutboxValue => {
    const context = useContext(OutboxContext);
    if (!context) throw new Error('useOutbox must be used inside <OutboxProvider>');
    return context;
};
