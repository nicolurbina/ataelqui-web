import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';

export async function GET() {
    try {
        const collectionsToCheck = ['notifications', 'notificaciones', 'general_alert', 'general_alerts', 'General_Alert'];
        const results: Record<string, number> = {};

        for (const colName of collectionsToCheck) {
            try {
                const colRef = collection(db, colName);
                const snapshot = await getCountFromServer(colRef);
                results[colName] = snapshot.data().count;
            } catch (e) {
                results[colName] = -1; // Error
            }
        }

        return NextResponse.json({
            success: true,
            data: results
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
