import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, addDoc } from 'firebase/firestore';

export async function GET() {
    try {
        const providersRef = collection(db, 'providers');
        const q = query(providersRef);
        const snapshot = await getDocs(q);

        const providers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: providers
        });
    } catch (error: any) {
        console.error('Error fetching providers:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const docRef = await addDoc(collection(db, 'providers'), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating provider:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
