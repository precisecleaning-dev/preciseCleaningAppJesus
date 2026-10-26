import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useOnline } from '../context/NetworkContext';

export const useForegroundRetry = (retry: () => void, hasFailed: boolean) => {
    const isOnline = useOnline();
    const latestRetry = useRef(retry);
    const wasOnline = useRef(isOnline);

    useEffect(() => {
        latestRetry.current = retry;
    });

    useEffect(() => {
        const cameBackOnline = isOnline && !wasOnline.current;
        wasOnline.current = isOnline;
        if (hasFailed && cameBackOnline) latestRetry.current();
    }, [isOnline, hasFailed]);

    useEffect(() => {
        if (!hasFailed) return;
        const subscription = AppState.addEventListener('change', (appState) => {
            if (appState === 'active') latestRetry.current();
        });
        return () => subscription.remove();
    }, [hasFailed]);
};
