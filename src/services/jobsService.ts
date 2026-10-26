import { arrayUnion, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { NoteHistoryEntry, Property, SystemUser } from '../types';
import { fullName } from '../utils/ids';
import { decideMark } from '../utils/markGuard';

export type MarkKind = 'start' | 'undoStart' | 'finish' | 'undoFinish';
export type MarkPayload = Record<string, string | null>;

const propertyReference = (propertyId: string) => doc(db, 'properties', propertyId);

const errorWithCode = (message: string, code: string) => Object.assign(new Error(message), { code });

export const MARK_CONFLICT_CODE = 'mark-conflict';

export type MarkField = 'employeeStartedAt' | 'employeeFinishedAt';

export interface MarkGuard {
    field: MarkField;
    expected: string | null;
}

export const canUndoMark = (byId: string | null | undefined, byName: string | null | undefined, user: SystemUser, canUndoOthersMarks: boolean): boolean => {
    if (canUndoOthersMarks) return true;
    if (byId) return byId === user.id;
    return !!byName && byName === fullName(user);
};

export const missingPhotoKinds = (property: Property): ('Before' | 'After')[] => {
    const missing: ('Before' | 'After')[] = [];
    if (!property.beforePhotos?.length) missing.push('Before');
    if (!property.afterPhotos?.length) missing.push('After');
    return missing;
};

export const markField = (kind: MarkKind): MarkField => (kind === 'start' || kind === 'undoStart' ? 'employeeStartedAt' : 'employeeFinishedAt');

export const markPayload = (kind: MarkKind, user: SystemUser, at: string): MarkPayload => {
    const prefix = markField(kind).replace(/At$/, '');
    const isUndo = kind === 'undoStart' || kind === 'undoFinish';
    return {
        [`${prefix}At`]: isUndo ? null : at,
        [`${prefix}By`]: isUndo ? null : fullName(user) || 'Unknown',
        [`${prefix}ById`]: isUndo ? null : user.id,
    };
};

export const MARK_LABEL: Record<MarkKind, string> = {
    start: 'Start Job',
    undoStart: 'Undo Start Job',
    finish: 'Mark Finished',
    undoFinish: 'Undo Mark Finished',
};

export type MarkOutcome = 'applied' | 'alreadyApplied';

export const applyMark = (propertyId: string, payload: MarkPayload, guard?: MarkGuard): Promise<MarkOutcome> => {
    if (!guard) return updateDoc(propertyReference(propertyId), payload).then((): MarkOutcome => 'applied');
    return runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(propertyReference(propertyId));
        if (!snapshot.exists()) throw errorWithCode('The house no longer exists', 'not-found');
        const decision = decideMark({
            isFinishMark: guard.field === 'employeeFinishedAt',
            currentValue: snapshot.get(guard.field) ?? null,
            desiredValue: payload[guard.field] ?? null,
            expectedValue: guard.expected,
            hasStart: !!snapshot.get('employeeStartedAt'),
        });
        if (decision === 'alreadyApplied') return 'alreadyApplied';
        if (decision === 'conflict') throw errorWithCode('The house changed before this mark was sent', MARK_CONFLICT_CODE);
        transaction.update(propertyReference(propertyId), payload);
        return 'applied';
    });
};

export const applyEmployeeNote = (propertyId: string, entry: NoteHistoryEntry): Promise<{ before: string; after: string } | null> =>
    runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(propertyReference(propertyId));
        if (!snapshot.exists()) throw errorWithCode('The house no longer exists', 'not-found');
        const data = snapshot.data() as Partial<Property>;
        const isDuplicate = (data.notesHistory || []).some(
            (existing) => existing.field === entry.field && existing.at === entry.at && existing.user === entry.user && existing.text === entry.text,
        );
        if (isDuplicate) return null;
        const before = String(data.employeeNote || '').trim();
        const after = before ? `${before}\n${entry.text}` : entry.text;
        transaction.update(propertyReference(propertyId), { employeeNote: after, notesHistory: arrayUnion(entry) });
        return { before, after };
    });
