import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { subscribeMyPayroll } from '../services/payrollService';
import type { PayrollRecord } from '../types';
import { useCurrentUser } from './SessionContext';

interface PayrollValue {
  records: PayrollRecord[];
  loaded: boolean;
}

const PayrollContext = createContext<PayrollValue | null>(null);

export function PayrollProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const [res, setRes] = useState<{ uid: string; records: PayrollRecord[] } | null>(null);

  useEffect(() => subscribeMyPayroll(user.id, (records) => setRes({ uid: user.id, records })), [user.id]);

  const loaded = res?.uid === user.id;
  return <PayrollContext.Provider value={{ records: loaded ? res.records : [], loaded }}>{children}</PayrollContext.Provider>;
}

export function usePayroll(): PayrollValue {
  const ctx = useContext(PayrollContext);
  if (!ctx) throw new Error('usePayroll debe usarse dentro de <PayrollProvider>');
  return ctx;
}
