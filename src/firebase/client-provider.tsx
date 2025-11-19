'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { Auth } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [auth, setAuth] = useState<Auth | null>(null);

  const { firebaseApp, authPromise, firestore, storage, messaging } = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    authPromise.then(authInstance => {
      setAuth(authInstance);
    });
  }, [authPromise]);

  if (!auth) {
    // Вы можете показать здесь скелет загрузки или просто null
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      storage={storage}
      messaging={messaging}
    >
      {children}
    </FirebaseProvider>
  );
}