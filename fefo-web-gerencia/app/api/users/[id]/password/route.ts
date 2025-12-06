import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Helper to verify admin role
async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        // Check if user has admin role in Firestore
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        if (userData?.role === 'Administrador') {
            return decodedToken;
        }
        return null;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verify Requester is Admin
        const adminUser = await verifyAdmin(request);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: 'No tienes permisos de Administrador' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const data = await request.json();

        if (!data.password || data.password.length < 6) {
            return NextResponse.json(
                { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
                { status: 400 }
            );
        }

        // 2. Update Password in Firebase Auth
        await adminAuth.updateUser(id, {
            password: data.password
        });

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
