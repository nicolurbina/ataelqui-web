import { db } from '@/config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export type NotificationType = 'FEFO' | 'Stock' | 'Discrepancy' | 'System' | 'Info';

export const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    details?: string
) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            type,
            title,
            message,
            details: details || '',
            timestamp: Timestamp.now(),
            read: false
        });
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
};
