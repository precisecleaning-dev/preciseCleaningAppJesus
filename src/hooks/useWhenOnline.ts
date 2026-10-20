import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useOnline } from '../context/NetworkContext';

export function useWhenOnline(run: () => void, enabled: boolean) {
    const online = useOnline();
    const latest = useRef(run);
    useEffect(() => {
        latest.current = run;
    });
    useEffect(() => {
        if (enabled && online) latest.current();
    }, [enabled, online]);
    useEffect(() => {
        const sub = AppState.addEventListener('change', (s) => {
            if (s === 'active' && enabled) latest.current();
        });
        return () => sub.remove();
    }, [enabled]);
}
