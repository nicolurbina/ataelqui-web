'use client';

import React, { useEffect, useState } from 'react';
import InventoryTable from '@/components/tables/InventoryTable';
import { apiClient } from '@/utils/api';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, inventoryRes] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getInventory()
      ]);

      if (productsRes.success && inventoryRes.success && productsRes.data && inventoryRes.data) {
        const products = productsRes.data as any[];
        const inventory = inventoryRes.data as any[];

        // Merge inventory with product details
        const mergedItems = inventory.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            id: item.id,
            sku: product?.sku || 'N/A',
            name: product?.name || 'Producto Desconocido',
            batch: item.batchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : 'N/A',
            quantity: item.quantity,
            status: mapStatus(item.status, item.expiryDate)
          };
        });

        setItems(mergedItems);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapStatus = (status: string, expiryDate: string | Date) => {
    // Logic to determine status based on expiry or explicit status
    // For now, mapping backend status or calculating based on date
    if (status === 'damaged') return 'critical';
    if (status === 'reserved') return 'warning';

    // Check expiry
    if (expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) return 'critical'; // Expired
      if (daysUntilExpiry < 30) return 'warning'; // Expiring soon
    }

    return 'ok';
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventario General</h1>
          <p className="text-gray-500 mt-1">Gestión de stock, lotes y fechas de vencimiento (FEFO).</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
          + Nuevo Producto
        </button>
      </div>

      {/* Filters Bar Placeholder */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o lote..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary">
          <option>Todos los Estados</option>
          <option>OK</option>
          <option>Por Vencer</option>
          <option>Crítico</option>
        </select>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          Filtros Avanzados
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando inventario...</div>
      ) : (
        <InventoryTable items={items} />
      )}
    </div>
  );
}
