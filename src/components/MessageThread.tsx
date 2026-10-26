import { LinearGradient } from 'expo-linear-gradient';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { t } from '../constants/strings';
import { colors, gradients } from '../theme/tokens';
import { formatDateTime } from '../utils/dateFormat';
import { styles } from './MessageThread.styles';
import AppText from './ui/AppText';
import TextField from './ui/TextField';
import Touchable from './ui/Touchable';

export interface ThreadMessage {
    key: string;
    text: string;
    author: string;
    at: string;
    isMine: boolean;
    isPending?: boolean;
}

interface Props {
    title: string;
    messages: ThreadMessage[];
    emptyText: string;
    placeholder: string;
    canWrite: boolean;
    onSend?: (text: string) => Promise<boolean>;
    onDraftChange?: (text: string) => void;
    pendingLabel?: string;
    maxLength?: number;
}

const MessageThread = ({ title, messages, emptyText, placeholder, canWrite, onSend, onDraftChange, pendingLabel = t.pendingSync, maxLength }: Props) => {
    const [draft, setDraft] = useState('');
    const [isSending, setSending] = useState(false);
    const trimmedDraft = draft.trim();
    const canSend = !!trimmedDraft && !isSending;

    const updateDraft = (text: string) => {
        setDraft(text);
        onDraftChange?.(text);
    };

    const handleSendPress = () => {
        if (!canSend || !onSend) return;
        setSending(true);
        onSend(trimmedDraft).then((isSent) => {
            setSending(false);
            if (isSent) updateDraft('');
        });
    };

    return (
        <View style={styles.wrap}>
            <AppText variant="title">{title}</AppText>
            {messages.length === 0 && (
                <AppText variant="small" tone="soft">
                    {emptyText}
                </AppText>
            )}
            {messages.map((message) => (
                <View key={message.key} style={[styles.bubble, message.isMine ? styles.mine : styles.theirs, message.isPending && styles.pending]}>
                    <AppText variant="body">{message.text}</AppText>
                    {(message.author || message.at || message.isPending) && (
                        <AppText variant="caption" tone="muted">
                            {[message.author, formatDateTime(message.at), message.isPending ? pendingLabel : ''].filter(Boolean).join(' · ')}
                        </AppText>
                    )}
                </View>
            ))}
            {canWrite && onSend && (
                <View style={styles.composer}>
                    <TextField
                        containerStyle={styles.inputContainer}
                        style={styles.input}
                        value={draft}
                        onChangeText={updateDraft}
                        placeholder={placeholder}
                        multiline
                        maxLength={maxLength}
                        editable={!isSending}
                        accessibilityLabel={placeholder}
                    />
                    <Touchable onPress={handleSendPress} disabled={!canSend} accessibilityLabel={t.send} haptic="medium" style={!canSend && styles.sendDisabled}>
                        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendButton}>
                            {isSending ? <ActivityIndicator color={colors.white} /> : <Send size={20} color={colors.white} />}
                        </LinearGradient>
                    </Touchable>
                </View>
            )}
        </View>
    );
};

export default MessageThread;
