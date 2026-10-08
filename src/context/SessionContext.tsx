// src/context/SessionContext.tsx
// ⭐ Sesión del empleado. Misma regla que App.tsx de la web:
//    · Firebase Auth (correo + contraseña) identifica la cuenta.
//    · El perfil se busca en `system_users` por email (en minúsculas).
//    · El rol sale de `settings_roles`; "Administrator" = super admin.
//    · La visibilidad por rol sale de app_settings/houses_form_config
//      (el modal "Field & Button Visibility" de Houses en la web).
//    Así, ocultar un botón o campo para un rol en la web lo oculta también aquí.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../config/firebase';
import type { FormVisibilityConfig, Permission, Role, SystemUser } from '../types';

type SessionState = 'checking' | 'signedOut' | 'loadingProfile' | 'noProfile' | 'inactive' | 'ready';

interface SessionValue {
  state: SessionState;
  /** Roles y "Field & Button Visibility" ya llegaron (de la red o de la copia local). */
  configLoaded: boolean;
  authUser: User | null;
  user: SystemUser | null;
  role: Role | null;
  isSuperAdmin: boolean;
  housesPermission: Permission | undefined;
  /** ¿El elemento (campo/botón/sección) es visible para el rol? Ids = los de HousesView. */
  isElementVisible: (elementId: string) => boolean;
  /** ¿El campo es de solo lectura para el rol? */
  isFieldReadOnly: (fieldId: string) => boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

const CACHE_KEY = 'pc_crew_session_cache_v1';
interface SessionCache {
  email: string;
  user: SystemUser | null;
  roles: Role[];
  formConfig: FormVisibilityConfig;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  // El perfil se guarda junto al email para el que se cargó: al cambiar de
  // cuenta, el perfil anterior deja de valer sin tener que limpiarlo a mano.
  const [profile, setProfile] = useState<{ email: string; user: SystemUser | null } | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [formConfig, setFormConfig] = useState<FormVisibilityConfig | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setAuthUser(u);
        setAuthChecked(true);
      }),
    [],
  );

  // Perfil + roles + configuración de visibilidad: solo con sesión (las reglas
  // de Firestore exigen el token de auth).
  // ⭐ ARRANQUE SIN SEÑAL: Firestore en RN no guarda caché en disco, así que el
  //    último perfil/rol/configuración se guarda en el teléfono. Al abrir la app
  //    sin internet se usa esa copia (y se reemplaza en cuanto llega la real).
  //    Un resultado VACÍO que viene de caché (sin servidor) no se toma como
  //    "usuario no registrado": solo el servidor puede decir eso.
  useEffect(() => {
    if (!authUser?.email) return;
    const email = authUser.email.toLowerCase().trim();
    let live = false;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        const c = raw ? (JSON.parse(raw) as SessionCache) : null;
        if (!c || c.email !== email || live) return;
        setProfile((p) => (p && p.email === email ? p : { email, user: c.user }));
        setRoles((r) => r ?? c.roles);
        setFormConfig((f) => f ?? c.formConfig);
      })
      .catch(() => undefined);
    const unsubs = [
      onSnapshot(
        query(collection(db, 'system_users'), where('email', '==', email), limit(1)),
        (snap) => {
          if (snap.empty && snap.metadata.fromCache) return;
          live = true;
          const d = snap.docs[0];
          setProfile({ email, user: d ? ({ ...d.data(), id: d.id } as SystemUser) : null });
        },
        (err) => {
          console.error('Error cargando perfil:', err);
          setProfile({ email, user: null });
        },
      ),
      onSnapshot(
        collection(db, 'settings_roles'),
        (snap) => {
          if (snap.empty && snap.metadata.fromCache) return;
          setRoles(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Role));
        },
        (err) => {
          console.error('Error cargando roles:', err);
          setRoles((r) => r ?? []);
        },
      ),
      onSnapshot(
        doc(db, 'app_settings', 'houses_form_config'),
        (snap) => {
          if (!snap.exists() && snap.metadata.fromCache) return;
          setFormConfig(snap.exists() ? (snap.data() as FormVisibilityConfig) : {});
        },
        (err) => {
          console.error('Error cargando houses_form_config:', err);
          setFormConfig((f) => f ?? {});
        },
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authUser]);

  // Guardar la copia local cada vez que cambia algo real.
  useEffect(() => {
    const email = authUser?.email?.toLowerCase().trim();
    if (!email || profile?.email !== email || !profile.user || !roles || !formConfig) return;
    const cache: SessionCache = { email, user: profile.user, roles, formConfig };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => undefined);
  }, [authUser, profile, roles, formConfig]);

  const value = useMemo<SessionValue>(() => {
    const email = authUser?.email?.toLowerCase().trim() || '';
    const profileLoaded = !!email && profile?.email === email;
    const user = profileLoaded ? profile.user : null;
    const role = user ? (roles || []).find((r) => r.id === user.roleId) ?? null : null;
    const config = formConfig || {};
    const isSuperAdmin = role?.name === 'Administrator';
    const housesPermission = role?.permissions?.find((p) => p.module === 'Houses');

    let state: SessionState;
    if (!authChecked) state = 'checking';
    else if (!authUser) state = 'signedOut';
    else if (!profileLoaded) state = 'loadingProfile';
    else if (!user) state = 'noProfile';
    else if (user.status === 'Inactive') state = 'inactive';
    else state = 'ready';

    return {
      state,
      configLoaded: roles !== null && formConfig !== null,
      authUser,
      user,
      role,
      isSuperAdmin,
      housesPermission,
      isElementVisible: (elementId) => {
        if (isSuperAdmin || !user?.roleId) return true;
        return !(config.visibility?.[elementId] || []).includes(user.roleId);
      },
      isFieldReadOnly: (fieldId) => {
        if (isSuperAdmin) return false;
        if (housesPermission?.readOnlyFields?.includes(fieldId)) return true;
        return !!user?.roleId && (config.readOnly?.[fieldId] || []).includes(user.roleId);
      },
      signOut: () => fbSignOut(auth),
    };
  }, [authChecked, authUser, profile, roles, formConfig]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}

/** Atajo para pantallas que solo se montan con sesión lista. */
export function useCurrentUser(): SystemUser {
  const { user } = useSession();
  if (!user) throw new Error('useCurrentUser requiere una sesión lista');
  return user;
}
