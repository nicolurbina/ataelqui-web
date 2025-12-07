import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

export async function GET() {
    try {
        // Changed from 'products' to 'productos' to match mobile app
        const productsRef = collection(db, 'products');
        // You might want to add ordering here
        const q = query(productsRef);
        const snapshot = await getDocs(q);

        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: products
        });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Basic validation could go here

        // Changed from 'products' to 'productos' to match mobile app
        const docRef = await addDoc(collection(db, 'products'), {
            ...data,
            stock: Number(data.totalStock) || 0, // Add this field for mobile app compatibility
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // If initial stock is provided, create an inventory entry
        if (data.totalStock && Number(data.totalStock) > 0) {
            await addDoc(collection(db, 'inventory'), {
                productId: docRef.id,
                productName: data.name,
                sku: data.sku,
                quantity: Number(data.totalStock),
                initialQuantity: Number(data.totalStock),
                batch: data.batchNumber || 'Lote Inicial',
                expiryDate: data.expirationDate || null,
                entryDate: new Date().toISOString(),
                status: 'Disponible',
                warehouse: data.warehouse || 'Bodega 1',
                unitCost: 0,
                createdAt: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
