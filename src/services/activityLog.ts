import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SystemUser } from '../types';
import { fullName } from '../utils/ids';

interface LogInput {
  action: 'update' | 'photo_upload';
  user: SystemUser;
  targetId: string;
  targetLabel: string;
  changes?: { field: string; before: string; after: string }[];
  detail?: string;
}

export async function logActivity(input: LogInput): Promise<void> {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      at: new Date().toISOString(),
      ts: Timestamp.now(),
      userId: input.user.id,
      userName: fullName(input.user) || input.user.id,
      action: input.action,
      module: 'Houses',
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      changes: input.changes || [],
      detail: [input.detail, '(app móvil)'].filter(Boolean).join(' '),
    });
  } catch (error) {
    console.error('activity_logs: no se pudo registrar el evento', error);
  }
}
