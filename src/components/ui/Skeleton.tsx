import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { styles } from './Skeleton.styles';

interface BlockProps {
    width: DimensionValue;
    height: number;
    isRound?: boolean;
}

interface CardSkeletonListProps {
    count: number;
    style?: StyleProp<ViewStyle>;
}

const Block = ({ width, height, isRound = false }: BlockProps) => <View style={[styles.block, isRound && styles.round, { width, height }]} />;

export const JobCardSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.row}>
            <Block width={44} height={44} isRound />
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

export const CardSkeletonList = ({ count, style }: CardSkeletonListProps) => (
    <View style={[styles.list, style]}>
        {Array.from({ length: count }, (_, index) => (
            <JobCardSkeleton key={index} />
        ))}
    </View>
);
