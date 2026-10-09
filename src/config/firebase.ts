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

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = isFirstInit ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }) : getAuth(app);

export const db: Firestore = isFirstInit
  ? initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    })
  : getFirestore(app);

export const storage = getStorage(app);
