// src/screens/PayrollScreen.tsx
// ⭐ Payroll del empleado: lee la colección `payroll` (la misma que PayrollView
//    en la web) filtrada por employeeId en el servidor — cada empleado ve solo
//    lo suyo, igual que el alcance 'Own' de la web. En vivo: cuando la oficina
//    registra un pago o marca Paid, se actualiza aquí al instante.
//    Agrupado por semana (lunes) de la fecha de PAGO, con el mismo orden de
//    respaldo que la pestaña Nóminas de la web: paymentDate → paidAt → date.
//    Así el bonus/descuento de un pago queda en la misma semana que sus casas.
import { collection, documentId, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, Text, View } from 'react-native';
import StatusPill from '../components/StatusPill';
import { ui } from '../components/ui.styles';
import { db } from '../config/firebase';
import { useJobs } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../context/SessionContext';
import { colors } from '../theme/tokens';
import type { PayrollRecord, Property } from '../types';
import { dateSortValue, formatDate, money, weekStartOf } from '../utils/dateFormat';
import { styles } from './PayrollScreen.styles';

/** Igual que getTotal() de PayrollView: muchos registros no guardan totalAmount. */
const recordTotal = (r: PayrollRecord): number =>
  r.totalAmount != null && Number(r.totalAmount) !== 0
    ? Number(r.totalAmount)
    : Number(r.baseAmount || 0) + Number(r.extraAmount || 0) - Number(r.discountAmount || 0);

const paymentTime = (r: PayrollRecord): number =>
  dateSortValue(r.paymentDate) || dateSortValue(r.paidAt) || dateSortValue(r.date);

const LOOKUP_CHUNK = 30; // máximo de valores por consulta 'in' en Firestore

export default function PayrollScreen() {
  const { t } = useLanguage();
  const user = useCurrentUser();
  const { getJob, clientName } = useJobs();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [extraHouses, setExtraHouses] = useState<Record<string, Property | null>>({});
  const requested = useRef(new Set<string>());

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'payroll'), where('employeeId', '==', user.id)),
        (snap) => {
          setRecords(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as PayrollRecord));
          setLoaded(true);
        },
        (err) => {
          console.error('Error cargando payroll:', err);
          setLoaded(true);
        },
      ),
    [user.id],
  );

  // Casas pagadas que ya no están en "Mis casas" (otro equipo, reasignadas…):
  // se leen en lotes de 30 para mostrar su dirección. Si falla (sin señal), se
  // libera el pedido para reintentar en el próximo cambio.
  useEffect(() => {
    const missing = [
      ...new Set(records.map((r) => r.propertyId).filter((id) => id && !getJob(id) && !requested.current.has(id))),
    ];
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

  const { sections, totalPending, paidThisMonth } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let pending = 0;
    let paidMonth = 0;
    const byWeek = new Map<number, PayrollRecord[]>();
    records.forEach((r) => {
      const total = recordTotal(r);
      if (r.status === 'Paid') {
        if (paymentTime(r) >= monthStart) paidMonth += total;
      } else {
        pending += total;
      }
      const tp = paymentTime(r);
      const wk = tp ? weekStartOf(tp) : 0;
      byWeek.set(wk, [...(byWeek.get(wk) || []), r]);
    });
    const secs = [...byWeek.entries()]
      // Semanas más recientes arriba; los registros sin fecha al final.
      .sort((a, b) => (b[0] || -Infinity) - (a[0] || -Infinity))
      .map(([wk, data]) => ({
        key: String(wk),
        title: wk ? `${t.week} ${formatDate(wk)}` : t.noDate,
        total: data.reduce((s, r) => s + recordTotal(r), 0),
        data: data.sort((a, b) => paymentTime(b) - paymentTime(a)),
      }));
    return { sections: secs, totalPending: pending, paidThisMonth: paidMonth };
  }, [records, t]);

  const houseLabel = (r: PayrollRecord): string => {
    if (!r.propertyId) return r.extraNote || r.discountNote || '—';
    const h = getJob(r.propertyId) || extraHouses[r.propertyId];
    if (!h) return t.house;
    return h.address ? `${h.address} · ${clientName(h)}` : clientName(h);
  };

  if (!loaded) {
    return (
      <View style={ui.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SectionList
      style={ui.screen}
      contentContainerStyle={ui.listContent}
      sections={sections}
      keyExtractor={(r) => r.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.summary}>
          <View style={[ui.card, styles.summaryCard]}>
            <Text style={ui.muted}>{t.totalPending}</Text>
            <Text style={[styles.summaryValue, styles.pendingValue]}>{money(totalPending)}</Text>
          </View>
          <View style={[ui.card, styles.summaryCard]}>
            <Text style={ui.muted}>{t.totalPaidMonth}</Text>
            <Text style={[styles.summaryValue, styles.paidValue]}>{money(paidThisMonth)}</Text>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={ui.empty}>{t.noPayroll}</Text>}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionTotal}>{money(section.total)}</Text>
        </View>
      )}
      renderItem={({ item: r }) => (
        <View style={[ui.card, styles.item]}>
          <View style={styles.itemTop}>
            <Text style={styles.house} numberOfLines={2}>
              {houseLabel(r)}
            </Text>
            <Text style={styles.amount}>{money(recordTotal(r))}</Text>
          </View>
          <View style={styles.itemBottom}>
            <Text style={ui.muted}>{formatDate(r.date)}</Text>
            <StatusPill label={r.status === 'Paid' ? t.paid : t.pending} tone={r.status === 'Paid' ? 'done' : 'warning'} />
          </View>
          {Number(r.extraAmount) > 0 && (
            <Text style={styles.extra}>
              + {t.extra} {money(r.extraAmount)}
              {r.extraNote ? ` · ${r.extraNote}` : ''}
            </Text>
          )}
          {Number(r.discountAmount) > 0 && (
            <Text style={styles.discount}>
              − {t.discount} {money(r.discountAmount)}
              {r.discountNote ? ` · ${r.discountNote}` : ''}
            </Text>
          )}
          {r.status === 'Paid' && (r.paidAt || r.paymentDate) && (
            <Text style={ui.muted}>
              {t.paidOn} {formatDate(r.paidAt || r.paymentDate)}
            </Text>
          )}
        </View>
      )}
    />
  );
}
