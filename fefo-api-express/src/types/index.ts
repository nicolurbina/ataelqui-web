// Product Types
export interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  brand?: string;
  unit?: string;
  description: string;
  provider?: string;
  warehouse?: string;
  totalStock?: number;
  minStock?: number;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Inventory Types
export interface InventoryItem {
  id?: string;
  productId: string;
  quantity: number;
  location: string;
  expiryDate: Date;
  batchNumber: string;
  status: 'available' | 'reserved' | 'damaged';
  createdAt?: Date;
  updatedAt?: Date;
}

// Returns Types
export interface Return {
  id?: string;
  productId: string;
  quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  notes: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tasks Types
export interface Task {
  id?: string;
  title: string;
  description: string;
  type: 'inventory' | 'devolution' | 'counting' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  dueDate: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Users Types
export interface User {
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  department: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

// KPI Types
export interface KPI {
  alertsCount: number;
  lossValue: number;
  totalStock: number;
  rotationRate: number;
  expiredItems: number;
  pendingReturns: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Provider Types
export interface Provider {
  id?: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  address?: string;
  status: 'Activo' | 'Inactivo';
  createdAt?: Date;
  updatedAt?: Date;
}
