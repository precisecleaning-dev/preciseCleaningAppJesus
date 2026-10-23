import { signOut as firebaseSignOut, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDocFromServer, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { FormVisibilityConfig, Role, SystemUser } from '../types';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { isDocId, typedCollection } from './firestore';

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());
export const signOut = () => firebaseSignOut(auth);

export const subscribeProfile = (email: string, onData: (user: SystemUser | null) => void): (() => void) =>
    onSnapshot(
        query(typedCollection<SystemUser>('system_users'), where('email', '==', email), limit(1)),
        (snapshot) => {
            if (!(snapshot.empty && snapshot.metadata.fromCache)) onData(snapshot.docs[0]?.data() ?? null);
        },
        (error) => {
            console.error('Error loading profile:', error);
            onData(null);
        },
    );

export const subscribeRole = (roleId: string, onData: (role: Role | null) => void, onError: (error: unknown) => void): (() => void) => {
    if (!isDocId(roleId)) {
        onData(null);
        return () => undefined;
    }
    return onSnapshot(
        doc(typedCollection<Role>('settings_roles'), roleId),
        (snapshot) => {
            if (!snapshot.exists() && snapshot.metadata.fromCache) return;
            onData(snapshot.exists() ? snapshot.data() : null);
        },
        onError,
    );
};

export const loadFormConfig = () =>
    cached('session:form_config', CONFIG_TTL, async () => ((await getDocFromServer(doc(db, 'app_settings', 'houses_form_config'))).data() ?? {}) as FormVisibilityConfig);
