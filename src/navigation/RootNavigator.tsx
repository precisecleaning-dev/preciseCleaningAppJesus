import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, User, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import NotificationToast from '../components/NotificationToast';
import OfflineBanner from '../components/OfflineBanner';
import TabBar from '../components/ui/TabBar';
import { CatalogsProvider } from '../context/CatalogsContext';
import { JobsProvider } from '../context/JobsContext';
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
import { t } from '../constants/strings';

const Stack = createNativeStackNavigator<RootStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();
const ONBOARDED_KEY = 'pc_crew_onboarded_v1';

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border },
};

const TAB_ICONS = { Home: House, Payroll: Wallet, Profile: User };

function MainTabs() {
  const labels = { Home: t.tabHome, Payroll: t.tabPayroll, Profile: t.tabProfile };
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} icons={TAB_ICONS} labels={labels} />}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Payroll" component={PayrollScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function useOnboarded(): [boolean | null, () => void] {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setDone(v === '1'))
      .catch(() => setDone(true));
  }, []);
  const finish = () => {
    setDone(true);
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => undefined);
  };
  return [done, finish];
}

export default function RootNavigator({ onboarded, finishOnboarding }: { onboarded: boolean | null; finishOnboarding: () => void }) {
  const { state } = useSession();

  if (state === 'signingOut') return <LoadingScreen label={t.signingOut} />;
  if (state === 'checking' || state === 'loadingProfile' || onboarded === null) return <LoadingScreen label={t.loadingSession} />;
  if (state === 'signedOut') return onboarded ? <LoginScreen /> : <OnboardingScreen onFinish={finishOnboarding} />;
  if (state === 'noProfile' || state === 'inactive') return <BlockedScreen reason={state} />;

  return (
    <CatalogsProvider>
      <JobsProvider>
        <PayrollProvider>
          <NotificationsProvider>
            <OutboxProvider>
              <PhotoQueueProvider>
                <NavigationContainer theme={theme} ref={navigationRef}>
                  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.bg } }}>
                    <Stack.Screen name="Tabs" component={MainTabs} />
                    <Stack.Screen name="JobDetail" component={JobDetailScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
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
  );
}
