'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';

export default function MovimientosPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getKardex();
            if (res.success && res.data) {
                setItems(res.data);
            }
        } catch (error) {
            console.error('Error fetching kardex:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrado simple
    const filteredItems = items.filter(item =>
        item.productName?.toLowerCase().includes(filter.toLowerCase()) ||
        item.sku?.toLowerCase().includes(filter.toLowerCase()) ||
        item.type?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Movimientos (Kardex)</h1>
                    <p className="text-gray-500 mt-1">Historial completo de entradas y salidas.</p>
                </div>
                <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm text-gray-700">
                    🔄 Actualizar
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre, SKU o tipo..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-x-2xl rounded-b-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">Cargando movimientos...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Cantidad</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No hay movimientos registrados.</td></tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {item.date ? new Date(item.date).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{item.productName || 'Desconocido'}</span>
                                                    <span className="text-xs text-gray-400">{item.sku || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${item.type === 'Entrada' ? 'bg-green-100 text-green-800' :
                                                        item.type === 'Salida' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-sm font-bold text-right ${item.type === 'Salida' ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.type === 'Salida' ? '-' : '+'}{item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.user || 'Sistema'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
