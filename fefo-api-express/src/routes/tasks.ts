import express, { Router, Request, Response } from 'express';
import { getFirebaseDB } from '../config/firebase.js';
import { Task, ApiResponse } from '../types/index.js';
import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const router: Router = express.Router();

// Get all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const { status, assignedTo, priority } = req.query;

    let query: Query = db.collection('tasks') as Query;

    if (status) query = query.where('status', '==', status);
    if (assignedTo) query = query.where('assignedTo', '==', assignedTo);
    if (priority) query = query.where('priority', '==', priority);

    const snapshot = await query.orderBy('dueDate', 'asc').get();
    const tasks: Task[] = [];

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data as Omit<Task, 'id'>,
        dueDate: data.dueDate?.toDate?.() || data.dueDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });

    res.json({
      success: true,
      data: tasks,
      message: 'Tasks retrieved successfully'
    } as ApiResponse<Task[]>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const doc = await db.collection('tasks').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const data = doc.data();
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...data,
        dueDate: data?.dueDate?.toDate?.() || data?.dueDate,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt
      } as Task
    } as ApiResponse<Task>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, type, priority, assignedTo, dueDate, createdBy } = req.body;

    if (!title || !type || !priority || !assignedTo || !dueDate || !createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const db = getFirebaseDB();
    const newTask: Task = {
      title,
      description: description || '',
      type,
      status: 'pending',
      priority,
      assignedTo,
      dueDate: new Date(dueDate),
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('tasks').add(newTask);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newTask
      } as Task,
      message: 'Task created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const taskRef = db.collection('tasks').doc(req.params.id);

    const doc = await taskRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    if (updatedData.dueDate) {
      updatedData.dueDate = new Date(updatedData.dueDate);
    }

    await taskRef.update(updatedData);

    const updatedDoc = await taskRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data,
        dueDate: data?.dueDate?.toDate?.() || data?.dueDate,
        createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt
      } as Task,
      message: 'Task updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete task
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const taskRef = db.collection('tasks').doc(req.params.id);

    const doc = await taskRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await taskRef.update({
      status: 'completed',
      updatedAt: new Date()
    });

    const updatedDoc = await taskRef.get();
    const data = updatedDoc.data();

    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...data
      } as Task,
      message: 'Task completed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const taskRef = db.collection('tasks').doc(req.params.id);

    const doc = await taskRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await taskRef.delete();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
