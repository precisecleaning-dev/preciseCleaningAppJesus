import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTaskAssignedEmail, escapeHtml, formatDue } from '../emails';

test('formats due dates like the app', () => {
    assert.equal(formatDue('2026-10-28', '14:05'), '10/28/2026 at 2:05 PM');
    assert.equal(formatDue('2026-10-28', '00:30'), '10/28/2026 at 12:30 AM');
    assert.equal(formatDue('2026-10-28', ''), '10/28/2026');
    assert.equal(formatDue('', '09:00'), 'No due date');
});

test('escapes HTML from Firestore', () => {
    assert.equal(escapeHtml('<b>"Tom" & \'Jerry\'</b>'), '&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;');
});

test('task assigned email', () => {
    const email = buildTaskAssignedEmail({
        task: { title: 'Fix <script>', dueDate: '2026-10-30', dueTime: '09:00', projectTitle: 'Fall campaign', createdByUserName: 'Omar' },
        recipientName: 'Ana',
        appUrl: '',
    });
    assert.equal(email.subject, 'New task: Fix <script>');
    assert.ok(email.html.includes('Fix &lt;script&gt;'));
    assert.ok(!email.html.includes('<script>'));
    assert.ok(email.html.includes('10/30/2026 at 9:00 AM'));
    assert.ok(email.html.includes('Fall campaign'));
    assert.ok(!email.html.includes('Open Precise Cleaning'), 'no button without APP_URL');
    assert.ok(email.text.includes('Created by: Omar'));
});

test('subject is always a single line and the button appears with APP_URL', () => {
    const email = buildTaskAssignedEmail({ task: { title: 'Line one\r\nBcc: someone@else.com' }, recipientName: 'Ana', appUrl: 'https://example.com' });
    assert.equal(email.subject, 'New task: Line one Bcc: someone@else.com');
    assert.ok(email.html.includes('href="https://example.com"'));
});
