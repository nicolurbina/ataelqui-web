import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const returnRef = doc(db, 'returns', id);

        await updateDoc(returnRef, {
            status: 'rejected',
            rejectedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error rejecting return:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
