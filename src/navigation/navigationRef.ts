// Referencia global a la navegación: permite abrir una casa desde una
// notificación o un aviso flotante, fuera de cualquier pantalla.
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParams } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParams>();

export function openJob(jobId: string) {
  if (navigationRef.isReady()) navigationRef.navigate('JobDetail', { jobId });
}
