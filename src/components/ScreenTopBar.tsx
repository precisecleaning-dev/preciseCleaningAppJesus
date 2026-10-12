import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { texts } from '../constants/texts';
import { styles } from './ScreenTopBar.styles';
import AppText from './ui/AppText';
import GradientHeader from './ui/GradientHeader';
import IconButton from './ui/IconButton';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: ReactNode;
  children?: ReactNode;
  overlap?: number;
}

export default function ScreenTopBar({ title, subtitle, onBack, right, children, overlap }: Props) {
  return (
    <GradientHeader overlap={overlap}>
      <View style={styles.row}>
        <IconButton icon={ChevronLeft} onPress={onBack} label={texts.back} />
        <View style={styles.titles}>
          <AppText variant="h2" tone="inverse" numberOfLines={1}>
            {title}
          </AppText>
          {!!subtitle && (
            <AppText variant="small" tone="inverseMuted" numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>
        {right}
      </View>
      {children}
    </GradientHeader>
  );
}
