import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Products
  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory (API-based legacy)
  async getInventory(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/inventory${params ? '?' + params : ''}`);
  }

  async getInventoryItem(id: string) {
    return this.request(`/inventory/${id}`);
  }

  async createInventoryItem(data: any) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Note: updateInventoryItem and deleteInventoryItem are implemented below using Firestore directly

  async getFefoAlerts() {
    return this.request('/inventory/stats/fefo-alerts');
  }

  // Mermas
  async getMermas() {
    return this.request('/mermas');
  }

  // Waste (Firestore Direct)
  async getWaste() {
    try {
      const q = query(collection(db, 'waste'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const waste = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      }));
      return { success: true, data: waste };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createWaste(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'waste'), {
        ...data,
        date: new Date() // Store as Firestore Timestamp or Date
      });
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteWaste(id: string) {
    try {
      await deleteDoc(doc(db, 'waste', id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Returns
  async getReturns(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/returns${params ? '?' + params : ''}`);
  }

  async getReturn(id: string) {
    return this.request(`/returns/${id}`);
  }

  async createReturn(data: any) {
    return this.request('/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReturn(id: string, data: any) {
    return this.request(`/returns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approveReturn(id: string) {
    return this.request(`/returns/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectReturn(id: string) {
    return this.request(`/returns/${id}/reject`, {
      method: 'POST',
    });
  }

  // Tasks
  async getTasks(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/tasks${params ? '?' + params : ''}`);
  }

  async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeTask(id: string) {
    return this.request(`/tasks/${id}/complete`, {
      method: 'POST',
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/users${params ? '?' + params : ''}`);
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Health
  async health() {
    return this.request('/health');
  }
  // Providers
  async getProviders() {
    return this.request('/providers');
  }

  async createProvider(data: any) {
    return this.request('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProvider(id: string, data: any) {
    return this.request(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProvider(id: string) {
    return this.request(`/providers/${id}`, {
      method: 'DELETE',
    });
  }

  // Configuration
  async getConfig() {
    return this.request('/config');
  }

  async saveConfig(data: any) {
    try {
      return await this.request('/config', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Inventory / Lots (Firestore Direct)
  async getInventoryByProduct(productId: string) {
    try {
      const q = query(collection(db, 'inventory'), where('productId', '==', productId));
      const snapshot = await getDocs(q);
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: inventory };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addInventoryItem(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...data,
        createdAt: new Date().toISOString()
      });
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateInventoryItem(id: string, data: any) {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteInventoryItem(id: string) {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Tasks (Firestore Direct)
  async getTasksDirect() {
    try {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      }));
      return { success: true, data: tasks };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Debug: Check for inventory_counts collection
  async getDebugInventoryCounts() {
    try {
      const q = query(collection(db, 'inventory_counts'), limit(5));
      const snapshot = await getDocs(q);
      const counts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: counts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Real Counts from 'counts' collection
  async getCounts() {
    try {
      const q = query(collection(db, 'counts'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const counts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
      }));
      return { success: true, data: counts };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
