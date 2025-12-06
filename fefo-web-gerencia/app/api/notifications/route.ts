import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';

export async function GET() {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);

        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to ISO string for JSON
            timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        }));

        return NextResponse.json({
            success: true,
            data: notifications
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const docRef = await addDoc(collection(db, 'notifications'), {
            ...data,
            timestamp: new Date(), // Use server timestamp
            read: false
        });

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
