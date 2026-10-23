import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, View } from 'react-native';
import AppText from './AppText';
import { styles } from './SegmentedTabs.styles';

interface Option<T extends string> {
    value: T;
    label: string;
    count?: number;
}

interface Props<T extends string> {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    scrollable?: boolean;
}

const SegmentedTabs = <T extends string>({ options, value, onChange, scrollable = false }: Props<T>) => {
    const tabs = options.map((option) => {
        const isActive = option.value === value;
        return (
            <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                onPress={() => {
                    if (isActive) return;
                    Haptics.selectionAsync().catch(() => undefined);
                    onChange(option.value);
                }}
                style={[scrollable ? styles.itemScrollable : styles.item, isActive && styles.itemActive]}
            >
                <AppText variant="caption" style={isActive ? styles.labelActive : styles.label}>
                    {option.label}
                </AppText>
                {option.count !== undefined && (
                    <View style={[styles.count, isActive && styles.countActive]}>
                        <AppText variant="caption" style={[styles.countText, isActive && styles.countTextActive]}>
                            {option.count}
                        </AppText>
                    </View>
                )}
            </Pressable>
        );
    });

    if (!scrollable) {
        return (
            <View style={styles.wrap} accessibilityRole="tablist">
                {tabs}
            </View>
        );
    }

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollWrap} contentContainerStyle={styles.scrollContent} accessibilityRole="tablist">
            {tabs}
        </ScrollView>
    );
};

export default SegmentedTabs;
