'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, doc } from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

let authPromise: Promise<Auth> | null = null;

async function getInitializedAuth(app: FirebaseApp): Promise<Auth> {
  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  if (!authPromise) {
    authPromise = getInitializedAuth(app);
  }

  return {
    firebaseApp: app,
    authPromise: authPromise,
    firestore: getFirestore(app),
    storage: getStorage(app),
    messaging: typeof window !== 'undefined' ? getMessaging(app) : null,
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';