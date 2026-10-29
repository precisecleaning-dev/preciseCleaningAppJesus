import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import type { EmailContent } from './emails';
import { sendEmail } from './mailer';
import type { Recipient } from './recipients';

export type NotificationKind = 'task_assigned' | 'project_assigned' | 'approval_requested' | 'approval_decided';

export interface NotificationRequest {
    /** Fixed per event and person: a retried event finds it and does not send twice. */
    notificationId: string;
    kind: NotificationKind;
    recipient: Recipient;
    email: EmailContent;
    taskId?: string;
    projectId?: string;
}

const NOTIFICATIONS_COLLECTION = 'task_notifications';
const GRPC_ALREADY_EXISTS = 6;

const isAlreadyExists = (error: unknown): boolean => {
    const code = (error as { code?: unknown })?.code;
    return code === GRPC_ALREADY_EXISTS || code === 'already-exists';
};

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Records the notification in task_notifications and sends it, once. The record is the history of what
 * was sent (state SENT / ERROR with the reason), so a failure is visible without opening the logs.
 */
export const deliverOnce = async ({ notificationId, kind, recipient, email, taskId, projectId }: NotificationRequest): Promise<void> => {
    const record = getFirestore().collection(NOTIFICATIONS_COLLECTION).doc(notificationId);
    try {
        await record.create({
            kind,
            taskId: taskId ?? null,
            projectId: projectId ?? null,
            recipientUserId: recipient.userId,
            to: recipient.email,
            subject: email.subject,
            state: 'SENDING',
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        if (isAlreadyExists(error)) {
            logger.info(`Notification ${notificationId} already handled, skipping.`);
            return;
        }
        throw error;
    }

    try {
        const messageId = await sendEmail(recipient.email, email);
        await record.update({ state: 'SENT', sentAt: new Date().toISOString(), messageId });
        logger.info(`Email "${kind}" sent to user ${recipient.userId}.`);
    } catch (error) {
        await record.update({ state: 'ERROR', failedAt: new Date().toISOString(), error: messageOf(error) });
        logger.error(`Email "${kind}" to user ${recipient.userId} failed: ${messageOf(error)}`);
    }
};
