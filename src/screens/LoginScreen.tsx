import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import { resetPassword, signIn as authSignIn } from '../services/sessionService';
import { colors, gradients } from '../theme/tokens';
import { errorCode } from '../utils/ids';
import { styles } from './LoginScreen.styles';
import { t } from '../constants/strings';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passRef = useRef<TextInput>(null);

  const fail = (msg: string) => {
    setError(msg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
  };

  const signIn = () => {
    setError('');
    setLoading(true);
    authSignIn(email, password)
      .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined))
      .catch((err) => {
        console.error('Login error:', err);
        fail(t.loginError);
      })
      .then(() => setLoading(false));
  };

  const reset = () => {
    if (!email.trim()) return fail(t.enterEmailFirst);
    resetPassword(email)
      .then(() => Alert.alert(t.appName, t.resetSent))
      .catch((err) => Alert.alert(t.error, errorCode(err)));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <View style={[styles.orb, styles.orbA]} />
          <View style={[styles.orb, styles.orbB]} />
          <View style={styles.logoBox}>
            <Image source={require('../../assets/logo-mark.png')} style={styles.logo} contentFit="contain" />
          </View>
          <View>
            <AppText variant="display" tone="inverse" center>
              {t.appName}
            </AppText>
            <AppText variant="label" tone="inverseMuted" center>
              {t.appTagline}
            </AppText>
          </View>
        </LinearGradient>

        <View style={styles.card}>
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
            <View>
              <AppText variant="small" tone="danger">
                {error}
              </AppText>
            </View>
          )}
          <Button label={t.signIn} onPress={signIn} loading={loading} disabled={!email || !password} size="lg" />
          <Pressable onPress={reset} accessibilityRole="link" style={styles.link}>
            <AppText variant="bodyStrong" tone="brand">
              {t.forgotPassword}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
