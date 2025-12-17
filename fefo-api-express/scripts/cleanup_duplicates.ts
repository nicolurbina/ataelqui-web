
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

async function cleanupDuplicates() {
    console.log('--- Cleaning Duplicate Products ---');
    const productsSnap = await db.collection('products').get();
    const skuMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();

    productsSnap.docs.forEach(doc => {
        const data = doc.data();
        const sku = data.sku || 'NO_SKU';
        if (!skuMap.has(sku)) {
            skuMap.set(sku, []);
        }
        skuMap.get(sku)?.push(doc);
    });

    console.log(`Total products scanned: ${productsSnap.size}`);
    console.log(`Total unique SKUs: ${skuMap.size}`);

    let deletedCount = 0;
    for (const [sku, docs] of skuMap.entries()) {
        if (docs.length > 1) {
            console.log(`Resolving duplicates for SKU: '${sku}' (${docs.length} found)`);

            // Sort by createdAt (older first) or arbitrary if no date
            // We keep the first one
            docs.sort((a, b) => {
                const dateA = a.data().createdAt?.toDate ? a.data().createdAt.toDate() : new Date(0);
                const dateB = b.data().createdAt?.toDate ? b.data().createdAt.toDate() : new Date(0);
                return dateA.getTime() - dateB.getTime();
            });

            const [keeper, ...duplicates] = docs;
            console.log(`Keeping: ${keeper.id} (Created: ${keeper.data().createdAt})`);

            for (const dup of duplicates) {
                console.log(`Deleting duplicate: ${dup.id} (Created: ${dup.data().createdAt})`);
                await db.collection('products').doc(dup.id).delete();
                deletedCount++;
            }
        }
    }

    console.log(`\nCleanup complete. Deleted ${deletedCount} duplicate products.`);
}

cleanupDuplicates().catch(console.error);
