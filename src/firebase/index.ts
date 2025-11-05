'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    
    // The FIREBASE_CONFIG env var is set automatically by App Hosting.
    // If it's not set, we're not in an App Hosting environment, so we should
    // use the config object from the code.
    if (!process.env.FIREBASE_CONFIG) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        // If it is set, we can try to initialize with no arguments.
        try {
            firebaseApp = initializeApp();
        } catch (e) {
            console.warn('Automatic initialization failed, falling back to firebase config object.', e);
            firebaseApp = initializeApp(firebaseConfig);
        }
    }
    
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
