import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET() {
    try {
        const inventoryRef = collection(db, 'inventory');
        // Get all inventory items that have an expiry date
        // Note: Firestore filtering by non-null is tricky, better to fetch and filter in memory for small datasets
        // or use a specific query if possible. For now, let's fetch all and filter.
        const q = query(inventoryRef);
        const snapshot = await getDocs(q);

        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        let alertsCount = 0;
        const alerts: any[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.expiryDate) {
                const expiry = new Date(data.expiryDate);

                // Check if expired or expiring soon (within 30 days)
                if (expiry <= thirtyDaysFromNow) {
                    alertsCount++;
                    alerts.push({
                        id: doc.id,
                        ...data,
                        status: expiry < now ? 'expired' : 'expiring_soon',
                        daysRemaining: Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                alertsCount,
                alerts
            }
        });
    } catch (error: any) {
        console.error('Error fetching FEFO alerts:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
