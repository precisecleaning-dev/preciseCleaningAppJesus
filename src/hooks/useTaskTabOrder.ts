import { useState } from 'react';
import { loadTaskListTabOrder } from '../services/tasksService';
import { normalizeTabOrder, type OpenTaskTabId } from '../utils/taskTabs';
import { useWhenOnline } from './useWhenOnline';

export const useTaskTabOrder = (): OpenTaskTabId[] => {
    const [storedOrder, setStoredOrder] = useState<unknown>(null);

    useWhenOnline(() => {
        loadTaskListTabOrder()
            .then(setStoredOrder)
            .catch((error: unknown) => console.error('Error loading task_list_tabs:', error));
    }, true);

    return normalizeTabOrder(storedOrder);
};
