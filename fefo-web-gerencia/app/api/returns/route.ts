import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';

export async function GET() {
    try {
        const returnsRef = collection(db, 'returns');
        // Simplify query to debug
        const q = query(returnsRef);
        const snapshot = await getDocs(q);

        console.log(`API: Fetched ${snapshot.docs.length} returns`);

        const returns = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`API: Return ${doc.id} status:`, data.status);

            // Helper to convert Timestamp to ISO string
            const toISO = (date: any) => {
                if (!date) return null;
                if (date.toDate && typeof date.toDate === 'function') {
                    return date.toDate().toISOString();
                }
                if (date.seconds) {
                    return new Date(date.seconds * 1000).toISOString();
                }
                return date; // Assume it's already a string or Date
            };

            return {
                id: doc.id,
                ...data,
                createdAt: toISO(data.createdAt),
                approvedAt: toISO(data.approvedAt),
                rejectedAt: toISO(data.rejectedAt)
            };
        });

        return NextResponse.json({
            success: true,
            data: returns
        });
    } catch (error: any) {
        console.error('Error fetching returns:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const returnsRef = collection(db, 'returns');

        const newReturn = {
            ...body,
            createdAt: Timestamp.now(),
            status: body.status || 'pending',
            // Ensure these fields are saved
            requestedBy: body.requestedBy || 'Cliente Directo',
            driver: body.driver || 'N/A',
            route: body.route || 'General',
            comments: body.comments || '',
            vehicle: body.vehicle || 'N/A',
            documentType: body.documentType || 'N/A',
            documentNumber: body.documentNumber || 'N/A',
            returnDate: body.returnDate || null,
            evidenceUrl: body.evidenceUrl || null
        };

        const docRef = await addDoc(returnsRef, newReturn);

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...newReturn }
        });
    } catch (error: any) {
        console.error('Error creating return:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
