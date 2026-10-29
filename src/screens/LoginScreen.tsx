import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import Touchable from '../components/ui/Touchable';
import { resetPassword, signIn as authSignIn } from '../services/sessionService';
import { colors, gradients } from '../theme/tokens';
import { errorCode } from '../utils/ids';
import { styles } from './LoginScreen.styles';
import { t } from '../constants/strings';

const WRONG_CREDENTIAL_CODES = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/missing-password'];

const authErrorMessage = (error: unknown): string => {
    const code = errorCode(error);
    if (WRONG_CREDENTIAL_CODES.includes(code)) return t.loginError;
    if (code === 'auth/network-request-failed') return t.loginNetworkError;
    if (code === 'auth/too-many-requests') return t.loginTooManyAttempts;
    if (code === 'auth/user-disabled') return t.loginUserDisabled;
    return t.loginUnknownError;
};

const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [isSigningIn, setSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const passwordRef = useRef<TextInput>(null);

    const showError = (message: string) => {
        setErrorMessage(message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    };

    const handleSignInPress = () => {
        setErrorMessage('');
        setSigningIn(true);
        authSignIn(email, password)
            .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined))
            .catch((error: unknown) => {
                console.error('Login error:', error);
                showError(authErrorMessage(error));
            })
            .then(() => setSigningIn(false));
    };

    const handleForgotPasswordPress = () => {
        if (!email.trim()) return showError(t.enterEmailFirst);
        resetPassword(email)
            .then(() => Alert.alert(t.appName, t.resetSent))
            .catch((error: unknown) => Alert.alert(t.error, authErrorMessage(error)));
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
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        invalid={!!errorMessage}
                        accessibilityLabel={t.email}
                    />
                    <TextField
                        ref={passwordRef}
                        icon={Lock}
                        placeholder={t.password}
                        secureTextEntry={!isPasswordVisible}
                        autoComplete="password"
                        textContentType="password"
                        returnKeyType="go"
                        value={password}
                        onChangeText={setPassword}
                        onSubmitEditing={handleSignInPress}
                        invalid={!!errorMessage}
                        accessibilityLabel={t.password}
                        right={
                            <Touchable
                                onPress={() => setPasswordVisible((isVisible) => !isVisible)}
                                hitSlop={10}
                                accessibilityLabel={isPasswordVisible ? t.hidePassword : t.showPassword}
                            >
                                {isPasswordVisible ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
                            </Touchable>
                        }
                    />
                    {!!errorMessage && (
                        <View>
                            <AppText variant="small" tone="danger">
                                {errorMessage}
                            </AppText>
                        </View>
                    )}
                    <Button label={t.signIn} onPress={handleSignInPress} loading={isSigningIn} disabled={!email || !password} size="lg" />
                    <Touchable onPress={handleForgotPasswordPress} accessibilityRole="link" style={styles.link}>
                        <AppText variant="bodyStrong" tone="brand">
                            {t.forgotPassword}
                        </AppText>
                    </Touchable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;
