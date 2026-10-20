import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const NetworkContext = createContext<boolean>(true);

const isOnlineState = (s: NetInfoState): boolean => s.isConnected !== false && s.isInternetReachable !== false;

export function NetworkProvider({ children }: { children: ReactNode }) {
    const [online, setOnline] = useState(true);
    useEffect(() => NetInfo.addEventListener((s) => setOnline(isOnlineState(s))), []);
    return <NetworkContext.Provider value={online}>{children}</NetworkContext.Provider>;
}

export const useOnline = (): boolean => useContext(NetworkContext);

export async function checkOnline(): Promise<boolean> {
    return isOnlineState(await NetInfo.fetch());
}
