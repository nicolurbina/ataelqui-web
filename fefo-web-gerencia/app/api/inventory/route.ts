import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export async function GET() {
    try {
        const inventoryRef = collection(db, 'inventory');
        const q = query(inventoryRef);
        const snapshot = await getDocs(q);

        const inventory = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: inventory
        });
    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
