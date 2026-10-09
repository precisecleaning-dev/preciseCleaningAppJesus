import { arrayUnion, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { NoteHistoryEntry, Property, SystemUser } from '../types';
import { fullName } from '../utils/ids';

export type MarkKind = 'start' | 'undoStart' | 'finish' | 'undoFinish';
export type MarkPayload = Record<string, string | null>;

const propRef = (id: string) => doc(db, 'properties', id);

export function canUndoMark(byId: string | null | undefined, byName: string | null | undefined, user: SystemUser, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (byId) return byId === user.id;
  return !!byName && byName === fullName(user);
}

export function missingPhotoKinds(p: Property): ('Before' | 'After')[] {
  const missing: ('Before' | 'After')[] = [];
  if (!p.beforePhotos?.length) missing.push('Before');
  if (!p.afterPhotos?.length) missing.push('After');
  return missing;
}

export const markField = (kind: MarkKind) => (kind === 'start' || kind === 'undoStart' ? 'employeeStartedAt' : 'employeeFinishedAt');

export function markPayload(kind: MarkKind, user: SystemUser, at: string): MarkPayload {
  const prefix = markField(kind).replace(/At$/, '');
  const undo = kind === 'undoStart' || kind === 'undoFinish';
  return {
    [`${prefix}At`]: undo ? null : at,
    [`${prefix}By`]: undo ? null : fullName(user) || 'Unknown',
    [`${prefix}ById`]: undo ? null : user.id,
  };
}

export const MARK_LABEL: Record<MarkKind, string> = {
  start: 'Start Job',
  undoStart: 'Undo Start Job',
  finish: 'Mark Finished',
  undoFinish: 'Undo Mark Finished',
};

export const applyMark = (propertyId: string, payload: MarkPayload) => updateDoc(propRef(propertyId), payload);

export function applyEmployeeNote(propertyId: string, entry: NoteHistoryEntry): Promise<{ before: string; after: string } | null> {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(propRef(propertyId));
    if (!snap.exists()) throw Object.assign(new Error('La casa ya no existe'), { code: 'not-found' });
    const data = snap.data() as Partial<Property>;
    const dup = (data.notesHistory || []).some((e) => e.field === entry.field && e.at === entry.at && e.user === entry.user && e.text === entry.text);
    if (dup) return null;
    const before = String(data.employeeNote || '').trim();
    const after = before ? `${before}\n${entry.text}` : entry.text;
    tx.update(propRef(propertyId), { employeeNote: after, notesHistory: arrayUnion(entry) });
    return { before, after };
  });
}
