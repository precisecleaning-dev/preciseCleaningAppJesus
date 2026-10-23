import { t } from '../constants/strings';
import type { NoteHistoryEntry } from '../types';
import MessageThread, { type ThreadMessage } from './MessageThread';

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

const NoteThread = ({ title, field, legacyText, history, pending = [], myEmail, canWrite, onSend }: Props) => {
    const entries = history.filter((entry) => entry.field === field && String(entry.text || '').trim() !== '');
    const myNormalizedEmail = myEmail.toLowerCase();
    const savedMessages: ThreadMessage[] =
        entries.length > 0
            ? entries.map((entry, index) => {
                  const authorEmail = String(entry.user || '');
                  return {
                      key: `${entry.at}-${index}`,
                      text: entry.text,
                      isMine: authorEmail.toLowerCase() === myNormalizedEmail,
                      author: authorEmail.split('@')[0],
                      at: entry.at,
                  };
              })
            : legacyText.trim()
              ? [{ key: 'legacy', text: legacyText.trim(), isMine: false, author: '', at: '' }]
              : [];
    const savedKeys = new Set(entries.map((entry) => `${entry.at}|${entry.text}`));
    const pendingMessages: ThreadMessage[] = pending
        .filter((entry) => entry.field === field && !savedKeys.has(`${entry.at}|${entry.text}`))
        .map((entry) => ({ key: `p-${entry.at}`, text: entry.text, isMine: true, author: '', at: entry.at, isPending: true }));

    return (
        <MessageThread
            title={title}
            messages={[...savedMessages, ...pendingMessages]}
            emptyText="—"
            placeholder={t.writeNote}
            canWrite={canWrite}
            onSend={
                onSend
                    ? (text) => {
                          onSend(text);
                          return Promise.resolve(true);
                      }
                    : undefined
            }
        />
    );
};

export default NoteThread;
