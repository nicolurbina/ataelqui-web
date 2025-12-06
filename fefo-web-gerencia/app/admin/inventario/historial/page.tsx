'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';

export default function HistoryPage() {
    const [counts, setCounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos los Estados');

    useEffect(() => {
        fetchCounts();
    }, []);

    const fetchCounts = async () => {
        try {
            setLoading(true);
            // Fetch from the correct 'counts' collection
            const response = await apiClient.getCounts();

            if (response.success && response.data) {
                const countsData = response.data as any[];

                // Map to view model
                const mappedCounts = countsData.map(c => ({
                    id: c.countId || c.id, // Use countId (CNT-XXXX) if available, else doc id
                    date: c.date ? new Date(c.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
                    user: c.worker || c.origin || 'Móvil', // Prioritize worker name
                    location: c.aisle || 'General',
                    origin: c.origin || 'Móvil',
                    expected: c.expected ?? 0,
                    counted: c.counted ?? 0,
                    status: c.status || 'Pendiente'
                }));

                setCounts(mappedCounts);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (id: string) => {
        setToastMessage(`Generando planilla de conteo #${id}.xlsx...`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const getStatusBadge = (expected: number, counted: number) => {
        if (expected === counted) {
            return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Correcto</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Discrepancia</span>;
        }
    };

    const filteredCounts = counts.filter(count => {
        const matchesSearch =
            (count.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (count.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (count.location || '').toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter might need adjustment if we are changing what 'status' means visually, 
        // but for now let's keep the filter logic on the original 'status' field if the user still wants to filter by 'Pendiente/Cerrado'
        // OR we can remove the filter if it doesn't make sense anymore. 
        // The user didn't ask to remove the filter, but the column now shows Discrepancy/Correct.
        // Let's keep the filter working on the backend status for now, as that's likely what 'Pendiente/Cerrado' refers to in the dropdown.

        const matchesStatus = filterStatus === 'Todos los Estados' ||
            (filterStatus === 'Pendiente revisión' && count.status === 'Pendiente') ||
            (filterStatus === 'Cerrado' && count.status === 'Cerrado');

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 min-h-screen bg-gray-50/50 relative">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
                    <div className="bg-gray-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h4 className="font-bold text-sm">Exportación Iniciada</h4>
                            <p className="text-xs text-gray-300">{toastMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Historial de Conteos</h1>
                <p className="text-gray-500 mt-1">Auditoría de inventarios realizados por el equipo.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por ID, Bodeguero o Ubicación..."
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
                    <option>Pendiente revisión</option>
                    <option>Cerrado</option>
                </select>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">ID Conteo</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Bodeguero</th>
                            <th className="px-6 py-4">Bodega</th>
                            <th className="px-6 py-4 text-center">Esperado</th>
                            <th className="px-6 py-4 text-center">Contado</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Cargando historial...</td>
                            </tr>
                        ) : filteredCounts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">No se encontraron conteos.</td>
                            </tr>
                        ) : (
                            filteredCounts.map((count) => (
                                <tr key={count.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">#{count.id.substring(0, 8)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{count.date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{count.user}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{count.location}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center font-mono">{count.expected}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-center font-mono font-bold">{count.counted}</td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(count.expected, count.counted)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleExport(count.id)}
                                            className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Exportar Excel
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
