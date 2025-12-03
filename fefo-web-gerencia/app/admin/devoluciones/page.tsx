// app/devoluciones/page.tsx
import React from 'react';
import ReturnsList from '@/components/tables/ReturnsList';

export default function ReturnsPage() {
    // Mock data
    const requests = [
        { id: '1', productName: 'Harina Selecta 25kg', quantity: 2, reason: 'Bolsa rota', date: '25 Nov 2025', status: 'pending' as const, requestedBy: 'Bodega 1' },
        { id: '2', productName: 'Levadura Fresca 500g', quantity: 5, reason: 'Vencido', date: '24 Nov 2025', status: 'approved' as const, requestedBy: 'Bodega 2' },
        { id: '3', productName: 'Crema Chantilly 1L', quantity: 1, reason: 'Error pedido', date: '23 Nov 2025', status: 'rejected' as const, requestedBy: 'Bodega 1' },
    ];

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
                    <ReturnsList requests={requests} />
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Mermas</h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                                <p className="text-sm text-red-600 font-medium">Total Mermas (Mes)</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">$543.50</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Motivos Principales</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Vencimiento</span>
                                        <span className="font-medium text-gray-900">65%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                                    </div>

                                    <div className="flex justify-between text-sm mt-2">
                                        <span className="text-gray-600">Daño/Rotura</span>
                                        <span className="font-medium text-gray-900">25%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
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
