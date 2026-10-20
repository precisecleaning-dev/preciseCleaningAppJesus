import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import AppText from './ui/AppText';
import GradientHeader from './ui/GradientHeader';
import IconButton from './ui/IconButton';
import { styles } from './ScreenTopBar.styles';
import { t } from '../constants/strings';

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
        <IconButton icon={ChevronLeft} onPress={onBack} label={t.back} />
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
