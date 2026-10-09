import { CircleCheckBig, CirclePlay, House, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import type { Strings } from '../i18n/strings';
import type { AccentName } from '../theme/tokens';
import type { Property } from '../types';
import { isOverdue, workStateOf } from './jobState';

export function jobVisual(p: Property, t: Strings): { accent: AccentName; icon: LucideIcon; label: string } {
  const state = workStateOf(p);
  if (state === 'finished') return { accent: 'mint', icon: CircleCheckBig, label: t.finished };
  if (state === 'inProgress') return { accent: 'violet', icon: CirclePlay, label: t.inProgress };
  if (isOverdue(p)) return { accent: 'coral', icon: TriangleAlert, label: t.overdue };
  return { accent: 'sky', icon: House, label: t.notStarted };
}
