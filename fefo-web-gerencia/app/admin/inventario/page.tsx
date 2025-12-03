// app/inventario/page.tsx
import React from 'react';
import InventoryTable from '@/components/tables/InventoryTable';

export default function InventoryPage() {
  // Mock data
  const items = [
    { id: '1', sku: 'PAN-001', name: 'Harina Selecta 25kg', batch: 'L-2023-001', expiryDate: '2025-12-01', quantity: 50, status: 'ok' as const },
    { id: '2', sku: 'LEV-005', name: 'Levadura Fresca 500g', batch: 'L-2023-045', expiryDate: '2025-11-28', quantity: 120, status: 'warning' as const },
    { id: '3', sku: 'MAN-002', name: 'Manteca Vegetal 10kg', batch: 'L-2023-012', expiryDate: '2025-11-20', quantity: 15, status: 'critical' as const },
    { id: '4', sku: 'AZU-010', name: 'Azúcar Flor 1kg', batch: 'L-2023-088', expiryDate: '2026-01-15', quantity: 200, status: 'ok' as const },
    { id: '5', sku: 'CHO-003', name: 'Cobertura Chocolate', batch: 'L-2023-099', expiryDate: '2025-12-10', quantity: 30, status: 'ok' as const },
  ];

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

      <InventoryTable items={items} />
    </div>
  );
}
