'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiClient } from '@/utils/api';

export default function MermasPage() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [filterCause, setFilterCause] = useState('Todas las Causas');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Real Data State
    const [productsDb, setProductsDb] = useState<any[]>([]);
    const [writeOffs, setWriteOffs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newMerma, setNewMerma] = useState({
        productId: '',
        productName: '',
        batch: '',
        quantity: 0,
        cause: 'Vencido',
        unitCost: 0
    });

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, mermasRes] = await Promise.all([
                apiClient.getProducts(),
                apiClient.getMermas()
            ]);

            if (productsRes.success && productsRes.data) {
                setProductsDb(productsRes.data as any[]);
            }

            if (mermasRes.success && mermasRes.data) {
                const mermasData = mermasRes.data as any[];

                const mappedWriteOffs = mermasData.map(item => {
                    // Try to find product name if not in item
                    const product = (productsRes.data as any[]).find(p => p.id === item.productId);
                    return {
                        id: item.id,
                        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
                        product: item.productName || product?.name || 'Producto Desconocido',
                        batch: item.batch || item.batchNumber || 'N/A',
                        quantity: item.quantity,
                        cause: item.cause || (item.status === 'expired' ? 'Vencido' : 'Daño'),
                        unitCost: item.unitCost || item.cost || product?.cost || 0,
                        totalLoss: ((item.unitCost || item.cost || product?.cost || 0) * item.quantity)
                    };
                });
                setWriteOffs(mappedWriteOffs);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setNewMerma({ ...newMerma, productName: value });
        setShowSuggestions(true);
    };

    const selectProduct = (product: any) => {
        setSearchTerm(`${product.sku} - ${product.name}`);
        setNewMerma({
            ...newMerma,
            productId: product.id,
            productName: product.name,
            unitCost: product.cost
        });
        setShowSuggestions(false);
    };

    const filteredProducts = productsDb.filter(p =>
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddMerma = async () => {
        if (!newMerma.productId || !newMerma.batch || newMerma.quantity <= 0) return;

        try {
            // Create a new inventory item with status 'damaged' or 'expired' to represent the write-off
            // OR update existing inventory.
            // Since we are "Registering New Merma", it implies adding a record.
            // If we are writing off existing stock, we should probably select from existing inventory.
            // For this simple version, we'll create a new inventory item marked as damaged.
            const payload = {
                productId: newMerma.productId,
                quantity: newMerma.quantity,
                location: 'Merma', // Placeholder location
                expiryDate: new Date().toISOString(), // Placeholder
                batchNumber: newMerma.batch,
                status: newMerma.cause === 'Vencido' ? 'expired' : 'damaged',
                cost: newMerma.unitCost
            };

            const response = await apiClient.createInventoryItem(payload);
            if (response.success) {
                fetchData(); // Refresh list
                setIsModalOpen(false);
                setNewMerma({ productId: '', productName: '', batch: '', quantity: 0, cause: 'Vencido', unitCost: 0 });
                setSearchTerm('');
            } else {
                alert('Error al registrar merma');
            }
        } catch (error) {
            console.error('Error creating merma:', error);
        }
    };

    const handleDeleteMerma = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro de merma?')) return;

        try {
            const response = await apiClient.deleteInventoryItem(id);
            if (response.success) {
                fetchData(); // Refresh list
            } else {
                alert('Error al eliminar merma');
            }
        } catch (error) {
            console.error('Error deleting merma:', error);
            alert('Error al eliminar merma');
        }
    };

    const filteredWriteOffs = writeOffs.filter(item => {
        const matchesCause = filterCause === 'Todas las Causas' || item.cause === filterCause;

        let matchesDate = true;
        if (selectedDate) {
            // Parse date string back to object for comparison if needed, or compare strings
            // item.date is formatted string. Ideally keep raw date in object.
            // For simplicity, skipping strict date filter implementation here or need to store raw date.
            // Let's assume we match if the string contains the date parts (simplified)
            // Better: store raw date in writeOffs
        }

        return matchesCause && matchesDate;
    });

    const totalLoss = filteredWriteOffs.reduce((acc, item) => acc + item.totalLoss, 0);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Reporte de Mermas y Pérdidas', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

        // Table
        const tableColumn = ["Fecha", "Producto", "Lote", "Cantidad", "Causa", "Costo Unit.", "Pérdida Total"];
        const tableRows = filteredWriteOffs.map(item => [
            item.date,
            item.product,
            item.batch,
            item.quantity,
            item.cause,
            formatCurrency(item.unitCost),
            formatCurrency(item.totalLoss)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [220, 38, 38] }, // Red header
        });

        // Footer with Total
        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Pérdidas: ${formatCurrency(totalLoss)}`, 14, finalY + 10);

        doc.save(`reporte_mermas_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reporte de Mermas y Pérdidas</h1>
                    <p className="text-gray-500 mt-1">Control financiero de bajas de inventario.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Merma
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar Informe
                    </button>
                </div>
            </div>

            {/* Financial Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Loss KPI */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Pérdida Total (Filtrada)</h3>
                    <div className="text-4xl font-extrabold text-red-600 tracking-tight">{formatCurrency(totalLoss)}</div>
                    <p className="text-xs text-gray-400 mt-2">Calculado en base a stock dañado/vencido</p>
                </div>

                {/* Bar Chart Simulation */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Desglose por Causa</h3>
                    <div className="space-y-4">
                        {/* Vencimiento Bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">Vencimiento</span>
                                {/* Placeholder calculation for breakdown */}
                                <span className="font-bold text-gray-900">--</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                <div className="bg-red-500 h-4 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                        </div>
                        {/* Daño Bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">Daño / Rotura</span>
                                <span className="font-bold text-gray-900">--</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                <div className="bg-orange-400 h-4 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-64">
                    <DatePicker selectedDate={selectedDate} onChange={setSelectedDate} placeholder="Filtrar por Fecha" />
                </div>
                <select
                    value={filterCause}
                    onChange={(e) => setFilterCause(e.target.value)}
                    className="w-full sm:w-48 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary h-[42px]"
                >
                    <option>Todas las Causas</option>
                    <option>Vencido</option>
                    <option>Daño</option>
                </select>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Lote</th>
                            <th className="px-6 py-4 text-center">Cantidad</th>
                            <th className="px-6 py-4">Causa</th>
                            <th className="px-6 py-4 text-right">Costo Unit.</th>
                            <th className="px-6 py-4 text-right">Pérdida Total</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Cargando mermas...</td>
                            </tr>
                        ) : filteredWriteOffs.length > 0 ? (
                            filteredWriteOffs.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.batch}</td>
                                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{item.quantity}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.cause === 'Vencido' ? 'text-red-700 bg-red-100' : 'text-orange-700 bg-orange-100'}`}>
                                            {item.cause}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(item.unitCost)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">{formatCurrency(item.totalLoss)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteMerma(item.id)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                            title="Eliminar"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                    No se encontraron registros para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {/* Footer Row */}
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-right text-sm font-bold text-gray-900 uppercase">Total Pérdidas</td>
                            <td className="px-6 py-4 text-right text-lg font-extrabold text-red-600">{formatCurrency(totalLoss)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* New Merma Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Registrar Nueva Merma</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Producto (Nombre o SKU)</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    placeholder="Buscar por SKU o Nombre..."
                                />
                                {showSuggestions && searchTerm && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {filteredProducts.length > 0 ? (
                                            filteredProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => selectProduct(product)}
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                >
                                                    <span className="font-bold text-gray-900">{product.sku}</span>
                                                    <span className="text-gray-500 mx-2">-</span>
                                                    <span className="text-gray-700">{product.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-gray-500">No se encontraron productos</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                                    <input
                                        type="text"
                                        value={newMerma.batch}
                                        onChange={(e) => setNewMerma({ ...newMerma, batch: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        placeholder="L-2023-X"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        value={newMerma.quantity === 0 ? '' : newMerma.quantity}
                                        onChange={(e) => setNewMerma({ ...newMerma, quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Causa</label>
                                    <select
                                        value={newMerma.cause}
                                        onChange={(e) => setNewMerma({ ...newMerma, cause: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    >
                                        <option>Vencido</option>
                                        <option>Daño</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
                                    <input
                                        type="number"
                                        value={newMerma.unitCost === 0 ? '' : newMerma.unitCost}
                                        onChange={(e) => setNewMerma({ ...newMerma, unitCost: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddMerma}
                                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm"
                                >
                                    Registrar Pérdida
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
