'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import { apiClient } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { db } from '@/config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function NewReturnPage() {
    const router = useRouter();
    const [date, setDate] = useState<Date | null>(new Date());
    const [documentType, setDocumentType] = useState('Factura');
    const [formData, setFormData] = useState({
        client: '',
        driver: '',
        route: '',
        comments: '',
        documentNumber: '',
        vehicle: ''
    });

    // Product & Items State
    const [products, setProducts] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [currentItem, setCurrentItem] = useState({
        productId: '',
        productName: '',
        quantity: 0,
        reason: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.getProducts();
            if (response.success && response.data) {
                setProducts(response.data as any[]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const getDocumentLabel = () => {
        switch (documentType) {
            case 'Factura': return 'N° Factura';
            case 'Boleta': return 'N° Boleta';
            case 'Otro': return 'N° Referencia / Guía';
            default: return 'N° Documento';
        }
    };

    const handleAddItem = () => {
        if (!currentItem.productId || currentItem.quantity <= 0 || !currentItem.reason) {
            alert('Por favor complete los datos del producto');
            return;
        }

        setItems([...items, { ...currentItem, id: Date.now() }]); // Simple ID generation
        setCurrentItem({
            productId: '',
            productName: '',
            quantity: 0,
            reason: ''
        });
    };

    const handleRemoveItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let itemsToSubmit = [...items];

        // UX Improvement: If no items added but form is filled, add it automatically
        if (itemsToSubmit.length === 0) {
            if (currentItem.productId && currentItem.quantity > 0 && currentItem.reason) {
                itemsToSubmit.push({ ...currentItem, id: Date.now() });
            } else {
                alert('Debe agregar al menos un producto');
                return;
            }
        }

        // Validate required fields explicitly (Double check in case HTML5 required is bypassed)
        if (!formData.client || !formData.driver || !formData.documentNumber || !formData.vehicle || !formData.route || !date) {
            alert('Por favor complete todos los campos obligatorios.');
            return;
        }

        try {
            // Save Data to Firestore (Direct Client-Side Write)
            const returnsRef = collection(db, 'returns');

            for (const item of itemsToSubmit) {
                const newReturn = {
                    productId: item.productId,
                    quantity: item.quantity,
                    reason: item.reason,
                    status: 'pending',
                    requestedBy: formData.client || 'Cliente Directo',
                    driver: formData.driver || 'N/A',
                    route: formData.route || 'Web',
                    comments: formData.comments,
                    vehicle: formData.vehicle,
                    documentType: documentType,
                    documentNumber: formData.documentNumber,
                    returnDate: date ? date.toISOString() : new Date().toISOString(),
                    evidenceUrl: '', // No evidence upload
                    createdAt: Timestamp.now()
                };

                await addDoc(returnsRef, newReturn);
            }

            alert('Devolución registrada exitosamente');
            router.push('/admin/devoluciones/bandeja');
        } catch (error: any) {
            console.error('Error creating return:', error);
            alert(`Error al registrar la devolución: ${error.message || 'Error desconocido'}`);
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cliente */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <input
                                    type="text"
                                    value={formData.client}
                                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Nombre del Cliente..."
                                    required
                                />
                            </div>

                            {/* Chofer / Bodeguero */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chofer / Bodeguero</label>
                                <input
                                    type="text"
                                    value={formData.driver}
                                    onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Nombre del Chofer o Bodeguero..."
                                    required
                                />
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
                                <input
                                    type="text"
                                    value={formData.documentNumber}
                                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ej: 123456"
                                    required
                                />
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Devolución</label>
                                <DatePicker selectedDate={date} onChange={setDate} placeholder="Seleccione fecha" />
                            </div>

                            {/* Vehículo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo / Transporte</label>
                                <input
                                    type="text"
                                    value={formData.vehicle}
                                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ej: Citroen, Camión 01..."
                                    required
                                />
                            </div>

                            {/* Ruta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                                <input
                                    type="text"
                                    value={formData.route}
                                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ej: Ruta Norte, Viernes..."
                                    required
                                />
                            </div>

                            {/* Observaciones */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones / Descripción del Motivo (Opcional)</label>
                                <textarea
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Detalles adicionales sobre la devolución..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle del Producto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
                                    <select
                                        value={currentItem.productId}
                                        onChange={(e) => {
                                            const product = products.find(p => p.id === e.target.value);
                                            setCurrentItem({
                                                ...currentItem,
                                                productId: e.target.value,
                                                productName: product ? product.name : ''
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Seleccionar Producto...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        value={currentItem.quantity === 0 ? '' : currentItem.quantity}
                                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo</label>
                                    <select
                                        value={currentItem.reason}
                                        onChange={(e) => setCurrentItem({ ...currentItem, reason: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Producto Vencido">Producto Vencido</option>
                                        <option value="Envase Dañado">Envase Dañado</option>
                                        <option value="Error de Pedido">Error de Pedido</option>
                                        <option value="Rechazo Cliente">Rechazo Cliente</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* List of added items */}
                            <div className="mt-4 space-y-2">
                                {items.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-2">No hay productos agregados</p>
                                )}
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">{item.quantity}x {item.productName}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${item.reason === 'Producto Vencido' ? 'text-red-600 bg-red-50' :
                                                item.reason === 'Envase Dañado' ? 'text-orange-600 bg-orange-50' :
                                                    'text-blue-600 bg-blue-50'
                                                }`}>
                                                {item.reason}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all"
                            >
                                Registrar Devolución
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
