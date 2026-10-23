import { Alert } from 'react-native';

export const confirmAction = (title: string, message: string, confirmLabel: string, cancelLabel: string, isDestructive = false) =>
    new Promise<boolean>((resolve) =>
        Alert.alert(title, message, [
            { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
            { text: confirmLabel, style: isDestructive ? 'destructive' : 'default', onPress: () => resolve(true) },
        ]),
    );
