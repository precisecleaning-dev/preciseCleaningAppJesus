import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../config/firebase';
import { useWhenOnline } from '../hooks/useWhenOnline';
import { resetCustomers } from '../services/customersService';
import { loadFormConfig, loadRoles, signOut, subscribeProfile } from '../services/sessionService';
import type { FormVisibilityConfig, Permission, Role, SystemUser } from '../types';
import { clearMemoryCache } from '../utils/memoryCache';

type SessionState = 'checking' | 'signedOut' | 'loadingProfile' | 'signingOut' | 'noProfile' | 'inactive' | 'ready';

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
  signOut: () => void;
}

interface SessionCache {
  email: string;
  user: SystemUser | null;
  roles: Role[];
  formConfig: FormVisibilityConfig;
}

const CACHE_KEY = 'pc_crew_session_cache_v1';
const LOADING_MIN_MS = 1200;
const minDelay = () => new Promise((resolve) => setTimeout(resolve, LOADING_MIN_MS));
const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [profile, setProfile] = useState<{ email: string; user: SystemUser | null } | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [formConfig, setFormConfig] = useState<FormVisibilityConfig | null>(null);

  const email = authUser?.email?.toLowerCase().trim() || '';

  useEffect(() => {
    let checked = false;
    return onAuthStateChanged(auth, (u) => {
      if (checked && u) {
        setSigningIn(true);
        minDelay().then(() => setSigningIn(false));
      }
      checked = true;
      setAuthUser(u);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!email) return;
    let live = false;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        const c = raw ? (JSON.parse(raw) as SessionCache) : null;
        if (!c || c.email !== email || live) return;
        setProfile((p) => (p?.email === email ? p : { email, user: c.user }));
        setRoles((r) => r ?? c.roles);
        setFormConfig((f) => f ?? c.formConfig);
      })
      .catch(() => undefined);
    return subscribeProfile(email, (user) => {
      live = true;
      setProfile({ email, user });
    });
  }, [email]);

  useWhenOnline(() => {
    loadRoles()
      .then(setRoles)
      .catch((err) => console.error('Error cargando roles:', err));
    loadFormConfig()
      .then(setFormConfig)
      .catch((err) => console.error('Error cargando houses_form_config:', err));
  }, !!email);

  useEffect(() => {
    if (!email || profile?.email !== email || !profile.user || !roles || !formConfig) return;
    const cache: SessionCache = { email, user: profile.user, roles, formConfig };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => undefined);
  }, [email, profile, roles, formConfig]);

  const profileLoaded = !!email && profile?.email === email;
  const user = profileLoaded ? profile.user : null;
  const role = user ? ((roles || []).find((r) => r.id === user.roleId) ?? null) : null;
  const isSuperAdmin = role?.name === 'Administrator';
  const housesPermission = role?.permissions?.find((p) => p.module === 'Houses');
  const roleId = user?.roleId;

  let state: SessionState = 'ready';
  if (!authChecked) state = 'checking';
  else if (signingOut) state = 'signingOut';
  else if (!authUser) state = 'signedOut';
  else if (!profileLoaded || signingIn) state = 'loadingProfile';
  else if (!user) state = 'noProfile';
  else if (user.status === 'Inactive') state = 'inactive';

  const value: SessionValue = {
    state,
    configLoaded: roles !== null && formConfig !== null,
    authUser,
    user,
    role,
    isSuperAdmin,
    housesPermission,
    isElementVisible: (id) => isSuperAdmin || !roleId || !(formConfig?.visibility?.[id] || []).includes(roleId),
    isFieldReadOnly: (id) => !isSuperAdmin && (!!housesPermission?.readOnlyFields?.includes(id) || (!!roleId && (formConfig?.readOnly?.[id] || []).includes(roleId))),
    signOut: () => {
      setSigningOut(true);
      clearMemoryCache();
      resetCustomers();
      Promise.all([signOut(), minDelay()])
        .catch((err) => console.error('Error cerrando sesión:', err))
        .then(() => setSigningOut(false));
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}

export function useCurrentUser(): SystemUser {
  const { user } = useSession();
  if (!user) throw new Error('useCurrentUser requiere una sesión lista');
  return user;
}
