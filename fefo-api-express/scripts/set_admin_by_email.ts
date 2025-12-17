
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error('Please provide an email address.');
    process.exit(1);
}

async function setAdminByEmail() {
    console.log(`🚀 Setting admin role for: ${targetEmail}`);

    if (getApps().length === 0) {
        try {
            const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
                ? {
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }
                : require('../serviceAccountKey.json');

            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (error: any) {
            console.error('❌ Failed to initialize Firebase:', error.message);
            process.exit(1);
        }
    }

    const auth = getAuth();
    const db = getFirestore();

    try {
        const user = await auth.getUserByEmail(targetEmail);
        console.log(`Found user: ${user.uid}`);

        await db.collection('users').doc(user.uid).set({
            role: 'Administrador',
            status: 'Activo',
            updatedAt: new Date()
        }, { merge: true });

        console.log(`✅ Successfully made ${targetEmail} an Administrador.`);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setAdminByEmail();
