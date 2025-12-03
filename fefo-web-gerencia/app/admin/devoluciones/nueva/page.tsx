'use client';

import React, { useState } from 'react';
import DatePicker from '@/components/ui/DatePicker';

export default function NewReturnPage() {
    const [date, setDate] = useState<Date | null>(new Date());
    const [documentType, setDocumentType] = useState('Factura');

    const getDocumentLabel = () => {
        switch (documentType) {
            case 'Factura': return 'N° Factura';
            case 'Boleta': return 'N° Boleta';
            case 'Otro': return 'N° Referencia / Guía';
            default: return 'N° Documento';
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50 flex justify-center">
            <div className="w-full max-w-3xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nueva Devolución Manual</h1>
                    <p className="text-gray-500 mt-1">Registro de devoluciones administrativas (Cliente directo / Sin camión).</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cliente */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Buscar cliente..." />
                            </div>

                            {/* Tipo Documento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="Factura">Factura</option>
                                    <option value="Boleta">Boleta</option>
                                    <option value="Otro">Otro (Movimiento Interno)</option>
                                </select>
                            </div>

                            {/* N° Documento */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{getDocumentLabel()}</label>
                                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Ej: 123456" />
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Devolución</label>
                                <DatePicker selectedDate={date} onChange={setDate} placeholder="Seleccione fecha" />
                            </div>

                            {/* Vehículo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo / Transporte</label>
                                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Ej: Citroen, Camión 01..." />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle del Producto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm">
                                        <option>Seleccionar Producto...</option>
                                        <option>Harina Selecta 25kg</option>
                                        <option>Manteca Vegetal</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="0" />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm">
                                        <option>Seleccionar...</option>
                                        <option>Producto Vencido</option>
                                        <option>Envase Dañado</option>
                                        <option>Error de Pedido</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <button type="button" className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg transition-colors">
                                        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* List of added items (Mock) */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg mb-2">
                                    <span className="text-sm font-medium text-gray-700">1x Harina Selecta 25kg</span>
                                    <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">Producto Vencido</span>
                                    <button type="button" className="text-gray-400 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button type="button" className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all">
                                Registrar Devolución
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
