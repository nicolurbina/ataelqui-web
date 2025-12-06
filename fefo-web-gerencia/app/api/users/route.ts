import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, addDoc, orderBy } from 'firebase/firestore';

export async function GET() {
    try {
        const usersRef = collection(db, 'users');
        // Order by name or createdAt if available, otherwise just default
        const q = query(usersRef);
        const snapshot = await getDocs(q);

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: users
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Basic validation
        if (!data.email || !data.name) {
            return NextResponse.json(
                { success: false, error: "Name and Email are required" },
                { status: 400 }
            );
        }

        const docRef = await addDoc(collection(db, 'users'), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
