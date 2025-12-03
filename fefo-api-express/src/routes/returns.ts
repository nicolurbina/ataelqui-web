import express, { Router, Request, Response } from 'express';
import { getFirebaseDB } from '../config/firebase.js';
import { Return, ApiResponse } from '../types/index.js';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const router: Router = express.Router();

// Get all returns
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const { status } = req.query;

    let query: Query = db.collection('returns') as Query;
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const returns: Return[] = [];

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      returns.push({
        id: doc.id,
        ...data as Omit<Return, 'id'>,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    res.json({
      success: true,
      data: returns,
      message: 'Returns retrieved successfully'
    } as ApiResponse<Return[]>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get return by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const doc = await db.collection('returns').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Return not found'
      });
    }

    const data = doc.data();
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt
      } as Return
    } as ApiResponse<Return>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create return
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, reason, notes, createdBy } = req.body;

    if (!productId || !quantity || !reason || !createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const db = getFirebaseDB();
    const newReturn: Return = {
      productId,
      quantity: parseInt(quantity),
      reason,
      status: 'pending',
      notes: notes || '',
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('returns').add(newReturn);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newReturn
      } as Return,
      message: 'Return created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update return status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const returnRef = db.collection('returns').doc(req.params.id);

    const doc = await returnRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Return not found'
      });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    await returnRef.update(updatedData);

    const updatedDoc = await returnRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt
      } as Return,
      message: 'Return updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Approve return
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const returnRef = db.collection('returns').doc(req.params.id);

    const doc = await returnRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Return not found'
      });
    }

    await returnRef.update({
      status: 'approved',
      updatedAt: new Date()
    });

    const updatedDoc = await returnRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data
      } as Return,
      message: 'Return approved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reject return
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const returnRef = db.collection('returns').doc(req.params.id);

    const doc = await returnRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Return not found'
      });
    }

    await returnRef.update({
      status: 'rejected',
      updatedAt: new Date()
    });

    const updatedDoc = await returnRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data
      } as Return,
      message: 'Return rejected successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
