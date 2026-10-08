// src/components/NoteThread.tsx
// ⭐ Hilo de notas, mismo modelo que NoteThread.tsx de la web: cada entrada de
//    `notesHistory` del campo es un mensaje; si la casa tiene texto pero no
//    historial (casas viejas / importadas de AppSheet), ese texto se muestra
//    como un primer mensaje.
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/tokens';
import type { NoteHistoryEntry } from '../types';
import { formatDateTime } from '../utils/dateFormat';
import { styles } from './NoteThread.styles';
import { ui } from './ui.styles';

interface Props {
  title: string;
  field: NoteHistoryEntry['field'];
  legacyText: string;
  history: NoteHistoryEntry[];
  /** Notas del empleado aún en la cola (sin señal). */
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
  // Una nota pendiente que ya llegó al servidor aparece en `history`: no se repite.
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
      <Text style={styles.title}>{title}</Text>
      {messages.length === 0 && <Text style={ui.muted}>—</Text>}
      {messages.map((m) => (
        <View key={m.key} style={[styles.bubble, m.mine && styles.bubbleMine, m.pending && styles.bubblePending]}>
          <Text style={styles.text}>{m.text}</Text>
          {(m.author || m.at) && (
            <Text style={styles.meta}>
              {[m.author, formatDateTime(m.at), m.pending ? t.pendingSync : ''].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
      ))}
      {canWrite && onSend && (
        <View style={styles.composer}>
          <TextInput
            style={[ui.input, styles.input]}
            value={draft}
            onChangeText={setDraft}
            placeholder={t.writeNote}
            placeholderTextColor={colors.textSoft}
            multiline
          />
          <Pressable
            onPress={send}
            disabled={sending || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel={t.send}
            style={({ pressed }) => [styles.sendBtn, (sending || !draft.trim()) && styles.sendDisabled, pressed && styles.sendPressed]}
          >
            {sending ? <ActivityIndicator color={colors.white} /> : <Send size={20} color={colors.white} />}
          </Pressable>
        </View>
      )}
    </View>
  );
}
