import { View, type DimensionValue } from 'react-native';
import { styles } from './Skeleton.styles';

function Block({ width, height, round }: { width: DimensionValue; height: number; round?: boolean }) {
    return <View style={[styles.block, round && styles.round, { width, height }]} />;
}

export function JobCardSkeleton() {
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Block width={44} height={44} round />
                <View style={styles.col}>
                    <Block width="70%" height={15} />
                    <Block width="45%" height={12} />
                </View>
            </View>
            <Block width="90%" height={12} />
            <View style={styles.row}>
                <Block width={80} height={22} />
                <Block width={70} height={22} />
            </View>
        </View>
    );
}
