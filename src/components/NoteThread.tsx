// src/components/NoteThread.tsx
// ⭐ Hilo de notas, mismo modelo que NoteThread.tsx de la web: cada entrada de
//    `notesHistory` del campo es un mensaje; si la casa tiene texto pero no
//    historial (casas viejas / importadas de AppSheet), ese texto se muestra
//    como un primer mensaje. Los mensajes propios van a la derecha en azul;
//    los de la oficina a la izquierda en verde azulado. Los pendientes (sin
//    señal) se ven con borde punteado hasta que llegan.
import { LinearGradient } from 'expo-linear-gradient';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { colors, gradients } from '../theme/tokens';
import type { NoteHistoryEntry } from '../types';
import { formatDateTime } from '../utils/dateFormat';
import { styles } from './NoteThread.styles';
import AppText from './ui/AppText';
import PressableScale from './ui/PressableScale';

interface Props {
  title: string;
  field: NoteHistoryEntry['field'];
  legacyText: string;
  history: NoteHistoryEntry[];
  pending?: NoteHistoryEntry[];
  myEmail: string;
  canWrite: boolean;
  onSend?: (text: string) => Promise<boolean>;
}

export default function NoteThread({ title, field, legacyText, history, pending = [], myEmail, canWrite, onSend }: Props) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

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

  const send = async () => {
    const text = draft.trim();
    if (!text || !onSend) return;
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) setDraft('');
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
        <Animated.View key={m.key} entering={FadeInUp.springify().damping(18)} style={[styles.bubble, m.mine ? styles.mine : styles.theirs, m.pending && styles.pending]}>
          <AppText variant="body">{m.text}</AppText>
          {(m.author || m.at || m.pending) && (
            <AppText variant="caption" tone="muted">
              {[m.author, formatDateTime(m.at), m.pending ? t.pendingSync : ''].filter(Boolean).join(' · ')}
            </AppText>
          )}
        </Animated.View>
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
          <PressableScale onPress={send} disabled={sending || !draft.trim()} accessibilityLabel={t.send} scaleTo={0.88} haptic="medium" style={(sending || !draft.trim()) && styles.sendDisabled}>
            <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
              {sending ? <ActivityIndicator color={colors.white} /> : <Send size={20} color={colors.white} />}
            </LinearGradient>
          </PressableScale>
        </View>
      )}
    </View>
  );
}
