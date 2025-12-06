'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

import { apiClient } from '../../../../utils/api';

interface ProductData {
    id: string;
    sku: string;
    name: string;
    brand?: string;
    category: string;
    provider: string;
    warehouse: string;
    totalStock: number;
    minStock: number;
    status: string;
}

export default function StockPage() {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState({
        sku: '',
        name: '',
        brand: '',
        category: 'Insumos',
        provider: '',
        warehouse: 'Bodega 1',
        totalStock: '',
        minStock: '',
        unitType: 'unit', // 'unit' | 'box'
        boxCount: '',
        unitsPerBox: '',
        batchNumber: '',
        expirationDate: ''
    });

    const [products, setProducts] = useState<ProductData[]>([]);
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas las Categorías');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, inventoryRes, providersRes] = await Promise.all([
                apiClient.getProducts(),
                apiClient.getInventory(),
                apiClient.getProviders()
            ]);

            if (productsRes.success && inventoryRes.success && productsRes.data && inventoryRes.data) {
                const productsData = productsRes.data as any[];
                const inventoryData = inventoryRes.data as any[];

                if (providersRes.success && providersRes.data) {
                    setProviders(providersRes.data as any[]);
                }

                const mergedData = productsData.map(product => {
                    // Calculate total stock from inventory items for this product
                    const productInventory = inventoryData.filter(item => item.productId === product.id);
                    const inventoryStock = productInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

                    // Use inventory stock if available, otherwise fallback to product's totalStock (for legacy data)
                    // Also check for 'stock' field just in case
                    const rawStock = product.totalStock !== undefined ? product.totalStock : (product as any).stock;
                    const fallbackStock = Number(rawStock) || 0;

                    const totalStock = inventoryStock > 0 ? inventoryStock : fallbackStock;

                    // Default minStock if not present (assuming 10 for now as it's not in Product type yet)
                    const minStock = product.minStock || 10;

                    let status = 'Saludable';
                    if (totalStock <= minStock / 2) {
                        status = 'Crítico';
                    } else if (totalStock <= minStock) {
                        status = 'Alerta';
                    }

                    return {
                        id: product.id,
                        sku: product.sku,
                        name: product.name,
                        brand: (product as any).brand,
                        category: product.category,
                        provider: product.provider,
                        warehouse: 'Múltiple', // Placeholder
                        totalStock,
                        minStock,
                        status
                    };
                });

                setProducts(mergedData);
            } else {
                setError('Error al cargar datos');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // View Details Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<ProductData | null>(null);
    const [productBatches, setProductBatches] = useState<any[]>([]);

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

    const openModal = async (product?: ProductData) => {
        if (product) {
            setEditingId(product.id);

            // Fetch inventory to get latest batch info
            let batchNumber = '';
            let expirationDate = '';

            try {
                const response = await apiClient.getInventory(); // We might want to filter by product ID in the API later for performance
                if (response.success && response.data) {
                    const allInventory = response.data as any[];
                    const productInventory = allInventory.filter(item => item.productId === product.id);

                    if (productInventory.length > 0) {
                        // Sort by creation date desc to get latest
                        productInventory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        const latest = productInventory[0];
                        batchNumber = latest.batch || '';
                        expirationDate = latest.expiryDate || '';
                    }
                }
            } catch (err) {
                console.error('Error fetching inventory details for edit:', err);
            }

            setNewProduct({
                sku: product.sku,
                name: product.name,
                brand: product.brand || '',
                category: product.category,
                provider: product.provider,
                warehouse: product.warehouse || 'Bodega 1',
                totalStock: product.totalStock.toString(),
                minStock: product.minStock.toString(),
                unitType: 'unit',
                boxCount: '',
                unitsPerBox: '',
                batchNumber,
                expirationDate
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
                minStock: '',
                unitType: 'unit',
                boxCount: '',
                unitsPerBox: '',
                batchNumber: '',
                expirationDate: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        let stock = 0;
        if (newProduct.unitType === 'box') {
            stock = Number(newProduct.boxCount) * Number(newProduct.unitsPerBox);
        } else {
            stock = Number(newProduct.totalStock);
        }

        const min = Number(newProduct.minStock);

        // Determine status based on stock levels
        let status = 'Saludable';
        if (stock <= min / 2) {
            status = 'Crítico';
        } else if (stock <= min) {
            status = 'Alerta';
        }

        try {
            if (editingId) {
                // Update existing product
                const response = await apiClient.updateProduct(editingId, {
                    ...newProduct,
                    totalStock: stock,
                    minStock: min,
                    status
                });

                if (response.success) {
                    fetchData(); // Refresh list
                } else {
                    alert('Error al actualizar producto');
                }
            } else {
                // Add new product
                const response = await apiClient.createProduct({
                    ...newProduct,
                    totalStock: stock,
                    minStock: min,
                    status
                });

                if (response.success) {
                    fetchData(); // Refresh list
                } else {
                    alert('Error al crear producto');
                }
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar producto');
        }

        setIsModalOpen(false);
        setEditingId(null);
        // Reset form
        setNewProduct({
            sku: '',
            name: '',
            brand: '',
            category: 'Insumos',
            provider: '',
            warehouse: 'Bodega 1',
            totalStock: '',
            minStock: '',
            unitType: 'unit',
            boxCount: '',
            unitsPerBox: '',
            batchNumber: '',
            expirationDate: ''
        });
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) return;

        try {
            const response = await apiClient.deleteProduct(id);
            if (response.success) {
                fetchData(); // Refresh list
            } else {
                alert('Error al eliminar producto');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error al eliminar producto');
        }
    };

    const handleViewDetails = async (product: ProductData) => {
        setViewingProduct(product);
        setIsViewModalOpen(true);
        setProductBatches([]); // Clear previous

        try {
            // Fetch inventory items for this product to show batches/lots
            const response = await apiClient.getInventory();
            if (response.success && response.data) {
                const allInventory = response.data as any[];
                // Filter for this product
                const batches = allInventory.filter(item => item.productId === product.id);
                setProductBatches(batches);
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
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
                                <th className="px-6 py-4">Marca</th>
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
                                    <td className="px-6 py-4 text-sm text-gray-500">{product.brand || '-'}</td>
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
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewDetails(product)}
                                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                title="Ver Lotes"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => openModal(product)}
                                                className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={newProduct.brand}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Ej: Selecta, Colun, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                <select
                                    name="provider"
                                    required
                                    value={newProduct.provider}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Seleccionar Proveedor</option>
                                    {providers.map((provider) => (
                                        <option key={provider.id} value={provider.name}>
                                            {provider.name}
                                        </option>
                                    ))}
                                </select>
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

                            {/* Unit Type Selection */}
                            <div className="flex gap-6 items-center py-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="unitType"
                                        value="unit"
                                        checked={newProduct.unitType === 'unit'}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-gray-700 font-medium">Unidad</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="unitType"
                                        value="box"
                                        checked={newProduct.unitType === 'box'}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                                    />
                                    <span className="text-gray-700 font-medium">Caja</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {newProduct.unitType === 'unit' ? (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
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
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">N° Cajas</label>
                                            <input
                                                type="number"
                                                name="boxCount"
                                                required
                                                min="0"
                                                placeholder="0"
                                                value={newProduct.boxCount}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Unid/Caja</label>
                                            <input
                                                type="number"
                                                name="unitsPerBox"
                                                required
                                                min="0"
                                                placeholder="0"
                                                value={newProduct.unitsPerBox}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    </>
                                )}
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

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                <div className="col-span-2">
                                    <h4 className="text-sm font-bold text-gray-900 mb-2">Datos del Lote / Vencimiento</h4>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Lote</label>
                                    <input
                                        type="text"
                                        name="batchNumber"
                                        value={newProduct.batchNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento</label>
                                    <input
                                        type="date"
                                        name="expirationDate"
                                        value={newProduct.expirationDate}
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
            {/* View Details Modal */}
            {isViewModalOpen && viewingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{viewingProduct.name}</h3>
                                <p className="text-sm text-gray-500">SKU: {viewingProduct.sku} | Categoría: {viewingProduct.category}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    <span className="block text-xs font-bold text-blue-600 uppercase mb-1">Stock Total</span>
                                    <span className="text-2xl font-bold text-blue-900">{viewingProduct.totalStock}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Mínimo</span>
                                    <span className="text-2xl font-bold text-gray-700">{viewingProduct.minStock}</span>
                                </div>
                                <div className={`p-4 rounded-xl border text-center ${viewingProduct.status === 'Crítico' ? 'bg-red-50 border-red-100' :
                                    viewingProduct.status === 'Alerta' ? 'bg-yellow-50 border-yellow-100' :
                                        'bg-green-50 border-green-100'
                                    }`}>
                                    <span className={`block text-xs font-bold uppercase mb-1 ${viewingProduct.status === 'Crítico' ? 'text-red-600' :
                                        viewingProduct.status === 'Alerta' ? 'text-yellow-600' :
                                            'text-green-600'
                                        }`}>Estado</span>
                                    <span className={`text-xl font-bold ${viewingProduct.status === 'Crítico' ? 'text-red-900' :
                                        viewingProduct.status === 'Alerta' ? 'text-yellow-900' :
                                            'text-green-900'
                                        }`}>{viewingProduct.status}</span>
                                </div>
                            </div>

                            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Desglose por Lotes / Ubicación</h4>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-4 py-2">Lote / ID</th>
                                            <th className="px-4 py-2">Ubicación</th>
                                            <th className="px-4 py-2">Vencimiento</th>
                                            <th className="px-4 py-2 text-right">Cantidad</th>
                                            <th className="px-4 py-2 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {productBatches.length > 0 ? (
                                            productBatches.map((batch) => (
                                                <tr key={batch.id}>
                                                    <td className="px-4 py-2 font-medium text-gray-900">{batch.batchNumber || batch.id.substring(0, 8)}</td>
                                                    <td className="px-4 py-2 text-gray-600">{batch.location || 'General'}</td>
                                                    <td className="px-4 py-2 text-gray-600">
                                                        {batch.expirationDate ? new Date(batch.expirationDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold">{batch.quantity}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${batch.status === 'damaged' ? 'bg-red-100 text-red-700' :
                                                            batch.status === 'expired' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                            {batch.status === 'damaged' ? 'Dañado' : batch.status === 'expired' ? 'Vencido' : 'OK'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No hay lotes registrados para este producto.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
