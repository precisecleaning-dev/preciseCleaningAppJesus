// src/context/PayrollContext.tsx
// ⭐ Payroll del empleado en vivo (colección `payroll`, la misma de PayrollView
//    en la web), filtrado por employeeId en el servidor. Vive en un context
//    porque lo usan dos lugares: la pestaña Payroll y las notificaciones
//    ("se registró un pago", "te pagaron").
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../config/firebase';
import type { PayrollRecord } from '../types';
import { dateSortValue } from '../utils/dateFormat';
import { useCurrentUser } from './SessionContext';

interface PayrollValue {
  records: PayrollRecord[];
  loaded: boolean;
}

const PayrollContext = createContext<PayrollValue | null>(null);

/** Igual que getTotal() de PayrollView: muchos registros no guardan totalAmount. */
export const recordTotal = (r: PayrollRecord): number =>
  r.totalAmount != null && Number(r.totalAmount) !== 0
    ? Number(r.totalAmount)
    : Number(r.baseAmount || 0) + Number(r.extraAmount || 0) - Number(r.discountAmount || 0);

/** Fecha de PAGO con el mismo respaldo que la pestaña Nóminas: paymentDate → paidAt → date. */
export const paymentTime = (r: PayrollRecord): number =>
  dateSortValue(r.paymentDate) || dateSortValue(r.paidAt) || dateSortValue(r.date);

export function PayrollProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const [res, setRes] = useState<{ uid: string; records: PayrollRecord[] } | null>(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'payroll'), where('employeeId', '==', user.id)),
        (snap) => setRes({ uid: user.id, records: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as PayrollRecord) }),
        (err) => {
          console.error('Error cargando payroll:', err);
          setRes({ uid: user.id, records: [] });
        },
      ),
    [user.id],
  );

  const value = useMemo<PayrollValue>(() => {
    const loaded = res?.uid === user.id;
    return { records: loaded ? res.records : [], loaded };
  }, [res, user.id]);

  return <PayrollContext.Provider value={value}>{children}</PayrollContext.Provider>;
}

export function usePayroll(): PayrollValue {
  const ctx = useContext(PayrollContext);
  if (!ctx) throw new Error('usePayroll debe usarse dentro de <PayrollProvider>');
  return ctx;
}
