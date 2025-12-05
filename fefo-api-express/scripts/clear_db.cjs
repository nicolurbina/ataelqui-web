const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const clearCollection = async (collectionName) => {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
        console.log(`Collection ${collectionName} is already empty.`);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleared ${snapshot.size} documents from ${collectionName}.`);
};

const main = async () => {
    try {
        console.log('Starting database cleanup...');

        await clearCollection('products');
        await clearCollection('providers');
        await clearCollection('inventory');
        // await clearCollection('users');

        console.log('Database cleanup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
};

main();
