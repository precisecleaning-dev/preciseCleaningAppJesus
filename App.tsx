// App.tsx — Precise Crew (app móvil de empleados de Precise Cleaning)
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { SessionProvider } from './src/context/SessionContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SessionProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
