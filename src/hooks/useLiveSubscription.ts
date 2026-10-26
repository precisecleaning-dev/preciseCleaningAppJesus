import { useEffect, useRef, useState } from 'react';
import { useOnline } from '../context/NetworkContext';
import type { LoadStatus } from '../types';
import { useForegroundRetry } from './useForegroundRetry';

type Unsubscribe = () => void;

interface LiveSubscriptionOptions<Value> {
    key: string;
    isEnabled: boolean;
    subscribe: (onData: (value: Value, isFromCache: boolean) => void, onError: (error: unknown) => void) => Unsubscribe;
    isEmpty?: (value: Value) => boolean;
    description: string;
}

interface LiveSubscription<Value> {
    status: LoadStatus;
    value: Value | null;
    hasFailed: boolean;
    retry: () => void;
}

interface LatestValue<Value> {
    key: string;
    value: Value;
    isFromCache: boolean;
}

export const useLiveSubscription = <Value>({ key, isEnabled, subscribe, isEmpty, description }: LiveSubscriptionOptions<Value>): LiveSubscription<Value> => {
    const isOnline = useOnline();
    const latestSubscribe = useRef(subscribe);
    const [attempt, setAttempt] = useState(0);
    const [latest, setLatest] = useState<LatestValue<Value> | null>(null);
    const [failedSubscriptionId, setFailedSubscriptionId] = useState<string | null>(null);
    const subscriptionId = `${key}#${attempt}`;

    useEffect(() => {
        latestSubscribe.current = subscribe;
    });

    useEffect(() => {
        if (!isEnabled) return;
        const currentSubscriptionId = `${key}#${attempt}`;
        return latestSubscribe.current(
            (value, isFromCache) => setLatest({ key, value, isFromCache }),
            (error) => {
                console.error(`Error loading ${description}:`, error);
                setFailedSubscriptionId(currentSubscriptionId);
            },
        );
    }, [key, isEnabled, attempt, description]);

    const hasFailed = isEnabled && failedSubscriptionId === subscriptionId;
    const retry = () => setAttempt((current) => current + 1);
    useForegroundRetry(retry, hasFailed);

    const current = latest?.key === key ? latest : null;
    const isOfflineAndEmpty = !isOnline && (current === null || (current.isFromCache && !!isEmpty?.(current.value)));

    let status: LoadStatus = 'ready';
    if (hasFailed) status = isOnline ? 'error' : 'offline';
    else if (isOfflineAndEmpty) status = 'offline';
    else if (current === null) status = 'loading';

    return { status, value: current?.value ?? null, hasFailed, retry };
};
