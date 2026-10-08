// src/screens/LoginScreen.tsx
// ⭐ Acceso con el mismo correo y contraseña de la web (Firebase Auth).
//    Encabezado curvo con degradado y logo, tarjeta que entra con resorte y
//    un "temblor" del formulario si el correo o la contraseña no coinciden.
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type TextInput } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import { auth } from '../config/firebase';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients } from '../theme/tokens';
import { styles } from './LoginScreen.styles';

export default function LoginScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passRef = useRef<TextInput>(null);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const fail = (msg: string) => {
    setError(msg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    shake.set(withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }), withTiming(-6, { duration: 50 }), withTiming(6, { duration: 50 }), withTiming(0, { duration: 50 })));
  };

  const signIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (err) {
      console.error('Login error:', err);
      fail(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    const target = email.trim();
    if (!target) return fail(t.enterEmailFirst);
    try {
      await sendPasswordResetEmail(auth, target);
      Alert.alert(t.appName, t.resetSent);
    } catch (err) {
      Alert.alert(t.error, String((err as Error)?.message || err));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <View style={[styles.orb, styles.orbA]} />
          <View style={[styles.orb, styles.orbB]} />
          <Animated.View entering={FadeInUp.springify().damping(14)} style={styles.logoBox}>
            <Image source={require('../../assets/logo-mark.png')} style={styles.logo} contentFit="contain" />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(120).springify().damping(16)}>
            <AppText variant="display" tone="inverse" center>
              {t.appName}
            </AppText>
            <AppText variant="label" tone="inverseMuted" center>
              {t.appTagline}
            </AppText>
          </Animated.View>
        </LinearGradient>

        <Animated.View entering={FadeInDown.delay(200).springify().damping(16)} style={[styles.card, shakeStyle]}>
          <View style={styles.cardHead}>
            <AppText variant="h1">{t.loginTitle}</AppText>
            <AppText variant="small" tone="muted">
              {t.loginSubtitle}
            </AppText>
          </View>
          <TextField
            icon={Mail}
            placeholder={t.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passRef.current?.focus()}
            invalid={!!error}
            accessibilityLabel={t.email}
          />
          <TextField
            ref={passRef}
            icon={Lock}
            placeholder={t.password}
            secureTextEntry={!show}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={signIn}
            invalid={!!error}
            accessibilityLabel={t.password}
            right={
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} accessibilityRole="button" accessibilityLabel={show ? t.hidePassword : t.showPassword}>
                {show ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
              </Pressable>
            }
          />
          {!!error && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <AppText variant="small" tone="danger">
                {error}
              </AppText>
            </Animated.View>
          )}
          <Button label={t.signIn} onPress={signIn} loading={loading} disabled={!email || !password} size="lg" />
          <Pressable onPress={reset} accessibilityRole="link" style={styles.link}>
            <AppText variant="bodyStrong" tone="brand">
              {t.forgotPassword}
            </AppText>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
