import { Banknote, CircleDollarSign, HandCoins, House, Minus, Plus, RefreshCw, TriangleAlert, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { SectionList, View } from 'react-native';
import WeeklyBars, { type WeekBar } from '../components/WeeklyBars';
import StatusScrim from '../components/StatusScrim';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import GradientHeader from '../components/ui/GradientHeader';
import IconBubble from '../components/ui/IconBubble';
import { CardSkeletonList } from '../components/ui/Skeleton';
import { useJobs } from '../context/JobsContext';
import { useOnline } from '../context/NetworkContext';
import { usePayroll } from '../context/PayrollContext';
import { useNow } from '../hooks/useNow';
import { getPropertiesByIds } from '../services/propertiesService';
import { paymentTime, recordTotal } from '../services/payrollService';
import { colors, gradients } from '../theme/tokens';
import type { PayrollRecord, Property } from '../types';
import { DAY_MS, formatDate, money, weekStartOf } from '../utils/dateFormat';
import { styles } from './PayrollScreen.styles';
import { fmt, t } from '../constants/strings';

const WEEKS = 6;

const sumOf = (list: PayrollRecord[]) => list.reduce((sum, r) => sum + recordTotal(r), 0);

function summarize(records: PayrollRecord[], now: Date) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisWeek = weekStartOf(now.getTime());
    let pending = 0;
    let paidMonth = 0;
    const byWeek = new Map<number, PayrollRecord[]>();
    records.forEach((r) => {
        const total = recordTotal(r);
        const tp = paymentTime(r);
        if (r.status !== 'Paid') pending += total;
        else if (tp >= monthStart) paidMonth += total;
        const wk = tp ? weekStartOf(tp) : 0;
        byWeek.set(wk, [...(byWeek.get(wk) || []), r]);
    });
    const weekBars: WeekBar[] = Array.from({ length: WEEKS }, (_, i) => {
        const wk = weekStartOf(thisWeek - (WEEKS - 1 - i) * 7 * DAY_MS);
        const recs = byWeek.get(wk) || [];
        return {
            key: String(wk),
            label: formatDate(wk).slice(0, 5),
            paid: sumOf(recs.filter((r) => r.status === 'Paid')),
            pending: sumOf(recs.filter((r) => r.status !== 'Paid')),
        };
    });
    const secs = [...byWeek.entries()]
        .sort((a, b) => (b[0] || -Infinity) - (a[0] || -Infinity))
        .map(([wk, data]) => ({
            key: String(wk),
            title: wk ? fmt(t.week, { date: formatDate(wk) }) : t.noDate,
            total: sumOf(data),
            data: data.sort((a, b) => paymentTime(b) - paymentTime(a)),
        }));
    return { sections: secs, totalPending: pending, paidThisMonth: paidMonth, bars: weekBars };
}

export default function PayrollScreen() {
    const { getJob, clientName, requestClients } = useJobs();
    const { records, loaded, hasFailed, retry } = usePayroll();
    const online = useOnline();
    const [otherHouses, setOtherHouses] = useState<{ key: string; list: Property[] } | null>(null);

    const missingKey = [...new Set(records.map((r) => r.propertyId).filter((id) => id && !getJob(id)))].sort().join('|');
    useEffect(() => {
        if (!missingKey || !online) return;
        let cancelled = false;
        getPropertiesByIds(missingKey.split('|'))
            .then((list) => {
                if (!cancelled) setOtherHouses({ key: missingKey, list });
            })
            .catch((err) => console.error('Error cargando casas del payroll:', err));
        return () => {
            cancelled = true;
        };
    }, [missingKey, online]);

    const others = otherHouses?.list ?? [];
    const otherHousesById = new Map(others.map((house) => [house.id, house]));
    const otherClients = others.map((h) => h.client).join('|');
    useEffect(() => {
        requestClients(otherClients.split('|'));
    }, [otherClients, requestClients]);

    const now = useNow();
    const { sections, totalPending, paidThisMonth, bars } = summarize(records, now);

    const houseLabel = (r: PayrollRecord): string => {
        if (!r.propertyId) return r.extraNote || r.discountNote || t.adjustment;
        const h = getJob(r.propertyId) ?? otherHousesById.get(r.propertyId);
        if (!h) return t.house;
        return h.address ? `${h.address} · ${clientName(h)}` : clientName(h);
    };

    const header = (
        <View>
            <GradientHeader overlap={60}>
                <AppText variant="h1" tone="inverse">
                    {t.payrollTitle}
                </AppText>
                <View style={styles.balanceRow}>
                    <View style={styles.flex}>
                        <AppText variant="label" tone="inverseMuted">
                            {t.totalPending}
                        </AppText>
                        <AppText style={styles.balance}>{money(totalPending)}</AppText>
                    </View>
                    <View style={styles.monthTile}>
                        <CircleDollarSign size={18} color={colors.white} />
                        <AppText variant="caption" tone="inverseMuted">
                            {t.totalPaidMonth}
                        </AppText>
                        <AppText style={styles.monthValue}>{money(paidThisMonth)}</AppText>
                    </View>
                </View>
            </GradientHeader>
            <View style={styles.chartCard}>
                <View style={styles.chartHead}>
                    <AppText variant="title">{t.lastWeeks}</AppText>
                    <View style={styles.legend}>
                        <Chip label={t.paid} accent="mint" />
                        <Chip label={t.pending} accent="amber" />
                    </View>
                </View>
                <WeeklyBars bars={bars} />
            </View>
        </View>
    );

    if (hasFailed) {
        return (
            <View style={styles.screen}>
                {header}
                <View style={styles.errorState}>
                    <EmptyState
                        icon={TriangleAlert}
                        gradient={gradients.amber}
                        orbits={[
                            { icon: Banknote, accent: 'amber' },
                            { icon: HandCoins, accent: 'violet' },
                            { icon: CircleDollarSign, accent: 'sky' },
                        ]}
                        title={t.payrollErrorTitle}
                        body={t.payrollErrorBody}
                    />
                    <Button variant="soft" label={t.tryAgain} onPress={retry} icon={<RefreshCw size={18} color={colors.primaryDark} />} />
                </View>
            </View>
        );
    }

    if (!loaded) {
        return (
            <View style={styles.screen}>
                {header}
                <CardSkeletonList count={2} style={styles.skeletons} />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusScrim />
            <SectionList
                style={styles.screen}
                contentContainerStyle={styles.list}
                sections={sections}
                keyExtractor={(r) => r.id}
                stickySectionHeadersEnabled={false}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    <EmptyState
                        icon={Wallet}
                        gradient={gradients.mint}
                        orbits={[
                            { icon: Banknote, accent: 'amber' },
                            { icon: HandCoins, accent: 'violet' },
                            { icon: CircleDollarSign, accent: 'sky' },
                        ]}
                        title={t.noPayrollTitle}
                        body={t.noPayrollBody}
                    />
                }
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <AppText variant="label" tone="muted">
                            {section.title}
                        </AppText>
                        <AppText variant="bodyStrong">{money(section.total)}</AppText>
                    </View>
                )}
                renderItem={({ item: r }) => {
                    const paid = r.status === 'Paid';
                    return (
                        <View style={styles.item}>
                            <View style={styles.row}>
                                <IconBubble icon={r.propertyId ? House : HandCoins} accent={paid ? 'mint' : 'amber'} />
                                <View style={styles.flex}>
                                    <AppText variant="bodyStrong" numberOfLines={2}>
                                        {houseLabel(r)}
                                    </AppText>
                                    <AppText variant="caption" tone="muted">
                                        {paid && (r.paidAt || r.paymentDate) ? fmt(t.paidOn, { date: formatDate(r.paidAt || r.paymentDate) }) : formatDate(r.date)}
                                    </AppText>
                                </View>
                                <View style={styles.amountCol}>
                                    <AppText variant="h2">{money(recordTotal(r))}</AppText>
                                    <Chip label={paid ? t.paid : t.pending} accent={paid ? 'mint' : 'amber'} solid={paid} />
                                </View>
                            </View>
                            {(Number(r.extraAmount) > 0 || Number(r.discountAmount) > 0) && (
                                <View style={styles.adjustments}>
                                    {Number(r.extraAmount) > 0 && (
                                        <Chip icon={Plus} accent="mint" label={`${t.extra} ${money(r.extraAmount)}${r.extraNote ? ` · ${r.extraNote}` : ''}`} />
                                    )}
                                    {Number(r.discountAmount) > 0 && (
                                        <Chip icon={Minus} accent="coral" label={`${t.discount} ${money(r.discountAmount)}${r.discountNote ? ` · ${r.discountNote}` : ''}`} />
                                    )}
                                </View>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
}
