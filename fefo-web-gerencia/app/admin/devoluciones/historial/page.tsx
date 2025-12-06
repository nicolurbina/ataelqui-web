'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import { db } from '@/config/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function ReturnsHistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOrigin, setFilterOrigin] = useState('Todos los Orígenes');
    const [filterReason, setFilterReason] = useState('Todos los Motivos');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Real Data State
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'returns'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);

            const mappedHistory = querySnapshot.docs.map(doc => {
                const data = doc.data();

                // Handle date parsing (Timestamp or string)
                let dateObj: Date | null = null;
                if (data.date?.toDate) {
                    dateObj = data.date.toDate();
                } else if (data.date) {
                    dateObj = new Date(data.date);
                } else if (data.createdAt?.toDate) {
                    dateObj = data.createdAt.toDate();
                } else if (data.createdAt) {
                    dateObj = new Date(data.createdAt);
                }

                return {
                    id: doc.id,
                    date: dateObj ? dateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                    rawDate: dateObj,
                    origin: data.docType === 'Factura' ? 'Móvil (Ruta)' : 'Web (Manual)',
                    client: data.client || 'Cliente Desconocido',
                    items: data.items ? data.items.length : 0,
                    status: 'Aprobado', // Defaulting to Approved as per screenshot/requirement or logic
                    reason: data.reason || 'Sin motivo',
                    evidenceUrl: data.evidence // Base64 string
                };
            });
            setHistory(mappedHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Aprobado':
                return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Aprobado</span>;
            case 'Rechazado':
                return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Rechazado</span>;
            case 'Pendiente':
                return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Pendiente</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">{status}</span>;
        }
    };

    const getOriginBadge = (origin: string) => {
        return origin.includes('Móvil')
            ? <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> Móvil</span>
            : <span className="inline-flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Web</span>;
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch =
            (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.client || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesOrigin = filterOrigin === 'Todos los Orígenes' || item.origin === filterOrigin;
        const matchesReason = filterReason === 'Todos los Motivos' || item.reason === filterReason;

        // Date Filtering (Exact Day, Month, and Year)
        let matchesDate = true;
        if (selectedDate && item.rawDate) {
            matchesDate =
                item.rawDate.getDate() === selectedDate.getDate() &&
                item.rawDate.getMonth() === selectedDate.getMonth() &&
                item.rawDate.getFullYear() === selectedDate.getFullYear();
        }

        return matchesSearch && matchesOrigin && matchesReason && matchesDate;
    });

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Historial Unificado de Devoluciones</h1>
                <p className="text-gray-500 mt-1">Reporte consolidado de devoluciones móviles y administrativas.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Buscar por Cliente o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                {/* Date Picker Filter */}
                <div className="w-full sm:w-64">
                    <DatePicker
                        selectedDate={selectedDate}
                        onChange={setSelectedDate}
                        placeholder="Filtrar por Mes/Año"
                    />
                </div>

                <select
                    value={filterOrigin}
                    onChange={(e) => setFilterOrigin(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option>Todos los Orígenes</option>
                    <option>Móvil (Ruta)</option>
                    <option>Web (Manual)</option>
                </select>
                <select
                    value={filterReason}
                    onChange={(e) => setFilterReason(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option>Todos los Motivos</option>
                    <option>Vencimiento</option>
                    <option>Daño</option>
                    <option>Error de Pedido</option>
                </select>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Origen</th>
                            <th className="px-6 py-4">Cliente / Ruta</th>
                            <th className="px-6 py-4 text-center">Items</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-center">Evidencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">Cargando historial...</td>
                            </tr>
                        ) : filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                    <td className="px-6 py-4 text-sm">{getOriginBadge(item.origin)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.client}</td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">{item.items}</td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.evidenceUrl ? (
                                            <button
                                                onClick={() => setSelectedImage(item.evidenceUrl)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Ver Evidencia"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <span className="text-gray-300">
                                                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No se encontraron resultados para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Evidencia"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
