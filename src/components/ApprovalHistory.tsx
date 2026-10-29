import { BadgeCheck, RotateCcw, Send, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { fmt, t } from '../constants/strings';
import type { AccentName } from '../theme/tokens';
import type { ApprovalEvent, ApprovalEventKind } from '../utils/approvalComments';
import { formatDateTime } from '../utils/dateFormat';
import { styles } from './ApprovalHistory.styles';
import AppText from './ui/AppText';
import IconBubble from './ui/IconBubble';

interface Props {
    events: ApprovalEvent[];
    currentUserId: string;
    /** The last change request is still waiting to be addressed. */
    hasOpenChangeRequest: boolean;
}

const EVENT_LOOK: Record<ApprovalEventKind, { icon: LucideIcon; accent: AccentName }> = {
    sent: { icon: Send, accent: 'amber' },
    changes: { icon: RotateCcw, accent: 'coral' },
    approved: { icon: BadgeCheck, accent: 'mint' },
};

const ApprovalHistory = ({ events, currentUserId, hasOpenChangeRequest }: Props) => {
    const nameOf = (event: ApprovalEvent) => (event.authorUserId === currentUserId ? t.approvalHistoryYou : event.authorName);

    const titleOf = (event: ApprovalEvent): string => {
        if (event.kind === 'sent') return fmt(t.approvalEventSent, { author: nameOf(event), approver: event.approverName });
        if (event.kind === 'changes') return fmt(t.approvalEventChanges, { author: nameOf(event) });
        return fmt(t.approvalEventApproved, { author: nameOf(event) });
    };

    return (
        <View style={styles.wrap}>
            <AppText variant="label">{t.approvalHistoryTitle}</AppText>
            <View>
                {events.map((event, index) => {
                    const isLast = index === events.length - 1;
                    const look = EVENT_LOOK[event.kind];
                    return (
                        <View key={event.key} style={styles.event}>
                            <View style={styles.rail}>
                                <IconBubble icon={look.icon} accent={look.accent} size="sm" />
                                {!isLast && <View style={styles.railLine} />}
                            </View>
                            <View style={styles.content}>
                                <AppText variant="body">{titleOf(event)}</AppText>
                                {!!event.at && (
                                    <AppText variant="caption" tone="muted">
                                        {formatDateTime(event.at)}
                                    </AppText>
                                )}
                                {event.kind === 'changes' && !!event.note && (
                                    <View style={[styles.noteBubble, isLast && hasOpenChangeRequest && styles.currentNote]}>
                                        <AppText variant="body">{event.note}</AppText>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default ApprovalHistory;
