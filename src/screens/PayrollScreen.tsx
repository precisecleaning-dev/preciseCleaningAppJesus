// src/screens/PayrollScreen.tsx
// ⭐ Payroll del empleado (solo lectura, en vivo desde la colección `payroll`).
//    · Encabezado con el saldo por cobrar que "cuenta" hasta su valor.
//    · Barras de las últimas 6 semanas: pagado (verde) y pendiente (ámbar).
//    · Registros agrupados por semana de PAGO (paymentDate → paidAt → date,
//      igual que la pestaña Nóminas de la web).
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { Banknote, CircleDollarSign, HandCoins, House, Minus, Plus, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionList, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import WeeklyBars, { type WeekBar } from '../components/WeeklyBars';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import StatusScrim from '../components/StatusScrim';
import AppText from '../components/ui/AppText';
import Chip from '../components/ui/Chip';
import EmptyState from '../components/ui/EmptyState';
import GradientHeader from '../components/ui/GradientHeader';
import IconBubble from '../components/ui/IconBubble';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import { db } from '../config/firebase';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { paymentTime, recordTotal, usePayroll } from '../context/PayrollContext';
import { fmt } from '../i18n/strings';
import { gradients, motion } from '../theme/tokens';
import type { PayrollRecord, Property } from '../types';
import { DAY_MS, formatDate, money, weekStartOf } from '../utils/dateFormat';
import { styles } from './PayrollScreen.styles';

const LOOKUP_CHUNK = 30; // máximo de valores por consulta 'in' en Firestore
const WEEKS = 6;

export default function PayrollScreen() {
  const { t } = useLanguage();
  const { getJob, clientName } = useJobs();
  const { records, loaded } = usePayroll();
  const [extraHouses, setExtraHouses] = useState<Record<string, Property | null>>({});
  const requested = useRef(new Set<string>());

  // Casas pagadas que ya no están en "Mis casas": se leen en lotes para mostrar la dirección.
  useEffect(() => {
    const missing = [...new Set(records.map((r) => r.propertyId).filter((id) => id && !getJob(id) && !requested.current.has(id)))];
    for (let i = 0; i < missing.length; i += LOOKUP_CHUNK) {
      const chunk = missing.slice(i, i + LOOKUP_CHUNK);
      chunk.forEach((id) => requested.current.add(id));
      getDocs(query(collection(db, 'properties'), where(documentId(), 'in', chunk)))
        .then((snap) =>
          setExtraHouses((prev) => {
            const next = { ...prev };
            chunk.forEach((id) => (next[id] = null));
            snap.docs.forEach((d) => (next[d.id] = { ...d.data(), id: d.id } as Property));
            return next;
          }),
        )
        .catch(() => chunk.forEach((id) => requested.current.delete(id)));
    }
  }, [records, getJob]);

  const { sections, totalPending, paidThisMonth, bars } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thisWeek = weekStartOf(now.getTime());
    let pending = 0;
    let paidMonth = 0;
    const byWeek = new Map<number, PayrollRecord[]>();
    records.forEach((r) => {
      const total = recordTotal(r);
      if (r.status === 'Paid') {
        if (paymentTime(r) >= monthStart) paidMonth += total;
      } else pending += total;
      const tp = paymentTime(r);
      const wk = tp ? weekStartOf(tp) : 0;
      byWeek.set(wk, [...(byWeek.get(wk) || []), r]);
    });
    const weekBars: WeekBar[] = Array.from({ length: WEEKS }, (_, i) => {
      const wk = weekStartOf(thisWeek - (WEEKS - 1 - i) * 7 * DAY_MS);
      const recs = byWeek.get(wk) || [];
      return {
        key: String(wk),
        label: formatDate(wk).slice(0, 5),
        paid: recs.filter((r) => r.status === 'Paid').reduce((s, r) => s + recordTotal(r), 0),
        pending: recs.filter((r) => r.status !== 'Paid').reduce((s, r) => s + recordTotal(r), 0),
      };
    });
    const secs = [...byWeek.entries()]
      .sort((a, b) => (b[0] || -Infinity) - (a[0] || -Infinity))
      .map(([wk, data]) => ({
        key: String(wk),
        title: wk ? fmt(t.week, { date: formatDate(wk) }) : t.noDate,
        total: data.reduce((s, r) => s + recordTotal(r), 0),
        data: data.sort((a, b) => paymentTime(b) - paymentTime(a)),
      }));
    return { sections: secs, totalPending: pending, paidThisMonth: paidMonth, bars: weekBars };
  }, [records, t]);

  const houseLabel = (r: PayrollRecord): string => {
    if (!r.propertyId) return r.extraNote || r.discountNote || t.adjustment;
    const h = getJob(r.propertyId) || extraHouses[r.propertyId];
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
            <AnimatedNumber value={totalPending} style={styles.balance} />
          </View>
          <View style={styles.monthTile}>
            <CircleDollarSign size={18} color="#FFFFFF" />
            <AppText variant="caption" tone="inverseMuted">
              {t.totalPaidMonth}
            </AppText>
            <AnimatedNumber value={paidThisMonth} style={styles.monthValue} />
          </View>
        </View>
      </GradientHeader>
      <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.chartCard}>
        <View style={styles.chartHead}>
          <AppText variant="title">{t.lastWeeks}</AppText>
          <View style={styles.legend}>
            <Chip label={t.paid} accent="mint" />
            <Chip label={t.pending} accent="amber" />
          </View>
        </View>
        <WeeklyBars bars={bars} />
      </Animated.View>
    </View>
  );

  if (!loaded) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.skeletons}>
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
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
          orbits={[{ icon: Banknote, accent: 'amber' }, { icon: HandCoins, accent: 'violet' }, { icon: CircleDollarSign, accent: 'sky' }]}
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
      renderItem={({ item: r, index }) => {
        const paid = r.status === 'Paid';
        return (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * motion.stagger).springify().damping(18)} style={styles.item}>
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
                {Number(r.extraAmount) > 0 && <Chip icon={Plus} accent="mint" label={`${t.extra} ${money(r.extraAmount)}${r.extraNote ? ` · ${r.extraNote}` : ''}`} />}
                {Number(r.discountAmount) > 0 && <Chip icon={Minus} accent="coral" label={`${t.discount} ${money(r.discountAmount)}${r.discountNote ? ` · ${r.discountNote}` : ''}`} />}
              </View>
            )}
          </Animated.View>
        );
      }}
    />
    </View>
  );
}
