import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const serviceAccount = process.env.FIREBASE_PRIVATE_KEY
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
    : {};

if (!serviceAccount.projectId) {
    console.error('Firebase config missing');
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkDuplicates() {
    console.log('--- Checking Products ---');
    const productsSnap = await db.collection('products').get();
    const skuMap = new Map<string, number>();

    productsSnap.docs.forEach(doc => {
        const data = doc.data();
        const sku = data.sku || 'NO_SKU';
        skuMap.set(sku, (skuMap.get(sku) || 0) + 1);
    });

    let duplicateProducts = 0;
    skuMap.forEach((count, sku) => {
        if (count > 1) {
            console.log(`Duplicate SKU: ${sku} (Count: ${count})`);
            duplicateProducts++;
        }
    });

    if (duplicateProducts === 0) console.log('No duplicate SKUs found.');

    console.log('\n--- Checking Returns ---');
    const returnsSnap = await db.collection('returns').get();
    const docNumMap = new Map<string, number>();

    returnsSnap.docs.forEach(doc => {
        const data = doc.data();
        // Group by Document Number + Type
        const key = `${data.documentType || data.docType}-${data.documentNumber || data.docNum || 'NO_NUM'}`;
        docNumMap.set(key, (docNumMap.get(key) || 0) + 1);
    });

    let duplicateReturns = 0;
    docNumMap.forEach((count, key) => {
        if (count > 1) {
            console.log(`Potential Split Return (Multiple Docs with same DocNum): ${key} (Count: ${count})`);
            duplicateReturns++;
        }
    });

    if (duplicateReturns === 0) console.log('No potentially split returns found.');
}

checkDuplicates().catch(console.error);
