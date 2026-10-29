import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { buildTaskAssignedEmail } from './emails';
import { SMTP_SECRETS } from './mailer';
import { deliverOnce } from './notificationLog';
import { recipientOf } from './recipients';
import { newlyAssignedUserIds, type TaskDoc } from './taskEvents';

// Optional link in the emails (functions/.env → APP_URL). Without it, the email just says to open the app.
const appUrl = () => process.env.APP_URL?.trim() ?? '';

// Runs for every write to a task, from the web or the phone: the apps don't send anything themselves.
export const notifyontaskwrite = onDocumentWritten({ document: 'user_tasks/{taskId}', region: 'us-central1', secrets: SMTP_SECRETS }, async (event) => {
    const before = event.data?.before?.exists ? (event.data.before.data() as TaskDoc) : null;
    const after = event.data?.after?.exists ? (event.data.after.data() as TaskDoc) : null;
    const { taskId } = event.params;

    const newAssigneeIds = newlyAssignedUserIds(before, after);
    if (!after || newAssigneeIds.length === 0) return;

    await Promise.all(
        newAssigneeIds.map(async (userId) => {
            const recipient = await recipientOf(userId);
            if (!recipient) {
                logger.info(`Task ${taskId}: user ${userId} has no active profile with an email, no notification.`);
                return;
            }
            await deliverOnce({
                notificationId: `${event.id}_task_assigned_${userId}`,
                kind: 'task_assigned',
                recipient,
                email: buildTaskAssignedEmail({ task: after, recipientName: recipient.name, appUrl: appUrl() }),
                taskId,
            });
        }),
    );
});
