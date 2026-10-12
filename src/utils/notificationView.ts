import { Banknote, CalendarClock, CircleDollarSign, House, MapPinOff, MessageSquareText, Tag, type LucideIcon } from 'lucide-react-native';
import { fmt, texts } from '../constants/texts';
import type { AccentName } from '../theme/tokens';
import { formatDate, money } from './dateFormat';
import type { AppNotification, NotifKind } from './notificationDiff';

const META: Record<NotifKind, { icon: LucideIcon; accent: AccentName }> = {
  assigned: { icon: House, accent: 'brand' },
  removed: { icon: MapPinOff, accent: 'coral' },
  schedule: { icon: CalendarClock, accent: 'sky' },
  status: { icon: Tag, accent: 'violet' },
  note: { icon: MessageSquareText, accent: 'teal' },
  payroll: { icon: Banknote, accent: 'amber' },
  paid: { icon: CircleDollarSign, accent: 'mint' },
};

const when = (v?: string) => {
  if (!v) return '—';
  const [d, ...rest] = v.split(' ');
  const date = formatDate(d) || d;
  return [date, rest.join(' ')].filter(Boolean).join(' ');
};

export function notificationView(n: AppNotification) {
  const meta = META[n.kind];
  const vars = {
    client: n.client || texts.house,
    address: n.address || '',
    from: n.kind === 'schedule' ? when(n.from) : n.from || '—',
    to: n.kind === 'schedule' ? when(n.to) : n.to || '—',
    text: (n.text || '').length > 90 ? `${(n.text || '').slice(0, 90)}…` : n.text || '',
    amount: money(n.amount),
  };
  return {
    ...meta,
    title: texts[`n_${n.kind}`],
    body: fmt(texts[`n_${n.kind}_b`], vars),
  };
}

export function timeAgo(at: number, now = Date.now()): string {
  const min = Math.floor((now - at) / 60000);
  if (min < 1) return texts.justNow;
  if (min < 60) return fmt(texts.minAgo, { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return fmt(texts.hAgo, { n: h });
  return formatDate(at);
}
