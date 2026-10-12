import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from './src/components/AnimatedSplash';
import { texts } from './src/constants/texts';
import { NetworkProvider } from './src/context/NetworkContext';
import { SessionProvider, useSession } from './src/context/SessionContext';
import RootNavigator, { useOnboarded } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { state } = useSession();
  const [onboarded, finishOnboarding] = useOnboarded();
  const [splashDone, setSplashDone] = useState(false);
  const ready = fontsReady && onboarded !== null && state !== 'checking' && state !== 'loadingProfile';

  return (
    <>
      {fontsReady && <RootNavigator onboarded={onboarded} finishOnboarding={finishOnboarding} />}
      {!splashDone && <AnimatedSplash ready={ready} fontsReady={fontsReady} label={{ name: texts.appName, tagline: texts.appTagline }} onDone={() => setSplashDone(true)} />}
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NetworkProvider>
        <SessionProvider>
          <Shell fontsReady={fontsLoaded || !!fontError} />
        </SessionProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
