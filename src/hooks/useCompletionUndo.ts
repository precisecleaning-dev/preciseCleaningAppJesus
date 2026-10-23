import { useEffect, useState } from 'react';
import type { UserTask } from '../types/tasks';
import { useTaskWriteActions } from './useTaskWriteActions';

const UNDO_WINDOW_MS = 6000;

interface PendingUndo {
    task: UserTask;
    repeatTaskId: string | null;
    completedAt: number;
}

export const useCompletionUndo = () => {
    const { confirmCompletion, completeTask, reopenTask } = useTaskWriteActions();
    const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);

    useEffect(() => {
        if (!pendingUndo) return;
        const timer = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS);
        return () => clearTimeout(timer);
    }, [pendingUndo]);

    const markDone = (task: UserTask) =>
        confirmCompletion(task).then((isConfirmed) => {
            if (!isConfirmed) return;
            completeTask(task).then((result) => {
                if (result) setPendingUndo({ task, repeatTaskId: result.repeatTaskId, completedAt: Date.now() });
            });
        });

    const undo = () => {
        if (!pendingUndo) return;
        setPendingUndo(null);
        reopenTask(pendingUndo.task, pendingUndo.repeatTaskId);
    };

    return { pendingUndo, markDone, undo, dismissUndo: () => setPendingUndo(null) };
};
