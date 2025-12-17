import express, { Router, Request, Response } from 'express';
import { getFirebaseDB } from '../config/firebase.js';
import { Product, ApiResponse } from '../types/index.js';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

const router: Router = express.Router();

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const snapshot = await db.collection('products').get();

    const products: Product[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      products.push({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>
      });
    });

    res.json({
      success: true,
      data: products,
      message: 'Products retrieved successfully'
    } as ApiResponse<Product[]>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve products'
    });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const doc = await db.collection('products').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      } as Product
    } as ApiResponse<Product>);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, sku, category, price, cost, description, brand, unit, provider, warehouse, totalStock, minStock, status } = req.body;

    // Validate required fields (allow 0 for price/cost)
    if (!name || !sku || !category || price === undefined || cost === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const db = getFirebaseDB();

    // Check for duplicate SKU
    const duplicateCheck = await db.collection('products').where('sku', '==', sku).get();
    if (!duplicateCheck.empty) {
      return res.status(400).json({
        success: false,
        error: `Product with SKU '${sku}' already exists.`
      });
    }

    const newProduct: Product = {
      name,
      sku,
      category,
      price,
      cost,
      description: description || '',
      brand: brand || '',
      unit: unit || 'UN',
      provider: provider || '',
      warehouse: warehouse || '',
      totalStock: Number(totalStock) || 0,
      minStock: Number(minStock) || 0,
      status: status || 'Saludable',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('products').add(newProduct);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newProduct
      } as Product,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const productRef = db.collection('products').doc(req.params.id);

    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    await productRef.update(updatedData);

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        ...updatedData
      } as Product,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getFirebaseDB();
    const productRef = db.collection('products').doc(req.params.id);

    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await productRef.delete();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
