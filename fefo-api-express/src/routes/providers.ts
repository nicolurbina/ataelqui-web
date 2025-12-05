import express, { Router, Request, Response } from 'express';
import { getFirebaseDB } from '../config/firebase.js';
import { Provider, ApiResponse } from '../types/index.js';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const router: Router = express.Router();

// Get all providers
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = getFirebaseDB();
        const snapshot = await db.collection('providers').get();

        const providers: Provider[] = [];
        snapshot.forEach((doc: QueryDocumentSnapshot) => {
            providers.push({
                id: doc.id,
                ...doc.data() as Omit<Provider, 'id'>
            });
        });

        res.json({
            success: true,
            data: providers,
            message: 'Providers retrieved successfully'
        } as ApiResponse<Provider[]>);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to retrieve providers'
        });
    }
});

// Get provider by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = getFirebaseDB();
        const doc = await db.collection('providers').doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Provider not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: doc.id,
                ...doc.data()
            } as Provider
        } as ApiResponse<Provider>);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create provider
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, rut, email, phone, address, status } = req.body;

        // Validate required fields
        if (!name || !rut) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const db = getFirebaseDB();
        const newProvider: Provider = {
            name,
            rut,
            email: email || '',
            phone: phone || '',
            address: address || '',
            status: status || 'Activo',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection('providers').add(newProvider);

        res.status(201).json({
            success: true,
            data: {
                id: docRef.id,
                ...newProvider
            } as Provider,
            message: 'Provider created successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update provider
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = getFirebaseDB();
        const providerRef = db.collection('providers').doc(req.params.id);

        const doc = await providerRef.get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Provider not found'
            });
        }

        const updatedData = {
            ...req.body,
            updatedAt: new Date()
        };

        await providerRef.update(updatedData);

        res.json({
            success: true,
            data: {
                id: doc.id,
                ...doc.data(),
                ...updatedData
            } as Provider,
            message: 'Provider updated successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete provider
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = getFirebaseDB();
        const providerRef = db.collection('providers').doc(req.params.id);

        const doc = await providerRef.get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Provider not found'
            });
        }

        await providerRef.delete();

        res.json({
            success: true,
            message: 'Provider deleted successfully'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
