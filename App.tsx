// App.tsx — Precise Cleaning · app del equipo
// Orden de arranque: la pantalla nativa se mantiene hasta montar la animación de
// apertura; ésta cubre la carga de fuentes y la verificación de sesión y se
// retira sola cuando todo está listo.
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AnimatedSplash from './src/components/AnimatedSplash';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { SessionProvider, useSession } from './src/context/SessionContext';
import RootNavigator, { useOnboarded } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { state } = useSession();
  const { t } = useLanguage();
  const [onboarded, finishOnboarding] = useOnboarded();
  const [splashDone, setSplashDone] = useState(false);
  const onSplashDone = useCallback(() => setSplashDone(true), []);
  const ready = fontsReady && onboarded !== null && state !== 'checking' && state !== 'loadingProfile';

  return (
    <>
      {fontsReady && <RootNavigator onboarded={onboarded} finishOnboarding={finishOnboarding} />}
      {!splashDone && <AnimatedSplash ready={ready} fontsReady={fontsReady} label={{ name: t.appName, tagline: t.appTagline }} onDone={onSplashDone} />}
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
  // Si la fuente falla, la app sigue con la del sistema en vez de quedarse en la apertura.
  const fontsReady = fontsLoaded || !!fontError;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LanguageProvider>
          <SessionProvider>
            <Shell fontsReady={fontsReady} />
          </SessionProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
