// Pure email templates (English, like the app). Inline styles only: email clients ignore <style>.
import type { TaskDoc } from './taskEvents';

export interface EmailContent {
    subject: string;
    html: string;
    text: string;
}

interface DetailRow {
    label: string;
    value: string;
}

interface EmailLayout {
    preheader: string;
    heading: string;
    intro: string;
    rows: DetailRow[];
    footer: string;
    appUrl: string;
}

// Brand colors from src/theme/tokens.ts of the app.
const BRAND = '#1570EF';
const INK = '#0B1B33';
const MUTED = '#64748B';
const LINE = '#E6EBF2';
const CANVAS = '#F4F7FC';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Everything that comes from Firestore is escaped: a task title must never become HTML. */
export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

/** "2026-10-28" → "10/28/2026" (the app's MM/DD/YYYY). Anything else is shown as it came. */
export const formatDate = (ymd: string): string => {
    const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[2]}/${match[3]}/${match[1]}` : ymd;
};

/** "14:05" → "2:05 PM". */
export const formatTime = (hhmm: string): string => {
    const match = hhmm.match(/^(\d{2}):(\d{2})$/);
    if (!match) return hhmm;
    const hours = Number(match[1]);
    return `${hours % 12 || 12}:${padTwoDigits(Number(match[2]))} ${hours < 12 ? 'AM' : 'PM'}`;
};

export const formatDue = (dueDate?: string, dueTime?: string): string => {
    if (!dueDate) return 'No due date';
    return dueTime ? `${formatDate(dueDate)} at ${formatTime(dueTime)}` : formatDate(dueDate);
};

const renderRows = (rows: DetailRow[]): string =>
    rows
        .map(
            (row) =>
                `<tr><td style="padding:8px 0;color:${MUTED};font-size:13px;width:120px;vertical-align:top;">${escapeHtml(row.label)}</td>` +
                `<td style="padding:8px 0;color:${INK};font-size:15px;">${escapeHtml(row.value)}</td></tr>`,
        )
        .join('');

const renderButton = (appUrl: string): string =>
    appUrl
        ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:${BRAND};color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:15px;">Open Precise Cleaning</a></p>`
        : '';

const renderHtml = ({ preheader, heading, intro, rows, footer, appUrl }: EmailLayout): string =>
    `<!doctype html><html><body style="margin:0;padding:0;background:${CANVAS};font-family:Arial,Helvetica,sans-serif;">` +
    `<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 12px;"><tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;border:1px solid ${LINE};">` +
    `<tr><td style="background:${BRAND};border-radius:16px 16px 0 0;padding:18px 24px;color:#FFFFFF;font-size:16px;">Precise Cleaning</td></tr>` +
    `<tr><td style="padding:24px;">` +
    `<h1 style="margin:0 0 8px;color:${INK};font-size:20px;">${escapeHtml(heading)}</h1>` +
    `<p style="margin:0 0 16px;color:${MUTED};font-size:15px;line-height:1.5;">${escapeHtml(intro)}</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">${renderRows(rows)}</table>` +
    renderButton(appUrl) +
    `</td></tr></table>` +
    `<p style="max-width:560px;margin:16px auto 0;color:${MUTED};font-size:12px;line-height:1.5;">${escapeHtml(footer)}</p>` +
    `</td></tr></table></body></html>`;

const renderText = ({ heading, intro, rows, footer, appUrl }: EmailLayout): string =>
    [heading, '', intro, '', ...rows.map((row) => `${row.label}: ${row.value}`), ...(appUrl ? ['', appUrl] : []), '', footer].join('\n');

// A line break in a header could inject other headers: the subject is always one line.
const buildEmail = (subject: string, layout: EmailLayout): EmailContent => ({ subject: subject.replace(/[\r\n]+/g, ' '), html: renderHtml(layout), text: renderText(layout) });

const taskTitleOf = (task: TaskDoc): string => task.title?.trim() || 'Untitled task';

export interface TaskAssignedEmailInput {
    task: TaskDoc;
    recipientName: string;
    appUrl: string;
}

export const buildTaskAssignedEmail = ({ task, recipientName, appUrl }: TaskAssignedEmailInput): EmailContent => {
    const title = taskTitleOf(task);
    const rows: DetailRow[] = [
        { label: 'Task', value: title },
        { label: 'Due', value: formatDue(task.dueDate, task.dueTime) },
        ...(task.projectTitle ? [{ label: 'Project', value: task.projectTitle }] : []),
        ...(task.createdByUserName ? [{ label: 'Created by', value: task.createdByUserName }] : []),
    ];
    return buildEmail(`New task: ${title}`, {
        preheader: `You have a new task: ${title}`,
        heading: 'You have a new task',
        intro: `Hi ${recipientName}, a task was assigned to you.`,
        rows,
        footer: 'You received this email because a task was assigned to you in Precise Cleaning. Open the app to see the details.',
        appUrl,
    });
};
