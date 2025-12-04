'use client';

import React, { useState } from 'react';

export default function KardexPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos los Tipos');

    // No real data source for Kardex yet
    const movements: any[] = [];

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'Entrada':
                return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Entrada</span>;
            case 'Salida':
                return <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">Salida</span>;
            case 'Ajuste':
                return <span className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">Ajuste</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">{type}</span>;
        }
    };

    const filteredMovements = movements.filter(mov => {
        const matchesSearch =
            mov.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mov.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mov.user.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'Todos los Tipos' || mov.type === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kardex de Movimientos</h1>
                <p className="text-gray-500 mt-1">Traza completa de entradas, salidas y ajustes de inventario.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4">
                <input
                    type="text"
                    placeholder="Buscar producto, motivo o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option>Todos los Tipos</option>
                    <option>Entrada</option>
                    <option>Salida</option>
                    <option>Ajuste</option>
                </select>
                <input type="date" className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {/* Kardex Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">Fecha/Hora</th>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4 text-center">Tipo</th>
                            <th className="px-6 py-4 text-center">Cantidad</th>
                            <th className="px-6 py-4">Motivo/Referencia</th>
                            <th className="px-6 py-4">Usuario</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredMovements.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    <p>No hay movimientos registrados.</p>
                                    <p className="text-xs mt-1 text-gray-400">El historial de movimientos se activará próximamente.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredMovements.map((mov) => (
                                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">{mov.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{mov.product}</td>
                                    <td className="px-6 py-4 text-center">
                                        {getTypeBadge(mov.type)}
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-bold text-center ${mov.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{mov.reason}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{mov.user}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
