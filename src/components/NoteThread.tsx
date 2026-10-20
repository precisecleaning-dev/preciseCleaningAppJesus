import { LinearGradient } from 'expo-linear-gradient';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { colors, gradients } from '../theme/tokens';
import type { NoteHistoryEntry } from '../types';
import { formatDateTime } from '../utils/dateFormat';
import { styles } from './NoteThread.styles';
import AppText from './ui/AppText';
import Touchable from './ui/Touchable';
import { t } from '../constants/strings';

interface Props {
  title: string;
  field: NoteHistoryEntry['field'];
  legacyText: string;
  history: NoteHistoryEntry[];
  pending?: NoteHistoryEntry[];
  myEmail: string;
  canWrite: boolean;
  onSend?: (text: string) => void;
}

export default function NoteThread({ title, field, legacyText, history, pending = [], myEmail, canWrite, onSend }: Props) {
  const [draft, setDraft] = useState('');

  const entries = history.filter((e) => e.field === field && String(e.text || '').trim() !== '');
  const me = myEmail.toLowerCase();
  const saved =
    entries.length > 0
      ? entries.map((e, i) => {
          const who = String(e.user || '');
          return { key: `${e.at}-${i}`, text: e.text, mine: who.toLowerCase() === me, author: who.split('@')[0], at: e.at, pending: false };
        })
      : legacyText.trim()
        ? [{ key: 'legacy', text: legacyText.trim(), mine: false, author: '', at: '', pending: false }]
        : [];
  const savedKeys = new Set(entries.map((e) => `${e.at}|${e.text}`));
  const messages = [
    ...saved,
    ...pending
      .filter((e) => e.field === field && !savedKeys.has(`${e.at}|${e.text}`))
      .map((e) => ({ key: `p-${e.at}`, text: e.text, mine: true, author: '', at: e.at, pending: true })),
  ];

  const send = () => {
    const text = draft.trim();
    if (!text || !onSend) return;
    onSend(text);
    setDraft('');
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="title">{title}</AppText>
      {messages.length === 0 && (
        <AppText variant="small" tone="soft">
          —
        </AppText>
      )}
      {messages.map((m) => (
        <View key={m.key} style={[styles.bubble, m.mine ? styles.mine : styles.theirs, m.pending && styles.pending]}>
          <AppText variant="body">{m.text}</AppText>
          {(m.author || m.at || m.pending) && (
            <AppText variant="caption" tone="muted">
              {[m.author, formatDateTime(m.at), m.pending ? t.pendingSync : ''].filter(Boolean).join(' · ')}
            </AppText>
          )}
        </View>
      ))}
      {canWrite && onSend && (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={t.writeNote}
            placeholderTextColor={colors.textSoft}
            multiline
            accessibilityLabel={t.writeNote}
          />
          <Touchable onPress={send} disabled={!draft.trim()} accessibilityLabel={t.send} haptic="medium" style={!draft.trim() && styles.sendDisabled}>
            <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
              <Send size={20} color={colors.white} />
            </LinearGradient>
          </Touchable>
        </View>
      )}
    </View>
  );
}
