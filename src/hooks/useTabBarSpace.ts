import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, tabBar } from '../theme/tokens';

export function useTabBarSpace(): number {
  const { bottom } = useSafeAreaInsets();
  return tabBar.itemHeight + tabBar.padding * 2 + Math.max(bottom, tabBar.minBottom) + space.lg;
}
