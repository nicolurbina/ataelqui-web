import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Helper to verify admin role
async function verifyRole(request: Request, allowedRoles: string[]) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        // Check if user has allowed role in Firestore
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();

        if (allowedRoles.includes(userData?.role)) {
            return decodedToken;
        }
        return null;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        // Verify Admin, Bodeguero, or Supervisor
        const authorizedUser = await verifyRole(request, ['Administrador', 'Bodeguero', 'Supervisor']);
        if (!authorizedUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await adminDb.collection('users').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            success: true,
            data: users
        });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // 1. Verify Requester is Admin
        const adminUser = await verifyRole(request, ['Administrador']);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: 'No tienes permisos de Administrador' },
                { status: 403 }
            );
        }

        const data = await request.json();

        // 2. Validate Input
        if (!data.email || !data.password || !data.name) {
            return NextResponse.json(
                { success: false, error: "Nombre, Email y Contraseña son obligatorios" },
                { status: 400 }
            );
        }

        // 3. Create User in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: data.email,
            password: data.password,
            displayName: data.name,
            disabled: false,
        });

        // 4. Create User Document in Firestore (using the same UID)
        const userDocData = {
            name: data.name,
            email: data.email,
            role: data.role || 'Bodeguero',
            status: 'Activo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await adminDb.collection('users').doc(userRecord.uid).set(userDocData);

        return NextResponse.json({
            success: true,
            data: { id: userRecord.uid, ...userDocData }
        });

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
