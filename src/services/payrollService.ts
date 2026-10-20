import { query, where } from 'firebase/firestore';
import type { PayrollRecord } from '../types';
import { dateSortValue } from '../utils/dateFormat';
import { listen, typedCollection } from './firestore';

export const subscribeMyPayroll = (employeeId: string, onData: (r: PayrollRecord[]) => void) =>
    listen(query(typedCollection<PayrollRecord>('payroll'), where('employeeId', '==', employeeId)), onData, 'payroll');

export const recordTotal = (r: PayrollRecord): number =>
    r.totalAmount != null && Number(r.totalAmount) !== 0 ? Number(r.totalAmount) : Number(r.baseAmount || 0) + Number(r.extraAmount || 0) - Number(r.discountAmount || 0);

export const paymentTime = (r: PayrollRecord): number => dateSortValue(r.paymentDate) || dateSortValue(r.paidAt) || dateSortValue(r.date);
