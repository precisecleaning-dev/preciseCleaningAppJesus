// src/context/SessionContext.tsx
// ⭐ Sesión del empleado. Misma regla que App.tsx de la web:
//    · Firebase Auth (correo + contraseña) identifica la cuenta.
//    · El perfil se busca en `system_users` por email (en minúsculas).
//    · El rol sale de `settings_roles`; "Administrator" = super admin.
//    · La visibilidad por rol sale de app_settings/houses_form_config
//      (el modal "Field & Button Visibility" de Houses en la web).
//    Así, ocultar un botón o campo para un rol en la web lo oculta también aquí.
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, db } from '../config/firebase';
import type { FormVisibilityConfig, Permission, Role, SystemUser } from '../types';

type SessionState = 'checking' | 'signedOut' | 'loadingProfile' | 'noProfile' | 'inactive' | 'ready';

interface SessionValue {
  state: SessionState;
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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  // El perfil se guarda junto al email para el que se cargó: al cambiar de
  // cuenta, el perfil anterior deja de valer sin tener que limpiarlo a mano.
  const [profile, setProfile] = useState<{ email: string; user: SystemUser | null } | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formConfig, setFormConfig] = useState<FormVisibilityConfig>({});

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
  useEffect(() => {
    if (!authUser?.email) return;
    const email = authUser.email.toLowerCase().trim();
    const unsubs = [
      onSnapshot(
        query(collection(db, 'system_users'), where('email', '==', email), limit(1)),
        (snap) => {
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
        (snap) => setRoles(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Role)),
        (err) => console.error('Error cargando roles:', err),
      ),
      onSnapshot(
        doc(db, 'app_settings', 'houses_form_config'),
        (snap) => setFormConfig(snap.exists() ? (snap.data() as FormVisibilityConfig) : {}),
        (err) => console.error('Error cargando houses_form_config:', err),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [authUser]);

  const value = useMemo<SessionValue>(() => {
    const email = authUser?.email?.toLowerCase().trim() || '';
    const profileLoaded = !!email && profile?.email === email;
    const user = profileLoaded ? profile.user : null;
    const role = user ? roles.find((r) => r.id === user.roleId) ?? null : null;
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
      authUser,
      user,
      role,
      isSuperAdmin,
      housesPermission,
      isElementVisible: (elementId) => {
        if (isSuperAdmin || !user?.roleId) return true;
        return !(formConfig.visibility?.[elementId] || []).includes(user.roleId);
      },
      isFieldReadOnly: (fieldId) => {
        if (isSuperAdmin) return false;
        if (housesPermission?.readOnlyFields?.includes(fieldId)) return true;
        return !!user?.roleId && (formConfig.readOnly?.[fieldId] || []).includes(user.roleId);
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
