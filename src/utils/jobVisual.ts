import { CircleCheckBig, CirclePlay, House, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { texts } from '../constants/texts';
import type { AccentName } from '../theme/tokens';
import type { Property } from '../types';
import { isOverdue, workStateOf } from './jobState';

export function jobVisual(p: Property): { accent: AccentName; icon: LucideIcon; label: string } {
  const state = workStateOf(p);
  if (state === 'finished') return { accent: 'mint', icon: CircleCheckBig, label: texts.finished };
  if (state === 'inProgress') return { accent: 'violet', icon: CirclePlay, label: texts.inProgress };
  if (isOverdue(p)) return { accent: 'coral', icon: TriangleAlert, label: texts.overdue };
  return { accent: 'sky', icon: House, label: texts.notStarted };
}
