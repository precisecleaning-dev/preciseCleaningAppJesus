import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { auth } from '../config/firebase';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { resetCustomers } from '../services/customersService';
import { loadFormConfig, signOut, subscribeProfile, subscribeRole } from '../services/sessionService';
import type { FormVisibilityConfig, Permission, Role, SystemUser } from '../types';
import { clearMemoryCache } from '../utils/memoryCache';
import { isAdministratorRole } from '../utils/roles';

type SessionState = 'checking' | 'signedOut' | 'loadingProfile' | 'signingOut' | 'noProfile' | 'inactive' | 'noRole' | 'roleError' | 'ready';

type RoleStatus = 'loading' | 'ready' | 'missing' | 'error';

interface SessionValue {
    state: SessionState;
    configLoaded: boolean;
    authUser: User | null;
    user: SystemUser | null;
    role: Role | null;
    isSuperAdmin: boolean;
    housesPermission: Permission | undefined;
    isElementVisible: (elementId: string) => boolean;
    isFieldReadOnly: (fieldId: string) => boolean;
    retryRole: () => void;
    signOut: () => void;
}

interface SessionCache {
    email: string;
    user: SystemUser | null;
    roles: Role[];
    formConfig: FormVisibilityConfig;
}

interface RoleSnapshot {
    roleId: string;
    role: Role | null;
}

interface SessionProviderProps {
    children: ReactNode;
}

const CACHE_KEY = 'pc_crew_session_cache_v1';
const LOADING_MIN_MS = 1200;
const waitMinimumLoading = () => new Promise((resolve) => setTimeout(resolve, LOADING_MIN_MS));
const SessionContext = createContext<SessionValue | null>(null);

const roleStatusOf = (roleId: string, roleSnapshot: RoleSnapshot | null, failedRoleId: string | null): RoleStatus => {
    if (!roleId) return 'missing';
    if (roleSnapshot?.roleId === roleId) return roleSnapshot.role ? 'ready' : 'missing';
    if (failedRoleId === roleId) return 'error';
    return 'loading';
};

export const SessionProvider = ({ children }: SessionProviderProps) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [signingIn, setSigningIn] = useState(false);
    const lastLogin = useRef<symbol | null>(null);
    const [profile, setProfile] = useState<{ email: string; user: SystemUser | null } | null>(null);
    const [roleSnapshot, setRoleSnapshot] = useState<RoleSnapshot | null>(null);
    const [failedRoleId, setFailedRoleId] = useState<string | null>(null);
    const [roleSubscriptionKey, setRoleSubscriptionKey] = useState(0);
    const [formConfig, setFormConfig] = useState<FormVisibilityConfig | null>(null);

    const email = authUser?.email?.toLowerCase().trim() || '';
    const profileLoaded = !!email && profile?.email === email;
    const user = profileLoaded ? profile.user : null;
    const roleId = user?.roleId ?? '';

    useEffect(() => {
        let checked = false;
        return onAuthStateChanged(auth, (firebaseUser) => {
            if (checked && firebaseUser) {
                const login = Symbol('login');
                lastLogin.current = login;
                setSigningIn(true);
                waitMinimumLoading().then(() => {
                    if (lastLogin.current === login) setSigningIn(false);
                });
            }
            checked = true;
            setAuthUser(firebaseUser);
            setAuthChecked(true);
        });
    }, []);

    useEffect(() => {
        if (!email) return;
        let isLive = false;
        AsyncStorage.getItem(CACHE_KEY)
            .then((rawCache) => {
                const cache = rawCache ? (JSON.parse(rawCache) as SessionCache) : null;
                if (!cache || cache.email !== email || isLive) return;
                setProfile((current) => (current?.email === email ? current : { email, user: cache.user }));
                const cachedRole = cache.user ? cache.roles.find((role) => role.id === cache.user?.roleId) : undefined;
                if (cachedRole) setRoleSnapshot((current) => current ?? { roleId: cachedRole.id, role: cachedRole });
                setFormConfig((current) => current ?? cache.formConfig);
            })
            .catch(() => undefined);
        return subscribeProfile(email, (profileUser) => {
            isLive = true;
            setProfile({ email, user: profileUser });
        });
    }, [email]);

    useEffect(() => {
        if (!roleId) return;
        return subscribeRole(
            roleId,
            (role) => {
                setFailedRoleId(null);
                setRoleSnapshot({ roleId, role });
            },
            (error) => {
                console.error('Error loading role:', error);
                setFailedRoleId(roleId);
            },
        );
    }, [roleId, roleSubscriptionKey]);

    useWhenOnline(() => {
        loadFormConfig()
            .then(setFormConfig)
            .catch((error) => {
                console.error('Error loading houses_form_config:', error);
                setFormConfig((current) => current ?? {});
            });
    }, !!email);

    const roleStatus = roleStatusOf(roleId, roleSnapshot, failedRoleId);
    const role = roleStatus === 'ready' ? (roleSnapshot?.role ?? null) : null;

    useEffect(() => {
        if (!email || !user || !role || !formConfig) return;
        const cache: SessionCache = { email, user, roles: [role], formConfig };
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => undefined);
    }, [email, user, role, formConfig]);

    const isSuperAdmin = isAdministratorRole(role);
    const housesPermission = role?.permissions?.find((permission) => permission.module === 'Houses');

    let state: SessionState = 'ready';
    if (!authChecked) state = 'checking';
    else if (signingOut) state = 'signingOut';
    else if (!authUser) state = 'signedOut';
    else if (!profileLoaded || signingIn) state = 'loadingProfile';
    else if (!user) state = 'noProfile';
    else if (user.status === 'Inactive') state = 'inactive';
    else if (roleStatus === 'loading') state = 'loadingProfile';
    else if (roleStatus === 'missing') state = 'noRole';
    else if (roleStatus === 'error') state = 'roleError';

    const value: SessionValue = {
        state,
        configLoaded: roleStatus === 'ready' && formConfig !== null,
        authUser,
        user,
        role,
        isSuperAdmin,
        housesPermission,
        isElementVisible: (elementId) => isSuperAdmin || !(formConfig?.visibility?.[elementId] || []).includes(roleId),
        isFieldReadOnly: (fieldId) => !isSuperAdmin && (!!housesPermission?.readOnlyFields?.includes(fieldId) || (formConfig?.readOnly?.[fieldId] || []).includes(roleId)),
        retryRole: () => {
            setFailedRoleId(null);
            setRoleSubscriptionKey((key) => key + 1);
        },
        signOut: () => {
            setSigningOut(true);
            clearMemoryCache();
            resetCustomers();
            Promise.all([signOut(), waitMinimumLoading()])
                .catch((error) => console.error('Error signing out:', error))
                .then(() => setSigningOut(false));
        },
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionValue => {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used inside <SessionProvider>');
    return context;
};

export const useCurrentUser = (): SystemUser => {
    const { user } = useSession();
    if (!user) throw new Error('useCurrentUser requires a ready session');
    return user;
};
