import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const docRef = doc(db, 'inventory', id);

        await deleteDoc(docRef);

        return NextResponse.json({
            success: true,
            data: { id }
        });
    } catch (error: any) {
        console.error('Error deleting inventory item:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
