import { Check, Search, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { fmt, t } from '../constants/strings';
import { colors } from '../theme/tokens';
import { styles } from './OptionPicker.styles';
import AppText from './ui/AppText';
import Button from './ui/Button';
import TextField from './ui/TextField';
import Touchable from './ui/Touchable';

export interface PickerOption {
    value: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
}

interface Props {
    isVisible: boolean;
    title: string;
    options: PickerOption[];
    selectedValues: string[];
    isMultiple?: boolean;
    isLoading?: boolean;
    emptyMessage?: string;
    onClose: () => void;
    onConfirm: (values: string[]) => void;
}

const SEARCH_THRESHOLD = 8;

const OptionPicker = ({ isVisible, title, options, selectedValues, isMultiple = false, isLoading = false, emptyMessage, onClose, onConfirm }: Props) => {
    const [searchText, setSearchText] = useState('');
    const [draftValues, setDraftValues] = useState<string[] | null>(null);
    const currentValues = draftValues ?? selectedValues;
    const normalizedSearch = searchText.trim().toLowerCase();
    const visibleOptions = normalizedSearch ? options.filter((option) => option.label.toLowerCase().includes(normalizedSearch)) : options;

    const closePicker = () => {
        setSearchText('');
        setDraftValues(null);
        onClose();
    };

    const confirmValues = (values: string[]) => {
        setSearchText('');
        setDraftValues(null);
        onConfirm(values);
    };

    const handleOptionPress = (value: string) => {
        if (!isMultiple) {
            confirmValues([value]);
            return;
        }
        setDraftValues(currentValues.includes(value) ? currentValues.filter((selected) => selected !== value) : [...currentValues, value]);
    };

    return (
        <Modal visible={isVisible} onRequestClose={closePicker}>
            <SafeAreaProvider>
                <SafeAreaView style={styles.screen}>
                    <View style={styles.header}>
                        <AppText variant="h2" style={styles.title} numberOfLines={1}>
                            {title}
                        </AppText>
                        <Touchable onPress={closePicker} style={styles.closeButton} accessibilityLabel={t.close}>
                            <X size={24} color={colors.text} />
                        </Touchable>
                    </View>

                    {options.length > SEARCH_THRESHOLD && (
                        <View style={styles.search}>
                            <TextField icon={Search} value={searchText} onChangeText={setSearchText} placeholder={t.pickerSearch} autoCorrect={false} />
                        </View>
                    )}

                    <FlatList
                        data={visibleOptions}
                        keyExtractor={(option) => option.value}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <AppText variant="small" tone="muted" center style={styles.empty}>
                                {isLoading ? t.pickerLoading : (emptyMessage ?? t.pickerEmpty)}
                            </AppText>
                        }
                        renderItem={({ item: option }) => {
                            const isSelected = currentValues.includes(option.value);
                            const OptionIcon = option.icon;
                            return (
                                <Touchable
                                    onPress={() => handleOptionPress(option.value)}
                                    style={[styles.option, isSelected && styles.optionSelected]}
                                    accessibilityState={{ selected: isSelected }}
                                    accessibilityLabel={option.label}
                                >
                                    {OptionIcon && <OptionIcon size={20} color={isSelected ? colors.primary : colors.textMuted} />}
                                    <View style={styles.optionText}>
                                        <AppText variant="body" numberOfLines={1}>
                                            {option.label}
                                        </AppText>
                                        {!!option.description && (
                                            <AppText variant="caption" tone="muted" numberOfLines={1}>
                                                {option.description}
                                            </AppText>
                                        )}
                                    </View>
                                    {isSelected && <Check size={20} color={colors.primary} />}
                                </Touchable>
                            );
                        }}
                    />

                    {isMultiple && (
                        <View style={styles.footer}>
                            <Button label={fmt(t.pickerDone, { count: currentValues.length })} onPress={() => confirmValues(currentValues)} />
                        </View>
                    )}
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
};

export default OptionPicker;
