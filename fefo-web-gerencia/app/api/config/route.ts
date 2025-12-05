import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET() {
    try {
        const docRef = doc(db, 'settings', 'fefo');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return NextResponse.json({
                success: true,
                data: docSnap.data()
            });
        } else {
            // Default settings
            return NextResponse.json({
                success: true,
                data: {
                    criticalDays: 7,
                    warningDays: 30,
                    exceptions: []
                }
            });
        }
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const docRef = doc(db, 'settings', 'fefo');

        await setDoc(docRef, data, { merge: true });

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Error saving settings:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
