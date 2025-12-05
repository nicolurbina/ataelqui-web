import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const docRef = doc(db, 'providers', id);

        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id, ...data }
        });
    } catch (error: any) {
        console.error('Error updating provider:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const docRef = doc(db, 'providers', id);

        await deleteDoc(docRef);

        return NextResponse.json({
            success: true,
            data: { id }
        });
    } catch (error: any) {
        console.error('Error deleting provider:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
