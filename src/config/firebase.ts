// src/config/firebase.ts
// ⭐ MISMO proyecto de Firebase que la app web (bdprecise-2d4bc): misma base de
//    datos, mismo Storage y mismos usuarios. Lo que el admin asigna en la web lo
//    ve el empleado aquí al instante, y lo que el empleado hace aquí (Start Job,
//    fotos, notas, Finish) aparece en la web en tiempo real.
//
//    Diferencias con src/config/firebase.ts de la web:
//    · Auth: en React Native no hay IndexedDB, la sesión se guarda en
//      AsyncStorage con getReactNativePersistence → sobrevive a cerrar la app.
//    · Firestore: caché en memoria (persistentLocalCache depende de IndexedDB).
//      Las escrituras sin conexión igual quedan en cola mientras la app está
//      abierta; las FOTOS tienen su propia cola en disco (photoQueue.ts).
//    · Long polling autodetectado: algunas redes móviles bloquean el streaming
//      WebChannel que Firestore usa por defecto.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAU2ZPSROGJcf1NfamG-r5jWiOX13vOoe4',
  authDomain: 'bdprecise-2d4bc.firebaseapp.com',
  projectId: 'bdprecise-2d4bc',
  storageBucket: 'bdprecise-2d4bc.firebasestorage.app',
  messagingSenderId: '697053380036',
  appId: '1:697053380036:web:7343cab6d09ab258557891',
};

// Fast Refresh re-ejecuta este módulo: reutilizar la app/auth ya creadas evita
// el error "Firebase App named '[DEFAULT]' already exists".
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db: Firestore = isFirstInit
  ? initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    })
  : getFirestore(app);

export const storage = getStorage(app);

export default app;
