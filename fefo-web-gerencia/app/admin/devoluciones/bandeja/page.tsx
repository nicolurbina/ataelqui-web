'use client';

import React, { useState } from 'react';

// Mock Data for Route Returns
const routeReturns = [
    { id: 'RET-001', date: '25 Nov 2025', vehicle: 'Camión A (Patente: FL-2020)', route: 'Ruta Caldera', user: 'Carlos Chofer', status: 'Pendiente', items: 3 },
    { id: 'RET-002', date: '25 Nov 2025', vehicle: 'Camión B (Patente: AB-1234)', route: 'Ruta Centro', user: 'Miguel Repartidor', status: 'Pendiente', items: 1 },
];

export default function SettlementTrayPage() {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Pendiente');

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getStatusBadge = (status: string) => {
        return status === 'Pendiente'
            ? <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Pendiente</span>
            : <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Aprobado</span>;
    };

    const filteredReturns = routeReturns.filter(item => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.user.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'Todos los Estados' ||
            (filterStatus === 'Pendiente' && item.status === 'Pendiente') ||
            (filterStatus === 'Aprobado' && item.status === 'Aprobado');

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bandeja de Liquidación de Ruta</h1>
                    <p className="text-gray-500 mt-1">Gestión de devoluciones ingresadas desde la App Móvil.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="block text-xs text-gray-500 uppercase font-bold">Pendientes</span>
                        <span className="text-xl font-bold text-yellow-600">5</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="block text-xs text-gray-500 uppercase font-bold">Total Mes</span>
                        <span className="text-xl font-bold text-gray-900">$1.2M</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por ID, Vehículo, Ruta o Chofer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option>Todos los Estados</option>
                    <option>Pendiente</option>
                </select>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Vehículo</th>
                            <th className="px-6 py-4">Ruta</th>
                            <th className="px-6 py-4">Bodeguero/Chofer</th>
                            <th className="px-6 py-4 text-center">Items</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-center">Evidencia</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredReturns.map((item) => (
                            <React.Fragment key={item.id}>
                                <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRow === item.id ? 'bg-orange-50/50' : ''}`} onClick={() => toggleRow(item.id)}>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.vehicle}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.route}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{item.user}</td>
                                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{item.items}</td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="group relative inline-block">
                                            <svg className="w-5 h-5 text-gray-400 hover:text-primary cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {/* Tooltip Simulation */}
                                            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-gray-900 text-white text-xs rounded py-1 px-2 text-center z-10">
                                                Ver Foto Evidencia
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                        {item.status === 'Pendiente' && (
                                            <>
                                                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition-colors">
                                                    Aprobar
                                                </button>
                                                <button className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded shadow-sm transition-colors">
                                                    Rechazar
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                                {/* Expanded Details Row */}
                                {expandedRow === item.id && (
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-inner">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Detalle de Productos Devueltos</h4>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-gray-500 border-b border-gray-100">
                                                            <th className="pb-2 text-left">Producto</th>
                                                            <th className="pb-2 text-center">Cantidad</th>
                                                            <th className="pb-2 text-left">Motivo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b border-gray-50">
                                                            <td className="py-2">Harina Selecta 25kg</td>
                                                            <td className="py-2 text-center font-bold">2</td>
                                                            <td className="py-2 text-red-600">Envase Roto</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-2">Levadura Fresca</td>
                                                            <td className="py-2 text-center font-bold">1</td>
                                                            <td className="py-2 text-orange-600">Vencimiento Próximo</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
