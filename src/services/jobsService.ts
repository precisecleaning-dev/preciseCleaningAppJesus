// src/services/jobsService.ts
// ⭐ Reglas y escrituras del empleado sobre una casa. Escriben EXACTAMENTE los
//    mismos campos que handleStartJob / handleMarkAsFinished / handleSendNote de
//    HousesView.tsx en la web, así el admin ve el Work Log y las notas sin
//    cambiar nada en la web. Las pantallas no llaman esto directo: pasan por la
//    cola de cambios (OutboxContext), que lo reintenta si no hay señal.
import { arrayUnion, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { NoteHistoryEntry, Property, SystemUser } from '../types';

export type MarkKind = 'start' | 'undoStart' | 'finish' | 'undoFinish';

export const fullName = (u: SystemUser) => `${u.firstName} ${u.lastName}`.trim() || 'Unknown';
const propRef = (id: string) => doc(db, 'properties', id);

/** ¿Puede `user` deshacer una marca? Solo quien la hizo, o un admin (regla de la web). */
export function canUndoMark(byId: string | null | undefined, byName: string | null | undefined, user: SystemUser, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  if (byId) return byId === user.id;
  return !!byName && byName === fullName(user);
}

/** Fotos que faltan para poder finalizar (la web bloquea Finish sin Before y After). */
export function missingPhotoKinds(p: Property): ('Before' | 'After')[] {
  const missing: ('Before' | 'After')[] = [];
  if (!p.beforePhotos?.length) missing.push('Before');
  if (!p.afterPhotos?.length) missing.push('After');
  return missing;
}

export type MarkPayload = Record<string, string | null>;

/** Campos que escribe cada marca (mismo payload que la web). */
export function markPayload(kind: MarkKind, user: SystemUser, at: string): MarkPayload {
  switch (kind) {
    case 'start':
      return { employeeStartedAt: at, employeeStartedBy: fullName(user), employeeStartedById: user.id };
    case 'undoStart':
      return { employeeStartedAt: null, employeeStartedBy: null, employeeStartedById: null };
    case 'finish':
      return { employeeFinishedAt: at, employeeFinishedBy: fullName(user), employeeFinishedById: user.id };
    case 'undoFinish':
      return { employeeFinishedAt: null, employeeFinishedBy: null, employeeFinishedById: null };
  }
}

export const MARK_LABEL: Record<MarkKind, string> = {
  start: 'Start Job',
  undoStart: 'Undo Start Job',
  finish: 'Mark Finished',
  undoFinish: 'Undo Mark Finished',
};

export function applyMark(propertyId: string, payload: MarkPayload): Promise<void> {
  return updateDoc(propRef(propertyId), payload);
}

/**
 * Agrega una nota al hilo `employeeNote` (formato de NoteThread en la web: el
 * texto se concatena y cada mensaje queda en `notesHistory`).
 * En TRANSACCIÓN e IDEMPOTENTE: relee el valor actual (no pisa lo que otro
 * escribió) y, si ese mismo mensaje ya está en el historial —porque un intento
 * anterior sí llegó—, no lo agrega dos veces.
 * Devuelve el texto antes/después para la bitácora, o null si ya existía.
 */
export async function applyEmployeeNote(propertyId: string, entry: NoteHistoryEntry): Promise<{ before: string; after: string } | null> {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(propRef(propertyId));
    if (!snap.exists()) throw Object.assign(new Error('La casa ya no existe'), { code: 'not-found' });
    const data = snap.data() as Partial<Property>;
    const dup = (data.notesHistory || []).some(
      (e) => e.field === entry.field && e.at === entry.at && e.user === entry.user && e.text === entry.text,
    );
    if (dup) return null;
    const before = String(data.employeeNote || '').trim();
    const after = before ? `${before}\n${entry.text}` : entry.text;
    tx.update(propRef(propertyId), { employeeNote: after, notesHistory: arrayUnion(entry) });
    return { before, after };
  });
}
