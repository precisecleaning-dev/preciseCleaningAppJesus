import { Alert } from 'react-native';
import { t } from '../constants/strings';
import { useOnline } from '../context/NetworkContext';

export const useGuardedWrite = (offlineMessage: string = t.taskOfflineWrite) => {
    const isOnline = useOnline();

    const warnIfOffline = (): boolean => {
        if (isOnline) return false;
        Alert.alert(t.tasksOfflineTitle, offlineMessage);
        return true;
    };

    const runWrite = <Result>(write: () => Promise<Result>, errorMessageOf: (error: unknown) => string): Promise<Result | null> => {
        if (warnIfOffline()) return Promise.resolve(null);
        return write().catch((error: unknown) => {
            console.error('Write failed:', error);
            Alert.alert(t.error, errorMessageOf(error));
            return null;
        });
    };

    return { warnIfOffline, runWrite };
};
