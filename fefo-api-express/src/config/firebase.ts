import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let db: FirebaseFirestore.Firestore;

/**
 * Initializes Firebase Admin SDK.
 * Priority for credentials:
 * 1. Service account file pointed by GOOGLE_APPLICATION_CREDENTIALS
 * 2. Service account JSON placed at ./firebase-service-account.json
 * 3. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 */
export const initializeFirebase = (): FirebaseFirestore.Firestore => {
  if (db) return db;

  try {
    // 1) GOOGLE_APPLICATION_CREDENTIALS
    const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (gacPath && fs.existsSync(gacPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(gacPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
      db = admin.firestore();
      console.log('✅ Firebase initialized using GOOGLE_APPLICATION_CREDENTIALS');
      return db;
    }

    // 2) Local service account file inside project
    const localPath = path.join(process.cwd(), 'fefo-api-express', 'firebase-service-account.json');
    if (fs.existsSync(localPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
      db = admin.firestore();
      console.log('✅ Firebase initialized using local firebase-service-account.json');
      return db;
    }

    // 3) Environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase credentials not provided. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_* env vars.');
    }

    // If privateKey contains literal \n sequences, replace them with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccount = {
      projectId,
      privateKey,
      clientEmail,
    } as any;

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    console.log('✅ Firebase initialized using environment variables');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

export const getFirebaseDB = (): FirebaseFirestore.Firestore => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return db;
};

export const getFirebaseAuth = () => {
  return admin.auth();
};
