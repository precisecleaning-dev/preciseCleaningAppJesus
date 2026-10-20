import { signOut as fbSignOut, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDocFromServer, getDocsFromServer, limit, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { FormVisibilityConfig, Role, SystemUser } from '../types';
import { cached, CONFIG_TTL } from '../utils/memoryCache';
import { typedCollection } from './firestore';

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());
export const signOut = () => fbSignOut(auth);

export function subscribeProfile(email: string, onData: (u: SystemUser | null) => void): () => void {
    return onSnapshot(
        query(typedCollection<SystemUser>('system_users'), where('email', '==', email), limit(1)),
        (snap) => {
            if (!(snap.empty && snap.metadata.fromCache)) onData(snap.docs[0]?.data() ?? null);
        },
        (err) => {
            console.error('Error cargando perfil:', err);
            onData(null);
        },
    );
}

export const loadRoles = () => cached('session:roles', CONFIG_TTL, async () => (await getDocsFromServer(typedCollection<Role>('settings_roles'))).docs.map((d) => d.data()));

export const loadFormConfig = () =>
    cached('session:form_config', CONFIG_TTL, async () => ((await getDocFromServer(doc(db, 'app_settings', 'houses_form_config'))).data() ?? {}) as FormVisibilityConfig);
