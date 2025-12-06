import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Helper to verify admin token
async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);

        // Check role in Firestore
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();

        if (userData?.role !== 'Administrador') {
            return null;
        }

        return decodedToken;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Allow if admin OR if requesting own profile
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        // If requesting own profile, allow
        if (decodedToken.uid === id) {
            const userDoc = await adminDb.collection('users').doc(id).get();
            if (!userDoc.exists) {
                return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: { id: userDoc.id, ...userDoc.data() } });
        }

        // Otherwise check if admin
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        if (userData?.role !== 'Administrador') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch requested user
        const targetUserDoc = await adminDb.collection('users').doc(id).get();
        if (!targetUserDoc.exists) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: { id: targetUserDoc.id, ...targetUserDoc.data() }
        });

    } catch (error: any) {
        console.error('Error fetching user:', error);
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
        // Verify Admin
        const adminUser = await verifyAdmin(request);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Only Administrators can update users" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const data = await request.json();

        // 1. Update in Firebase Auth (if email or status changed)
        const updateAuth: any = {};
        if (data.email) updateAuth.email = data.email;
        if (data.status) updateAuth.disabled = data.status !== 'Activo';

        if (Object.keys(updateAuth).length > 0) {
            await adminAuth.updateUser(id, updateAuth);
        }

        // 2. Update in Firestore
        await adminDb.collection('users').doc(id).update({
            ...data,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            data: { id, ...data }
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
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
        // Verify Admin
        const adminUser = await verifyAdmin(request);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Only Administrators can delete users" },
                { status: 403 }
            );
        }

        const { id } = await params;

        // 1. Delete from Firebase Auth
        await adminAuth.deleteUser(id);

        // 2. Delete from Firestore
        await adminDb.collection('users').doc(id).delete();

        return NextResponse.json({
            success: true,
            data: { id }
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
