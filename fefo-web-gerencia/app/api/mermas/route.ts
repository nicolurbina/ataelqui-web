import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, addDoc, orderBy } from 'firebase/firestore';

export async function GET() {
    try {
        const mermasRef = collection(db, 'mermas');
        // Try to order by date if possible, otherwise just fetch
        const q = query(mermasRef);
        const snapshot = await getDocs(q);

        const mermas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: mermas
        });
    } catch (error: any) {
        console.error('Error fetching mermas:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Add timestamp if not present
        const docRef = await addDoc(collection(db, 'mermas'), {
            ...data,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating merma:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
