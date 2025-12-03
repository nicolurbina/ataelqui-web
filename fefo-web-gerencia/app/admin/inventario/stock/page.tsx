'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Initial Mock Data
const initialProducts = [
    { id: '1', sku: 'PAN-001', name: 'Harina Selecta 25kg', category: 'Insumos', provider: 'Molino A', warehouse: 'Bodega 1', totalStock: 50, minStock: 20, status: 'Saludable' },
    { id: '2', sku: 'LEV-005', name: 'Levadura Fresca 500g', category: 'Insumos', provider: 'Levaduras X', warehouse: 'Cámara de Frío', totalStock: 15, minStock: 20, status: 'Alerta' },
    { id: '3', sku: 'MAN-002', name: 'Manteca Vegetal 10kg', category: 'Grasas', provider: 'Grasas Sur', warehouse: 'Bodega 2', totalStock: 5, minStock: 10, status: 'Crítico' },
    { id: '4', sku: 'AZU-010', name: 'Azúcar Flor 1kg', category: 'Insumos', provider: 'Azucarera B', warehouse: 'Bodega 1', totalStock: 200, minStock: 50, status: 'Saludable' },
    { id: '5', sku: 'CHO-003', name: 'Cobertura Chocolate', category: 'Repostería', provider: 'ChocoWorld', warehouse: 'Bodega 3', totalStock: 30, minStock: 15, status: 'Saludable' },
];

export default function StockPage() {
    const [products, setProducts] = useState(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas las Categorías');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState({
        sku: '',
        name: '',
        category: 'Insumos',
        provider: '',
        warehouse: 'Bodega 1',
        totalStock: '',
        minStock: ''
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Saludable':
                return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Saludable</span>;
            case 'Alerta':
                return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Alerta</span>;
            case 'Crítico':
                return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Crítico</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">{status}</span>;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const openModal = (product?: typeof initialProducts[0]) => {
        if (product) {
            setEditingId(product.id);
            setNewProduct({
                sku: product.sku,
                name: product.name,
                category: product.category,
                provider: product.provider,
                warehouse: product.warehouse || 'Bodega 1',
                totalStock: product.totalStock.toString(),
                minStock: product.minStock.toString()
            });
        } else {
            setEditingId(null);
            setNewProduct({
                sku: '',
                name: '',
                category: 'Insumos',
                provider: '',
                warehouse: 'Bodega 1',
                totalStock: '',
                minStock: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();

        const stock = Number(newProduct.totalStock);
        const min = Number(newProduct.minStock);

        // Determine status based on stock levels
        let status = 'Saludable';
        if (stock <= min / 2) {
            status = 'Crítico';
        } else if (stock <= min) {
            status = 'Alerta';
        }

        if (editingId) {
            // Update existing product
            setProducts(products.map(p => p.id === editingId ? {
                ...p,
                ...newProduct,
                totalStock: stock,
                minStock: min,
                status
            } : p));
        } else {
            // Add new product
            const productToAdd = {
                id: (products.length + 1).toString(),
                ...newProduct,
                totalStock: stock,
                minStock: min,
                status
            };
            setProducts([...products, productToAdd]);
        }

        setIsModalOpen(false);
        setEditingId(null);
        // Reset form
        setNewProduct({
            sku: '',
            name: '',
            category: 'Insumos',
            provider: '',
            warehouse: 'Bodega 1',
            totalStock: '',
            minStock: ''
        });
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            (product.sku?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.name?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.category?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'Todas las Categorías' || product.category === filterCategory;

        return matchesSearch && matchesCategory;
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const headers = [
            ['SKU', 'Nombre', 'Categoría', 'Proveedor', 'Bodega', 'Stock Inicial', 'Stock Mínimo']
        ];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla Productos");
        XLSX.writeFile(wb, "plantilla_carga_productos.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Skip header row and process data
            const newProductsFromExcel = (data.slice(1) as any[]).map((row: any, index: number) => {
                if (!row[0]) return null; // Skip empty rows

                const stock = Number(row[5]) || 0;
                const min = Number(row[6]) || 0;

                // Determine status
                let status = 'Saludable';
                if (stock <= min / 2) {
                    status = 'Crítico';
                } else if (stock <= min) {
                    status = 'Alerta';
                }

                return {
                    id: `excel-${Date.now()}-${index}`,
                    sku: String(row[0] || ''),
                    name: String(row[1] || ''),
                    category: String(row[2] || 'Insumos'),
                    provider: String(row[3] || ''),
                    warehouse: String(row[4] || 'Bodega 1'),
                    totalStock: stock,
                    minStock: min,
                    status
                };
            }).filter(p => p !== null);

            setProducts(prev => [...prev, ...newProductsFromExcel]);

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Maestro de Productos</h1>
                <p className="text-gray-500 mt-1">Gestión centralizada del inventario y niveles de stock.</p>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <input
                        type="text"
                        placeholder="Buscar por SKU, Nombre o Categoría..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option>Todas las Categorías</option>
                        <option>Insumos</option>
                        <option>Grasas</option>
                        <option>Repostería</option>
                    </select>
                    <button
                        onClick={() => openModal()}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        + Nuevo Producto
                    </button>
                    <div className="flex gap-2 ml-2 border-l pl-2 border-gray-300">
                        <button
                            onClick={handleDownloadTemplate}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Plantilla
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m-4 4v12" />
                            </svg>
                            Cargar Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Producto</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4">Bodega</th>
                                <th className="px-6 py-4 text-center">Stock Total</th>
                                <th className="px-6 py-4 text-center">Mínimo</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${product.totalStock < product.minStock ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{product.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.provider}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.warehouse}</td>
                                    <td className={`px-6 py-4 text-sm font-bold text-center ${product.totalStock < product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                                        {product.totalStock}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 text-center">{product.minStock}</td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(product.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button className="text-primary hover:text-orange-800 text-sm font-medium transition-colors">Ver Lotes</button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            onClick={() => openModal(product)}
                                            className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
                    <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled>Siguiente</button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        required
                                        value={newProduct.sku}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Ej: PAN-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select
                                        name="category"
                                        value={newProduct.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option>Insumos</option>
                                        <option>Grasas</option>
                                        <option>Repostería</option>
                                        <option>Lácteos</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={newProduct.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Ej: Harina Selecta 25kg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                <input
                                    type="text"
                                    name="provider"
                                    required
                                    value={newProduct.provider}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Ej: Molino A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega</label>
                                <select
                                    name="warehouse"
                                    value={newProduct.warehouse}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option>Bodega 1</option>
                                    <option>Bodega 2</option>
                                    <option>Bodega 3</option>
                                    <option>Bodega 4</option>
                                    <option>Bodega 5</option>
                                    <option>Cámara de Frío</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                                    <input
                                        type="number"
                                        name="totalStock"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={newProduct.totalStock}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                                    <input
                                        type="number"
                                        name="minStock"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={newProduct.minStock}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-orange-700 shadow-sm"
                                >
                                    {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
