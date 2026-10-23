import Chip from './Chip';
import { styles } from './SelectableChip.styles';
import Touchable from './Touchable';
import type { ComponentProps } from 'react';

type ChipProps = ComponentProps<typeof Chip>;

interface Props extends Omit<ChipProps, 'solid'> {
    isSelected: boolean;
    onPress: () => void;
}

const SelectableChip = ({ isSelected, onPress, ...chipProps }: Props) => (
    <Touchable onPress={onPress} style={[styles.choice, isSelected && styles.selected]} accessibilityState={{ selected: isSelected }} accessibilityLabel={chipProps.label}>
        <Chip {...chipProps} solid={isSelected && !chipProps.color} />
    </Touchable>
);

export default SelectableChip;
