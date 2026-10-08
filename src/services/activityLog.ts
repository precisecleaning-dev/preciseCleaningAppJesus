// src/services/activityLog.ts
// ⭐ Escribe en `activity_logs` con el MISMO formato que
//    src/services/activityLogService.ts de la web, así lo que hace el empleado
//    desde el teléfono aparece en la vista Activity Log del admin. El campo
//    `detail` lleva "(app móvil)" para distinguir el origen.
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SystemUser } from '../types';

export type LogAction = 'update' | 'photo_upload';

interface LogInput {
  action: LogAction;
  user: SystemUser | null;
  targetId: string;
  targetLabel: string;
  changes?: { field: string; before: string; after: string }[];
  detail?: string;
}

export async function logActivity(input: LogInput): Promise<void> {
  try {
    const name = input.user ? `${input.user.firstName} ${input.user.lastName}`.trim() : '';
    await addDoc(collection(db, 'activity_logs'), {
      at: new Date().toISOString(),
      ts: Timestamp.now(),
      userId: input.user?.id || '',
      userName: name || input.user?.id || 'Desconocido',
      action: input.action,
      module: 'Houses',
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      changes: input.changes || [],
      detail: [input.detail, '(app móvil)'].filter(Boolean).join(' '),
    });
  } catch (error) {
    // La bitácora nunca debe bloquear el trabajo del empleado.
    console.error('activity_logs: no se pudo registrar el evento', error);
  }
}
