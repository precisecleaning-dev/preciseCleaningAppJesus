// src/screens/LoginScreen.tsx
// Mismo acceso que LoginView de la web: correo + contraseña de Firebase Auth.
// Las cuentas se crean desde la web (System Users); aquí no hay registro.
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../components/ActionButton';
import { ui } from '../components/ui.styles';
import { auth } from '../config/firebase';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/tokens';
import { styles } from './LoginScreen.styles';

export default function LoginScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error('Login error:', err);
      setError(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    const target = email.trim();
    if (!target) {
      setError(t.enterEmailFirst);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, target);
      Alert.alert(t.appName, t.resetSent);
    } catch (err) {
      Alert.alert(t.error, String((err as Error)?.message || err));
    }
  };

  return (
    <SafeAreaView style={ui.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="contain" />
          <Text style={styles.title}>{t.appName}</Text>
          <Text style={styles.subtitle}>{t.loginSubtitle}</Text>

          <View style={styles.form}>
            <TextInput
              style={ui.input}
              placeholder={t.email}
              placeholderTextColor={colors.textSoft}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={ui.input}
              placeholder={t.password}
              placeholderTextColor={colors.textSoft}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={signIn}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <ActionButton label={t.signIn} onPress={signIn} loading={loading} disabled={!email || !password} />
            <Pressable onPress={reset} accessibilityRole="link" style={styles.link}>
              <Text style={styles.linkText}>{t.forgotPassword}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
