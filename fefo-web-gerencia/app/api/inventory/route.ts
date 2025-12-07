import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

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

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const docRef = await addDoc(collection(db, 'inventory'), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Update parent product stock
        if (data.productId && data.quantity) {
            const productRef = doc(db, 'products', data.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const currentStock = Number(productSnap.data().stock) || 0;
                await updateDoc(productRef, {
                    stock: currentStock + Number(data.quantity),
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
