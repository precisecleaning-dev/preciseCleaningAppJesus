import { createContext, useContext, type ReactNode } from 'react';
import { useLiveSubscription } from '../hooks/useLiveSubscription';
import { subscribeMyPayroll } from '../services/payrollService';
import type { PayrollRecord } from '../types';
import { useCurrentUser, useSession } from './SessionContext';

interface PayrollValue {
    records: PayrollRecord[];
    loaded: boolean;
    hasFailed: boolean;
    retry: () => void;
}

interface PayrollProviderProps {
    children: ReactNode;
}

const PayrollContext = createContext<PayrollValue | null>(null);

export const PayrollProvider = ({ children }: PayrollProviderProps) => {
    const user = useCurrentUser();
    const { canViewPayroll } = useSession();
    const { status, value, hasFailed, retry } = useLiveSubscription<PayrollRecord[]>({
        key: `payroll:${user.id}`,
        isEnabled: canViewPayroll,
        subscribe: (onData, onError) => subscribeMyPayroll(user.id, (records) => onData(records, false), onError),
        description: 'payroll',
    });

    const isLoaded = !canViewPayroll || status === 'ready';
    const records = canViewPayroll && isLoaded ? (value ?? []) : [];
    return <PayrollContext.Provider value={{ records, loaded: isLoaded, hasFailed, retry }}>{children}</PayrollContext.Provider>;
};

export const usePayroll = (): PayrollValue => {
    const context = useContext(PayrollContext);
    if (!context) throw new Error('usePayroll must be used inside <PayrollProvider>');
    return context;
};
