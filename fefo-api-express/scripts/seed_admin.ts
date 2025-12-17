
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Parse .env from project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedAdmin() {
    console.log('🚀 Starting admin seed script...');

    // Initialize Firebase Admin (check if already initialized to avoid errors)
    if (getApps().length === 0) {
        try {
            const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
                ? {
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }
                : require('../serviceAccountKey.json'); // Fallback if env var not set properly

            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('✅ Firebase initialized');
        } catch (error: any) {
            console.error('❌ Failed to initialize Firebase:', error.message);
            process.exit(1);
        }
    }

    const auth = getAuth();
    const db = getFirestore();
    const usersCollection = db.collection('users');

    try {
        console.log('📥 Fetching all users from Firebase Auth...');
        const listUsersResult = await auth.listUsers(100); // Batch size 100
        const users = listUsersResult.users;

        if (users.length === 0) {
            console.log('⚠️ No users found in Authentication.');
            return;
        }

        console.log(`Found ${users.length} users. Updating permissions...`);

        for (const user of users) {
            let name = user.displayName;

            // If user requested "nicol", let's make sure we set it if it looks like them
            if (!name && (user.email?.toLowerCase().includes('nicol'))) {
                name = 'Nicol';
            }

            const userData = {
                email: user.email,
                name: name || user.email?.split('@')[0] || 'Usuario Sin Nombre',
                role: 'Administrador', // GRANT ADMIN
                status: 'Activo',
                department: 'Gerencia',
                updatedAt: new Date()
            };

            // Using set with merge: true to avoid overwriting other fields if they exist, 
            // but ensuring role and status are set.
            await usersCollection.doc(user.uid).set(userData, { merge: true });
            console.log(`✅ Updated User: ${userData.email} (${userData.name}) -> Role: Administrador`);
        }

        console.log('🎉 Admin seeding complete!');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
