import express, { Router, Request, Response } from 'express';
import { getFirebaseDB, getFirebaseAuth } from '../config/firebase.js';
import { User, ApiResponse } from '../types/index.js';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const router: Router = express.Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const { role, status } = req.query;

    let query: Query = db.collection('users') as Query;

    if (role) query = query.where('role', '==', role);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.get();
    const users: User[] = [];

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        ...data as Omit<User, 'id'>,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    } as ApiResponse<User[]>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const doc = await db.collection('users').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
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
      } as User
    } as ApiResponse<User>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create user (Firebase Auth + Firestore)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, department } = req.body;

    if (!email || !password || !name || !role || !department) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create auth user
    const auth = getFirebaseAuth();
    const authUser = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Create Firestore user record
    const db = getFirebaseDB();
    const newUser: User = {
      email,
      name,
      role,
      department,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(authUser.uid).set(newUser);

    res.status(201).json({
      success: true,
      data: {
        id: authUser.uid,
        ...newUser
      } as User,
      message: 'User created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const userRef = db.collection('users').doc(req.params.id);

    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    await userRef.update(updatedData);

    const updatedDoc = await userRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt
      } as User,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const userRef = db.collection('users').doc(req.params.id);

    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete from Firestore
    await userRef.delete();

    // Optionally delete from Firebase Auth
    const auth = getFirebaseAuth();
    try {
      await auth.deleteUser(req.params.id);
    } catch (e) {
      console.warn('User not found in Firebase Auth');
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
