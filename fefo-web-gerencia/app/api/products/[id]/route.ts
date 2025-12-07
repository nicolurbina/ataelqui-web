import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

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
            stock: Number(data.totalStock) || 0, // Update this field for mobile app compatibility
            updatedAt: new Date().toISOString()
        });

        // Handle Inventory Update
        // If batch or expiry is provided, we try to update the latest inventory item
        if (data.batchNumber || data.expirationDate || data.totalStock !== undefined) {
            const inventoryRef = collection(db, 'inventory');
            // We need to query by productId. Since we can't easily do complex queries without index, 
            // we'll fetch all (or if we had an index, query(inventoryRef, where('productId', '==', id)))
            // For now, let's assume we can query by productId if index exists, or fetch all if not.
            // Given the previous code didn't use 'where', I'll use 'getDocs' and filter in memory to be safe 
            // OR better: use 'where' and let it fail/warn if index missing (usually better to add index).
            // Let's try 'where' as it's the correct way.
            const q = query(inventoryRef, where('productId', '==', id));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Update the most recent one
                const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
                items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const latest = items[0];

                const inventoryDocRef = doc(db, 'inventory', latest.id);
                const updates: any = {};
                if (data.batchNumber) updates.batch = data.batchNumber;
                if (data.expirationDate) updates.expiryDate = data.expirationDate;
                // Calculate total current inventory
                const currentTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

                if (data.totalStock !== undefined) {
                    const desiredTotal = Number(data.totalStock);
                    const difference = desiredTotal - currentTotal;

                    if (difference !== 0) {
                        // Apply difference to the latest item
                        const newQuantity = (Number(latest.quantity) || 0) + difference;
                        updates.quantity = newQuantity < 0 ? 0 : newQuantity; // Prevent negative stock on single item if possible, though logic might need refinement for complex cases

                        // If we can't subtract enough from the latest item, we might need to adjust others or create a negative entry.
                        // For simplicity in this "Edit Product" context, we'll assume we just want to force the total.
                        // A better approach for "Reset to 0" might be to delete all and create one 0 entry, or set all to 0.
                        // But let's try to just adjust the latest one to make the sum correct.

                        // Actually, if the user sets Total to X, they expect the SUM to be X.
                        // If we have [50, 0] and user sets to 0. Current Sum = 50. Desired = 0. Diff = -50.
                        // Latest is 0. New Quantity = -50. This is bad.

                        // Alternative: If setting total stock, maybe we should just update the latest to be (Desired - (Sum of others)).
                        const sumOfOthers = currentTotal - (Number(latest.quantity) || 0);
                        updates.quantity = desiredTotal - sumOfOthers;
                    }
                }

                if (Object.keys(updates).length > 0) {
                    await updateDoc(inventoryDocRef, updates);
                }
            } else {
                // No inventory exists, create one
                if (data.totalStock && Number(data.totalStock) > 0) {
                    await addDoc(collection(db, 'inventory'), {
                        productId: id,
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
            }
        }

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
