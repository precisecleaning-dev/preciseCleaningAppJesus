import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MINUTE = 60_000;

export function useNow(): Date {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, MINUTE);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  return new Date(now);
}
