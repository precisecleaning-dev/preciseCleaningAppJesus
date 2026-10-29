import { onAuthStateChanged, signOut as firebaseSignOut, sendPasswordResetEmail, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { doc, getDocFromServer, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { FormVisibilityConfig, Role, SystemUser } from '../types';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { isDocId, typedCollection } from './firestore';

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());
export const signOut = () => firebaseSignOut(auth);

export type AuthUser = User;

/** Signed-in Firebase user (or null). Fires once with the restored session, then on every sign in/out. */
export const subscribeAuthUser = (onChange: (authUser: AuthUser | null) => void): (() => void) => onAuthStateChanged(auth, onChange);

export const subscribeProfile = (email: string, onData: (user: SystemUser | null) => void, onError: (error: unknown) => void): (() => void) =>
    onSnapshot(
        query(typedCollection<SystemUser>('system_users'), where('email', '==', email), limit(1)),
        (snapshot) => {
            if (!(snapshot.empty && snapshot.metadata.fromCache)) onData(snapshot.docs[0]?.data() ?? null);
        },
        (error) => {
            console.error('Error loading profile:', error);
            onError(error);
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
