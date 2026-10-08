// src/context/NetworkContext.tsx
// Estado de conexión compartido por las colas (fotos y cambios pendientes).
// "Online" = hay red Y hay internet (un Wi-Fi sin salida a internet no cuenta).
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const NetworkContext = createContext<boolean>(true);

export const isOnlineState = (s: NetInfoState): boolean => s.isConnected !== false && s.isInternetReachable !== false;

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) => setOnline(isOnlineState(s))), []);
  return <NetworkContext.Provider value={online}>{children}</NetworkContext.Provider>;
}

export const useOnline = (): boolean => useContext(NetworkContext);

export async function checkOnline(): Promise<boolean> {
  return isOnlineState(await NetInfo.fetch());
}
