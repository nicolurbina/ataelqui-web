import express, { Router, Request, Response } from 'express';
import { getFirebaseDB } from '../config/firebase.js';
import { InventoryItem, ApiResponse } from '../types/index.js';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const router: Router = express.Router();

// Get all inventory items
// CÓDIGO CORREGIDO
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const { status, location, productId } = req.query;

    // SOLUCIÓN: Ahora lee de 'inventory'
    let query: Query = db.collection('inventory') as Query;

    if (status) query = query.where('status', '==', status);
    if (location) query = query.where('location', '==', location);
    if (productId) query = query.where('productId', '==', productId);

    const snapshot = await query.get();
    const items: InventoryItem[] = [];

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      items.push({
        id: doc.id,
        ...doc.data() as Omit<InventoryItem, 'id'>,
        expiryDate: doc.data().expiryDate?.toDate?.() || doc.data().expiryDate
      });
    });

    res.json({
      success: true,
      data: items,
      message: 'Inventory items retrieved successfully'
    } as ApiResponse<InventoryItem[]>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get inventory by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const doc = await db.collection('inventory').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    const data = doc.data();
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        expiryDate: data?.expiryDate?.toDate?.() || data?.expiryDate
      } as InventoryItem
    } as ApiResponse<InventoryItem>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create inventory item
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, location, expiryDate, batchNumber, status } = req.body;

    if (!productId || !quantity || !location || !expiryDate || !batchNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const db = getFirebaseDB();
    const newItem: InventoryItem = {
      productId,
      quantity: parseInt(quantity),
      location,
      expiryDate: new Date(expiryDate),
      batchNumber,
      status: status || 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('inventory').add(newItem);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newItem
      } as InventoryItem,
      message: 'Inventory item created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update inventory item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const itemRef = db.collection('inventory').doc(req.params.id);

    const doc = await itemRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    if (updatedData.expiryDate) {
      updatedData.expiryDate = new Date(updatedData.expiryDate);
    }

    await itemRef.update(updatedData);

    const updatedDoc = await itemRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data,
        expiryDate: data?.expiryDate?.toDate?.() || data?.expiryDate
      } as InventoryItem,
      message: 'Inventory item updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete inventory item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const itemRef = db.collection('inventory').doc(req.params.id);

    const doc = await itemRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    await itemRef.delete();

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get inventory statistics (FEFO alerts)
router.get('/stats/fefo-alerts', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const snapshot = await db.collection('inventory')
      .where('expiryDate', '<=', thirtyDaysFromNow)
      .where('expiryDate', '>', today)
      .get();

    const alerts = snapshot.docs.length;

    res.json({
      success: true,
      data: {
        alertsCount: alerts,
        message: `${alerts} items expiring in next 30 days`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
