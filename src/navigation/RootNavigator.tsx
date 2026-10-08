// src/navigation/RootNavigator.tsx
// Sin sesión → Login. Con sesión pero sin perfil activo → aviso.
// Con sesión lista → pestañas: Mis casas · Payroll · Perfil.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, User, Wallet } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { ui } from '../components/ui.styles';
import { CatalogsProvider } from '../context/CatalogsContext';
import { JobsProvider } from '../context/JobsContext';
import { useLanguage } from '../context/LanguageContext';
import { NetworkProvider } from '../context/NetworkContext';
import { OutboxProvider } from '../context/OutboxContext';
import { PhotoQueueProvider } from '../context/PhotoQueueContext';
import { useSession } from '../context/SessionContext';
import BlockedScreen from '../screens/BlockedScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import JobsScreen from '../screens/JobsScreen';
import LoginScreen from '../screens/LoginScreen';
import PayrollScreen from '../screens/PayrollScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/tokens';
import type { JobsStackParams, TabParams } from './types';

const Stack = createNativeStackNavigator<JobsStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();

const theme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border },
};

function JobsStack() {
  const { t } = useLanguage();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Jobs" component={JobsScreen} options={{ title: t.tabJobs }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { t } = useLanguage();
  return (
    <Tabs.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textSoft }}>
      <Tabs.Screen
        name="JobsTab"
        component={JobsStack}
        options={{ headerShown: false, title: t.tabJobs, tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="PayrollTab"
        component={PayrollScreen}
        options={{ title: t.payrollTitle, tabBarLabel: t.tabPayroll, tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t.tabProfile, tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { state } = useSession();

  if (state === 'checking' || state === 'loadingProfile') {
    return (
      <View style={ui.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (state === 'signedOut') return <LoginScreen />;
  if (state === 'noProfile' || state === 'inactive') return <BlockedScreen reason={state} />;

  return (
    <NetworkProvider>
      <CatalogsProvider>
        <JobsProvider>
          <OutboxProvider>
            <PhotoQueueProvider>
              <NavigationContainer theme={theme}>
                <MainTabs />
              </NavigationContainer>
            </PhotoQueueProvider>
          </OutboxProvider>
        </JobsProvider>
      </CatalogsProvider>
    </NetworkProvider>
  );
}
