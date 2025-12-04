import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { id: docSnap.id, ...docSnap.data() }
        });
    } catch (error: any) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const docRef = doc(db, 'products', id);

        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id, ...data }
        });
    } catch (error: any) {
        console.error('Error updating product:', error);
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
        const docRef = doc(db, 'products', id);

        await deleteDoc(docRef);

        return NextResponse.json({
            success: true,
            data: { id }
        });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
