// src/navigation/RootNavigator.tsx
// Flujo: (primera vez) Bienvenida → Login → app.
// Con sesión lista: pila raíz con las pestañas (Inicio · Payroll · Perfil) y,
// encima, el detalle de casa y las notificaciones. Encabezados propios.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, User, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import NotificationToast from '../components/NotificationToast';
import OfflineBanner from '../components/OfflineBanner';
import TabBar from '../components/ui/TabBar';
import { CatalogsProvider } from '../context/CatalogsContext';
import { JobsProvider } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { NetworkProvider } from '../context/NetworkContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { OutboxProvider } from '../context/OutboxContext';
import { PayrollProvider } from '../context/PayrollContext';
import { PhotoQueueProvider } from '../context/PhotoQueueContext';
import { useSession } from '../context/SessionContext';
import BlockedScreen from '../screens/BlockedScreen';
import HomeScreen from '../screens/HomeScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PayrollScreen from '../screens/PayrollScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/tokens';
import { navigationRef } from './navigationRef';
import type { RootStackParams, TabParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();
const ONBOARDED_KEY = 'pc_crew_onboarded_v1';

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border },
};

const TAB_ICONS = { Home: House, Payroll: Wallet, Profile: User };

function MainTabs() {
  const { t } = useLanguage();
  const labels = { Home: t.tabHome, Payroll: t.tabPayroll, Profile: t.tabProfile };
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} icons={TAB_ICONS} labels={labels} />}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Payroll" component={PayrollScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

/** ¿Ya vio la bienvenida en este teléfono? null = todavía leyendo. */
export function useOnboarded(): [boolean | null, () => void] {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setDone(v === '1'))
      .catch(() => setDone(true));
  }, []);
  const finish = useCallback(() => {
    setDone(true);
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => undefined);
  }, []);
  return [done, finish];
}

export default function RootNavigator({ onboarded, finishOnboarding }: { onboarded: boolean | null; finishOnboarding: () => void }) {
  const { state } = useSession();

  // En el arranque la animación de apertura cubre esta espera; después de iniciar sesión se ve LoadingScreen.
  if (state === 'checking' || state === 'loadingProfile' || onboarded === null) return <LoadingScreen />;
  if (state === 'signedOut') return onboarded ? <LoginScreen /> : <OnboardingScreen onFinish={finishOnboarding} />;
  if (state === 'noProfile' || state === 'inactive') return <BlockedScreen reason={state} />;

  return (
    <NetworkProvider>
      <CatalogsProvider>
        <JobsProvider>
          <PayrollProvider>
            <NotificationsProvider>
              <OutboxProvider>
                <PhotoQueueProvider>
                  <NavigationContainer theme={theme} ref={navigationRef}>
                    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
                      <Stack.Screen name="Tabs" component={MainTabs} />
                      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
                      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_bottom' }} />
                    </Stack.Navigator>
                  </NavigationContainer>
                  <OfflineBanner />
                  <NotificationToast />
                </PhotoQueueProvider>
              </OutboxProvider>
            </NotificationsProvider>
          </PayrollProvider>
        </JobsProvider>
      </CatalogsProvider>
    </NetworkProvider>
  );
}
