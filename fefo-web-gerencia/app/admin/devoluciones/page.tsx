'use client';

import React, { useEffect, useState } from 'react';
import ReturnsList from '@/components/tables/ReturnsList';
import { apiClient } from '@/utils/api';

export default function ReturnsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            const response = await apiClient.getReturns();
            if (response.success && response.data) {
                const mappedRequests = (response.data as any[]).map(item => ({
                    id: item.id,
                    productName: item.productName || 'Producto Desconocido',
                    quantity: item.quantity,
                    reason: item.reason,
                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                    status: item.status,
                    requestedBy: item.requestedBy || 'Bodega'
                }));
                setRequests(mappedRequests);
            }
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const response = await apiClient.approveReturn(id);
            if (response.success) {
                fetchReturns(); // Refresh list
            } else {
                alert('Error al aprobar devolución');
            }
        } catch (error) {
            console.error('Error approving return:', error);
        }
    };

    const handleReject = async (id: string) => {
        try {
            const response = await apiClient.rejectReturn(id);
            if (response.success) {
                fetchReturns(); // Refresh list
            } else {
                alert('Error al rechazar devolución');
            }
        } catch (error) {
            console.error('Error rejecting return:', error);
        }
    };

    // Calculate stats from real data
    const totalMermas = requests
        .filter(r => r.status === 'approved')
        .reduce((acc, curr) => acc + (curr.quantity * 1000), 0); // Placeholder cost

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Devoluciones</h1>
                    <p className="text-gray-500 mt-1">Autorización y seguimiento de mermas y devoluciones.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Solicitudes Recientes</h2>
                        <div className="flex space-x-2">
                            <span className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-600 cursor-pointer hover:bg-gray-50">Pendientes</span>
                            <span className="px-3 py-1 text-xs font-medium bg-transparent text-gray-400 cursor-pointer hover:text-gray-600">Historial</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Cargando devoluciones...</div>
                    ) : (
                        <ReturnsList
                            requests={requests}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Mermas</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                                <p className="text-sm text-red-600 font-medium">Total Mermas (Mes)</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">$0</p>
                                <p className="text-xs text-red-400 mt-1">Cálculo de costo pendiente de implementación</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Motivos Principales</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Vencimiento</span>
                                        <span className="font-medium text-gray-900">--%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                                    </div>

                                    <div className="flex justify-between text-sm mt-2">
                                        <span className="text-gray-600">Daño/Rotura</span>
                                        <span className="font-medium text-gray-900">--%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
