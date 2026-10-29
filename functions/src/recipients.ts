import { getFirestore } from 'firebase-admin/firestore';

export interface Recipient {
    userId: string;
    name: string;
    email: string;
}

interface SystemUserDoc {
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: string;
}

const EMAIL_PATTERN = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

/** The person's profile in system_users (the ids in tasks are its document ids). Inactive users get no email. */
export const recipientOf = async (userId: string): Promise<Recipient | null> => {
    if (!userId || userId.includes('/')) return null;
    const snapshot = await getFirestore().collection('system_users').doc(userId).get();
    const user = snapshot.data() as SystemUserDoc | undefined;
    if (!user || user.status === 'Inactive') return null;
    const email = String(user.email ?? '')
        .trim()
        .toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return null;
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return { userId, name: name || email, email };
};
