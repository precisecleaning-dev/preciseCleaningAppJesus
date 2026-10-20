import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Banknote, Bell, CalendarCheck, Camera, CloudUpload, House, Images, MapPin, Sparkles, Wallet, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import Illustration, { type Orbits } from '../components/ui/Illustration';
import Touchable from '../components/ui/Touchable';
import { colors, gradients } from '../theme/tokens';
import { styles } from './OnboardingScreen.styles';
import { t } from '../constants/strings';

interface Slide {
    icon: LucideIcon;
    gradient: readonly [string, string];
    orbits: Orbits;
    title: 'ob1Title' | 'ob2Title' | 'ob3Title';
    body: 'ob1Body' | 'ob2Body' | 'ob3Body';
}

const SLIDES: Slide[] = [
    {
        icon: House,
        gradient: gradients.brand,
        orbits: [
            { icon: MapPin, accent: 'coral' },
            { icon: Bell, accent: 'amber' },
            { icon: CalendarCheck, accent: 'mint' },
        ],
        title: 'ob1Title',
        body: 'ob1Body',
    },
    {
        icon: Camera,
        gradient: gradients.violet,
        orbits: [
            { icon: Images, accent: 'sky' },
            { icon: Sparkles, accent: 'amber' },
            { icon: CloudUpload, accent: 'teal' },
        ],
        title: 'ob2Title',
        body: 'ob2Body',
    },
    {
        icon: Wallet,
        gradient: gradients.mint,
        orbits: [
            { icon: Banknote, accent: 'amber' },
            { icon: CalendarCheck, accent: 'violet' },
            { icon: Sparkles, accent: 'coral' },
        ],
        title: 'ob3Title',
        body: 'ob3Body',
    },
];

export default function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
    const { width } = useWindowDimensions();
    const [page, setPage] = useState(0);
    const scroller = useRef<ScrollView>(null);
    const isLast = page === SLIDES.length - 1;

    const goNext = () => {
        if (isLast) return onFinish();
        scroller.current?.scrollTo({ x: (page + 1) * width, animated: false });
        setPage(page + 1);
    };

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar style="dark" />
            <View style={styles.top}>
                <AppText variant="label" tone="brand">
                    {t.appName}
                </AppText>
                {!isLast && (
                    <Touchable onPress={onFinish} accessibilityLabel={t.skip} style={styles.skip}>
                        <AppText variant="bodyStrong" tone="muted">
                            {t.skip}
                        </AppText>
                    </Touchable>
                )}
            </View>
            <ScrollView
                ref={scroller}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
                {SLIDES.map((slide) => (
                    <View key={slide.title} style={[styles.page, { width }]}>
                        <Illustration icon={slide.icon} gradient={slide.gradient} orbits={slide.orbits} size={Math.min(280, width * 0.72)} />
                        <View style={styles.copy}>
                            <AppText variant="display" center>
                                {t[slide.title]}
                            </AppText>
                            <AppText variant="body" tone="muted" center>
                                {t[slide.body]}
                            </AppText>
                        </View>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.bottom}>
                <View style={styles.dots}>
                    {SLIDES.map((slide, i) => (
                        <View key={slide.title} style={[styles.dot, i === page && styles.dotActive]} />
                    ))}
                </View>
                <Touchable onPress={goNext} accessibilityLabel={isLast ? t.start : t.next} haptic="medium">
                    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.next, isLast && styles.nextWide]}>
                        {isLast && (
                            <AppText variant="title" tone="inverse">
                                {t.start}
                            </AppText>
                        )}
                        <ArrowRight size={24} color={colors.white} strokeWidth={2.4} />
                    </LinearGradient>
                </Touchable>
            </View>
        </SafeAreaView>
    );
}
