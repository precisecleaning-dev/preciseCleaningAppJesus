import type { ReactNode } from 'react';
import AppText from './AppText';
import Card from './Card';
import { styles } from './FormSection.styles';

interface Props {
    label: string;
    errorMessage?: string;
    hint?: string;
    children: ReactNode;
}

const FormSection = ({ label, errorMessage, hint, children }: Props) => (
    <Card style={styles.section}>
        <AppText variant="label">{label}</AppText>
        {children}
        {!!hint && (
            <AppText variant="caption" tone="muted">
                {hint}
            </AppText>
        )}
        {!!errorMessage && (
            <AppText variant="caption" tone="danger">
                {errorMessage}
            </AppText>
        )}
    </Card>
);

export default FormSection;
