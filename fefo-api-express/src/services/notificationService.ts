import { getFirebaseDB } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

export const startDiscrepancyListener = () => {
    const db = getFirebaseDB();

    console.log('👂 Starting Discrepancy Listener...');

    db.collection('counts').onSnapshot((snapshot: admin.firestore.QuerySnapshot) => {
        snapshot.docChanges().forEach(async (change: admin.firestore.DocumentChange) => {
            if (change.type === 'added' || change.type === 'modified') {
                const count = change.doc.data();
                const countId = change.doc.id;

                // Check if there is a discrepancy and if we haven't sent a notification yet
                if (count.expected !== undefined && count.counted !== undefined && count.expected !== count.counted && !count.notificationSent) {
                    console.log(`⚠️ Discrepancy detected in count ${countId}. Generating notification...`);

                    try {
                        // Create notification in general_alerts
                        await db.collection('general_alerts').add({
                            type: 'Discrepancy',
                            title: `Discrepancia en Conteo ${count.countId || countId}`,
                            desc: 'El conteo físico no coincide con el sistema.',
                            expected: count.expected,
                            counted: count.counted,
                            date: FieldValue.serverTimestamp(),
                            read: false,
                            icon: 'file-document-outline',
                            color: '#4527A0',
                            isSystem: true,
                            relatedCountId: countId
                        });

                        // Mark count as processed to avoid duplicate notifications
                        await db.collection('counts').doc(countId).update({
                            notificationSent: true
                        });

                        console.log(`✅ Notification created for count ${countId}`);
                    } catch (error: any) {
                        console.error(`❌ Error creating notification for count ${countId}:`, error);
                    }
                }
            }
        });
    }, (error: any) => {
        console.error('❌ Error in Discrepancy Listener:', error);
    });
};
