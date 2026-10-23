import { StyleSheet } from 'react-native';
import { space, TAB_BAR_SPACE } from '../theme/tokens';

export const styles = StyleSheet.create({
    list: { paddingBottom: TAB_BAR_SPACE },
    tabs: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
    item: { paddingHorizontal: space.md, paddingBottom: space.sm },
    skeletons: { paddingHorizontal: space.md, paddingTop: space.lg },
});
