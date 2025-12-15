'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/utils/api';

export default function SettlementTrayPage() {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Pendiente');

    // Real Data State
    // Real Data State
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Evidence Modal State
    const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const [returnsRes, productsRes] = await Promise.all([
                apiClient.getReturns(),
                apiClient.getProducts()
            ]);

            const productsMap = new Map();
            if (productsRes.success && productsRes.data) {
                (productsRes.data as any[]).forEach(p => {
                    productsMap.set(p.id, p.name);
                });
            }

            if (returnsRes.success && returnsRes.data) {
                const mappedReturns = (returnsRes.data as any[]).map(doc => {
                    let itemsList: any[] = [];

                    if (Array.isArray(doc.items)) {
                        itemsList = doc.items;
                    } else if (doc.items && typeof doc.items === 'object') {
                        itemsList = Object.values(doc.items);
                    }

                    // Fallback for legacy data
                    if (itemsList.length === 0 && (doc.productName || doc.productId)) {
                        const resolvedName = doc.productName || productsMap.get(doc.productId) || 'Producto Desconocido';
                        itemsList.push({
                            productName: resolvedName,
                            quantity: doc.quantity || 0,
                            reason: doc.reason || 'N/A',
                            sku: doc.sku || 'N/A'
                        });
                    }

                    const mainProduct = itemsList.length > 0 ? itemsList[0].productName : 'Sin Productos';
                    const displayProduct = itemsList.length > 1 ? `${mainProduct} (+${itemsList.length - 1})` : mainProduct;
                    const totalQty = itemsList.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0);

                    return {
                        id: doc.id,
                        date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                        vehicle: doc.vehicle || 'N/A',
                        route: doc.route || 'General',
                        user: doc.client || doc.requestedBy || 'Desconocido',
                        driver: doc.driver || 'N/A',
                        status: normalizeStatus(doc.status),
                        itemsCount: itemsList.length,
                        totalQuantity: totalQty,
                        productList: itemsList,
                        productName: displayProduct,
                        evidence: doc.evidence,
                        rawDoc: process.env.NODE_ENV === 'development' ? JSON.stringify(doc) : ''
                    };
                });
                setReturns(mappedReturns);
            }
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const normalizeStatus = (status: string) => {
        if (!status) return 'pending';
        const s = status.toLowerCase();
        if (s === 'pendiente') return 'pending';
        if (s === 'aprobado') return 'approved';
        if (s === 'rechazado') return 'rejected';
        return s;
    };

    // ... existing handlers ...
    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Aprobar esta devolución?')) return;

        try {
            const response = await apiClient.approveReturn(id);
            if (response.success) {
                fetchReturns();
            } else {
                alert('Error al aprobar');
            }
        } catch (error) {
            console.error('Error approving:', error);
        }
    };

    const handleReject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Rechazar esta devolución?')) return;

        try {
            const response = await apiClient.rejectReturn(id);
            if (response.success) {
                fetchReturns();
            } else {
                alert('Error al rechazar');
            }
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };

    const handleViewEvidence = (evidence: string) => {
        if (!evidence) {
            alert('No hay evidencia adjunta.');
            return;
        }
        setSelectedEvidence(evidence);
        setIsEvidenceModalOpen(true);
    };

    const closeEvidenceModal = () => {
        setIsEvidenceModalOpen(false);
        setSelectedEvidence(null);
    };

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getStatusBadge = (status: string) => {
        if (status === 'pending') return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Pendiente</span>;
        if (status === 'approved') return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Aprobado</span>;
        if (status === 'rejected') return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Rechazado</span>;
        return <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">{status}</span>;
    };

    const filteredReturns = returns.filter(item => {
        const matchesSearch =
            (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.user || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'Todos los Estados' ||
            (filterStatus === 'Pendiente' && item.status === 'pending') ||
            (filterStatus === 'Aprobado' && item.status === 'approved') ||
            (filterStatus === 'Rechazado' && item.status === 'rejected');

        return matchesSearch && matchesStatus;
    });

    const pendingCount = returns.filter(r => r.status === 'pending').length;

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
                        <span className="text-xl font-bold text-yellow-600">{pendingCount}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por ID o Solicitante..."
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
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
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
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Bodeguero/Chofer</th>
                            <th className="px-6 py-4 text-center">Items</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-center">Evidencia</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">Cargando devoluciones...</td>
                            </tr>
                        ) : filteredReturns.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No se encontraron devoluciones.</td>
                            </tr>
                        ) : (
                            filteredReturns.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRow === item.id ? 'bg-orange-50/50' : ''}`} onClick={() => toggleRow(item.id)}>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.vehicle}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.route}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.user}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.driver}</td>
                                        <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{item.itemsCount}</td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="group relative inline-block">
                                                <svg
                                                    onClick={(e) => { e.stopPropagation(); handleViewEvidence(item.evidence); }}
                                                    className={`w-5 h-5 ${item.evidence ? 'text-blue-500 hover:text-blue-700 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {item.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleApprove(item.id, e)}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleReject(item.id, e)}
                                                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    {/* Expanded Details Row */}
                                    {expandedRow === item.id && (
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={9} className="px-6 py-4">
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
                                                            {item.productList && item.productList.length > 0 ? (
                                                                item.productList.map((prod: any, idx: number) => (
                                                                    <tr key={idx} className="border-b border-gray-50">
                                                                        <td className="py-2">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-gray-900">{prod.productName || 'Desconocido'}</span>
                                                                                <span className="text-xs text-gray-400">SKU: {prod.sku}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-2 text-center font-bold">{prod.quantity}</td>
                                                                        <td className="py-2 text-red-600">{prod.reason}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={3} className="py-2 text-center text-gray-400">
                                                                        <p>Sin detalles de productos.</p>
                                                                        {process.env.NODE_ENV === 'development' && (
                                                                            <pre className="text-left text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto max-w-lg mx-auto">
                                                                                DEBUG: {item.rawDoc}
                                                                            </pre>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Evidence Modal */}
            {isEvidenceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={closeEvidenceModal}>
                    <div className="relative bg-white rounded-lg max-w-3xl max-h-[90vh] overflow-auto p-2" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={closeEvidenceModal}
                            className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 z-10"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={selectedEvidence?.startsWith('http') ? selectedEvidence : `data:image/jpeg;base64,${selectedEvidence}`}
                            alt="Evidencia"
                            className="max-w-full h-auto rounded"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
