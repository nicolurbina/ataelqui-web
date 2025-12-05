import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function GET() {
    try {
        const returnsRef = collection(db, 'returns');
        // Simplify query to debug
        const q = query(returnsRef);
        const snapshot = await getDocs(q);

        console.log(`API: Fetched ${snapshot.docs.length} returns`);

        const returns = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`API: Return ${doc.id} status:`, data.status);
            return {
                id: doc.id,
                ...data
            };
        });

        return NextResponse.json({
            success: true,
            data: returns
        });
    } catch (error: any) {
        console.error('Error fetching returns:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
