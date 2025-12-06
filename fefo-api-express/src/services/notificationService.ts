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

                console.log(`🔍 Count detected: ${countId}`, JSON.stringify(count, null, 2)); // DEBUG LOG

                // Check if there is a discrepancy and if we haven't sent a notification yet
                if (count.expected !== undefined && count.counted !== undefined && count.expected !== count.counted && !count.notificationSent) {
                    console.log(`⚠️ Discrepancy detected in count ${countId}. Generating notification...`);

                    try {
                        // Create notification in notifications
                        await db.collection('notifications').add({
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

export const startWasteListener = () => {
    const db = getFirebaseDB();

    console.log('👂 Starting Waste Listener...');

    db.collection('waste').onSnapshot((snapshot: admin.firestore.QuerySnapshot) => {
        snapshot.docChanges().forEach(async (change: admin.firestore.DocumentChange) => {
            if (change.type === 'added') {
                const waste = change.doc.data();
                const wasteId = change.doc.id;

                // Check if we haven't sent a notification yet
                if (!waste.notificationSent) {
                    console.log(`🗑️ New waste detected ${wasteId}. Generating notification...`);

                    try {
                        // Create notification in notifications
                        await db.collection('notifications').add({
                            type: 'Merma',
                            title: 'Merma Registrada',
                            desc: `Producto: ${waste.productName || 'Desconocido'}. Cantidad: ${waste.quantity}. Causa: ${waste.cause}.`,
                            date: FieldValue.serverTimestamp(),
                            read: false,
                            icon: 'trash-can',
                            color: '#795548',
                            isSystem: true,
                            relatedWasteId: wasteId
                        });

                        // Mark waste as processed
                        await db.collection('waste').doc(wasteId).update({
                            notificationSent: true
                        });

                        console.log(`✅ Notification created for waste ${wasteId}`);
                    } catch (error: any) {
                        console.error(`❌ Error creating notification for waste ${wasteId}:`, error);
                    }
                }
            }
        });
    }, (error: any) => {
        console.error('❌ Error in Waste Listener:', error);
    });
};

export const startReturnListener = () => {
    const db = getFirebaseDB();

    console.log('👂 Starting Return Listener...');

    db.collection('returns').onSnapshot((snapshot: admin.firestore.QuerySnapshot) => {
        snapshot.docChanges().forEach(async (change: admin.firestore.DocumentChange) => {
            if (change.type === 'added') {
                const returnData = change.doc.data();
                const returnId = change.doc.id;

                // Check if we haven't sent a notification yet
                if (!returnData.notificationSent) {
                    console.log(`↩️ New return detected ${returnId}. Generating notification...`);

                    try {
                        // 1. Create notification for Return
                        await db.collection('notifications').add({
                            type: 'Devolución',
                            title: 'Devolución Registrada',
                            desc: `Producto: ${returnData.productName || 'Desconocido'}. Cantidad: ${returnData.quantity}. Motivo: ${returnData.reason}.`,
                            date: FieldValue.serverTimestamp(),
                            read: false,
                            icon: 'arrow-u-left-top',
                            color: '#FF9800', // Orange
                            isSystem: true,
                            relatedReturnId: returnId
                        });

                        // 2. Check if it should be registered as Waste (Merma)
                        // Reasons: "Producto Vencido", "Envase Dañado"
                        if (['Producto Vencido', 'Envase Dañado'].includes(returnData.reason)) {
                            console.log(`⚠️ Return ${returnId} is damaged/expired. Creating Waste entry...`);

                            // Create Waste entry
                            // This will trigger startWasteListener automatically, creating the Merma notification
                            await db.collection('waste').add({
                                productName: returnData.productName,
                                quantity: returnData.quantity,
                                cause: returnData.reason, // Use return reason as waste cause
                                cost: 0, // Default or fetch if needed
                                sku: returnData.productId, // Assuming productId is SKU or ID
                                user: returnData.requestedBy || 'Sistema',
                                date: new Date(), // Current date
                                notificationSent: false // Important: Allow waste listener to pick this up
                            });
                        }

                        // Mark return as processed
                        await db.collection('returns').doc(returnId).update({
                            notificationSent: true
                        });

                        console.log(`✅ Notification created for return ${returnId}`);
                    } catch (error: any) {
                        console.error(`❌ Error processing return ${returnId}:`, error);
                    }
                }
            }
        });
    }, (error: any) => {
        console.error('❌ Error in Return Listener:', error);
    });
};
