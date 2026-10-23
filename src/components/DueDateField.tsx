import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarDays, Clock, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { t } from '../constants/strings';
import { colors } from '../theme/tokens';
import type { YmdDate } from '../types/tasks';
import { formatDate } from '../utils/dateFormat';
import { formatDueTime, timeOfDueTime } from '../utils/taskFormat';
import { toLocalYmd } from '../utils/taskTabs';
import { styles } from './DueDateField.styles';
import FieldButton from './ui/FieldButton';
import Touchable from './ui/Touchable';

interface DueValue {
    dueDate: YmdDate;
    dueTime: string;
}

interface Props extends DueValue {
    onChange: (value: DueValue) => void;
    allowsTime?: boolean;
    placeholder?: string;
}

type PickerMode = 'date' | 'time';

const DEFAULT_HOUR = 9;

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

const dateOfYmd = (ymd: YmdDate): Date => {
    const [year, month, day] = ymd.split('-').map(Number);
    return year && month && day ? new Date(year, month - 1, day, 12) : new Date();
};

const DueDateField = ({ dueDate, dueTime, onChange, allowsTime = true, placeholder = t.taskPickDate }: Props) => {
    const [openPicker, setOpenPicker] = useState<PickerMode | null>(null);
    const isAndroid = Platform.OS === 'android';

    const pickerValueFor = (mode: PickerMode): Date => {
        if (mode === 'date') return dueDate ? dateOfYmd(dueDate) : new Date();
        return timeOfDueTime(dueTime) ?? new Date(2000, 0, 1, DEFAULT_HOUR, 0);
    };

    const applyPickedValue = (mode: PickerMode, picked: Date) => {
        if (mode === 'date') onChange({ dueDate: toLocalYmd(picked), dueTime });
        else onChange({ dueDate, dueTime: `${padTwoDigits(picked.getHours())}:${padTwoDigits(picked.getMinutes())}` });
    };

    const handleFieldPress = (mode: PickerMode) => {
        if (isAndroid) {
            DateTimePickerAndroid.open({ value: pickerValueFor(mode), mode, is24Hour: false, onValueChange: (_, picked) => applyPickedValue(mode, picked) });
            return;
        }
        setOpenPicker((current) => (current === mode ? null : mode));
    };

    const clearDate = () => {
        setOpenPicker(null);
        onChange({ dueDate: '', dueTime: '' });
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.row}>
                <FieldButton
                    icon={CalendarDays}
                    value={dueDate ? formatDate(dueDate) : ''}
                    placeholder={placeholder}
                    onPress={() => handleFieldPress('date')}
                    accessibilityLabel={placeholder}
                    isActive={openPicker === 'date'}
                />
                {!!dueDate && allowsTime && (
                    <FieldButton
                        icon={Clock}
                        value={dueTime ? formatDueTime(dueTime) : ''}
                        placeholder={t.taskPickTime}
                        onPress={() => handleFieldPress('time')}
                        accessibilityLabel={t.taskPickTime}
                        isActive={openPicker === 'time'}
                    />
                )}
                {!!dueDate && (
                    <Touchable onPress={clearDate} style={styles.clearButton} accessibilityLabel={t.taskClearDate}>
                        <X size={20} color={colors.textMuted} />
                    </Touchable>
                )}
            </View>
            {!isAndroid && openPicker && (
                <DateTimePicker
                    value={pickerValueFor(openPicker)}
                    mode={openPicker}
                    display={openPicker === 'date' ? 'inline' : 'spinner'}
                    onValueChange={(_, picked) => applyPickedValue(openPicker, picked)}
                    accentColor={colors.primary}
                />
            )}
        </View>
    );
};

export default DueDateField;
