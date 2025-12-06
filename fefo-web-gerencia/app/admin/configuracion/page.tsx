'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { apiClient } from '@/utils/api';
import { createNotification } from '@/utils/notifications';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('users');
    const [fefoDays, setFefoDays] = useState(7);
    const [warningDays, setWarningDays] = useState(30);
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [newException, setNewException] = useState({ productId: '', productName: '', days: '', warningDays: '' });
    const [products, setProducts] = useState<any[]>([]);

    // User State (Existing Mock/Local)
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Bodeguero' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Providers State (New API-based)
    const [providers, setProviders] = useState<any[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [newProvider, setNewProvider] = useState({
        name: '',
        rut: '',
        email: '',
        phone: '',
        status: 'Activo'
    });
    const [isEditProviderModalOpen, setIsEditProviderModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<any>(null);

    // Product & Lots State
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productLots, setProductLots] = useState<any[]>([]);
    const [isLotModalOpen, setIsLotModalOpen] = useState(false);
    const [newLot, setNewLot] = useState({
        batch: '',
        quantity: '' as string | number,
        expiryDate: ''
    });

    const [editingLotId, setEditingLotId] = useState<string | null>(null);

    // Products State (New)
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        brand: '',
        category: '',
        unit: 'UN',
        price: '',
        cost: '',
        description: ''
    });
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Fetch Data based on tab
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'providers') {
            fetchProviders();
        } else if (activeTab === 'params' || activeTab === 'products') {
            fetchConfig();
            fetchProducts();
        }
    }, [activeTab]);

    const fetchProviders = async () => {
        try {
            setLoadingProviders(true);
            const response = await apiClient.getProviders();
            if (response.success) {
                setProviders(response.data as any[]);
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
        } finally {
            setLoadingProviders(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiClient.getUsers();
            if (response.success) {
                setUsers(response.data as any[]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            const response = await apiClient.getConfig();
            if (response.success && response.data) {
                const data = response.data as any;
                setFefoDays(data.criticalDays || 7);
                setWarningDays(data.warningDays || 30);
                setExceptions(data.exceptions || []);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await apiClient.getProducts();
            if (response.success) {
                setProducts(response.data as any[]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchProductLots = async (productId: string) => {
        try {
            const response = await apiClient.getInventoryByProduct(productId);
            if (response.success) {
                setProductLots(response.data as any[]);
            } else {
                console.error('Error fetching lots:', response.error);
                alert('Error al cargar lotes: ' + response.error);
            }
        } catch (error) {
            console.error('Error fetching lots:', error);
            alert('Error al cargar lotes. Verifique su conexión o permisos.');
        }
    };

    const handleAddException = async () => {
        if (!newException.productId || !newException.days) return;

        const updatedExceptions = [...exceptions, { ...newException, warningDays: warningDays }];
        setExceptions(updatedExceptions);

        // Save immediately
        await apiClient.saveConfig({
            criticalDays: fefoDays,
            warningDays: warningDays,
            exceptions: updatedExceptions
        });

        // Create Notification
        await createNotification(
            'System',
            'Excepción Agregada',
            `Se agregó una excepción para el producto "${newException.productName}".`,
            `Días críticos: ${newException.days}.`
        );

        setNewException({ productId: '', productName: '', days: '', warningDays: '' });
        alert('Excepción agregada correctamente.');
    };

    const handleRemoveException = async (index: number) => {
        const removed = exceptions[index];
        const newExceptions = [...exceptions];
        newExceptions.splice(index, 1);
        setExceptions(newExceptions);

        await apiClient.saveConfig({
            criticalDays: fefoDays,
            warningDays: warningDays,
            exceptions: newExceptions
        });

        await createNotification(
            'System',
            'Excepción Eliminada',
            `Se eliminó la excepción para el producto "${removed.productName}".`
        );
    };

    const handleSaveConfig = async () => {
        try {
            const response = await apiClient.saveConfig({
                criticalDays: fefoDays,
                warningDays: warningDays,
                exceptions
            });
            if (response.success) {
                await createNotification(
                    'System',
                    'Configuración Actualizada',
                    'Se han actualizado los parámetros globales del sistema.'
                );
                alert('Configuración guardada exitosamente');
            } else {
                alert('Error al guardar configuración');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar configuración');
        }
    };

    // Lot Management Handlers
    const openLotModal = (product: any) => {
        setSelectedProduct(product);
        fetchProductLots(product.id);
        setIsLotModalOpen(true);
    };

    const handleAddLot = async () => {
        if (!selectedProduct || !newLot.batch || !newLot.quantity || !newLot.expiryDate) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }

        try {
            const lotData = {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                batch: newLot.batch,
                quantity: Number(newLot.quantity),
                expiryDate: newLot.expiryDate,
                status: 'Disponible'
            };

            let response;
            if (editingLotId) {
                response = await apiClient.updateInventoryItem(editingLotId, lotData);
            } else {
                response = await apiClient.addInventoryItem(lotData);
            }

            if (response.success) {
                // Notify
                if (!editingLotId) {
                    // 1. Stock Notification
                    await createNotification(
                        'Stock',
                        'Nuevo Lote Agregado',
                        `Se agregó el lote ${newLot.batch} al producto ${selectedProduct.name}`,
                        `Cantidad: ${newLot.quantity}`
                    );

                    // 2. FEFO Alert Logic
                    const today = new Date();
                    const expiry = new Date(newLot.expiryDate);
                    const diffTime = expiry.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Check for specific product exception or use global settings
                    const exception = exceptions.find(ex => ex.productId === selectedProduct.id);
                    const criticalThreshold = exception ? parseInt(exception.days) : fefoDays;
                    const warningThreshold = warningDays;

                    if (diffDays <= criticalThreshold) {
                        await createNotification(
                            'FEFO',
                            'Alerta Crítica de Vencimiento',
                            `El nuevo lote ${newLot.batch} de ${selectedProduct.name} vence en ${diffDays} días.`,
                            `Vence el: ${newLot.expiryDate}. Umbral crítico: ${criticalThreshold} días.`
                        );
                    } else if (diffDays <= warningThreshold) {
                        await createNotification(
                            'FEFO',
                            'Alerta Preventiva de Vencimiento',
                            `El nuevo lote ${newLot.batch} de ${selectedProduct.name} vence en ${diffDays} días.`,
                            `Vence el: ${newLot.expiryDate}. Umbral preventivo: ${warningThreshold} días.`
                        );
                    }
                }

                fetchProductLots(selectedProduct.id);
                fetchProductLots(selectedProduct.id);
                setNewLot({ batch: '', quantity: '', expiryDate: '' });
                setEditingLotId(null);
                setEditingLotId(null);
            } else {
                alert('Error al guardar lote');
            }
        } catch (error) {
            console.error('Error saving lot:', error);
            alert('Error al guardar lote');
        }
    };

    const handleEditLot = (lot: any) => {
        setNewLot({
            batch: lot.batch,
            quantity: lot.quantity,
            expiryDate: lot.expiryDate
        });
        setEditingLotId(lot.id);
    };

    const handleDeleteLot = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este lote?')) return;

        try {
            const response = await apiClient.deleteInventoryItem(id);
            if (response.success) {
                fetchProductLots(selectedProduct.id);
            } else {
                alert('Error al eliminar lote');
            }
        } catch (error) {
            console.error('Error deleting lot:', error);
            alert('Error al eliminar lote');
        }
    };

    const handleCancelEdit = () => {
        setNewLot({ batch: '', quantity: '', expiryDate: '' });
        setEditingLotId(null);
    };

    // Helper Functions
    const formatRUT = (value: string) => {
        const clean = value.replace(/[^0-9kK]/g, '');
        if (!clean) return '';
        if (clean.length === 1) return clean;

        const body = clean.slice(0, -1);
        const dv = clean.slice(-1).toUpperCase();

        return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
    };

    const formatPhone = (value: string) => {
        // Remove non-numeric characters
        let clean = value.replace(/\D/g, '');

        // If empty, return empty
        if (clean.length === 0) return '';

        // If user is starting to type, ensure it starts with 569
        if (!clean.startsWith('569')) {
            // If they typed '9', assume they meant 569
            if (clean.startsWith('9')) clean = '56' + clean;
            else clean = '569' + clean;
        }

        // Limit to 11 digits (56 9 XXXX XXXX)
        if (clean.length > 11) clean = clean.slice(0, 11);

        // Format
        let formatted = '+';
        if (clean.length > 0) formatted += clean.slice(0, 2); // 56
        if (clean.length > 2) formatted += ' ' + clean.slice(2, 3); // 9
        if (clean.length > 3) formatted += ' ' + clean.slice(3, 7); // XXXX
        if (clean.length > 7) formatted += ' ' + clean.slice(7); // XXXX

        return formatted;
    };

    const formatDate = (date: any) => {
        if (!date) return '-';
        // Handle Firestore Timestamp
        if (typeof date === 'object' && 'seconds' in date) {
            return new Date(date.seconds * 1000).toLocaleDateString('es-CL');
        }
        // Handle string or Date object
        return new Date(date).toLocaleDateString('es-CL');
    };

    // User Handlers
    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email) {
            alert('Nombre y Email son obligatorios');
            return;
        }

        try {
            const response = await apiClient.createUser({
                ...newUser,
                status: 'Activo'
            });

            if (response.success) {
                fetchUsers();
                setNewUser({ name: '', email: '', role: 'Bodeguero' });
                alert('Usuario creado exitosamente');
            } else {
                alert('Error al crear usuario: ' + response.error);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error al crear usuario');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            const response = await apiClient.deleteUser(id);
            if (response.success) {
                fetchUsers();
            } else {
                alert('Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        try {
            const response = await apiClient.updateUser(editingUser.id, editingUser);
            if (response.success) {
                fetchUsers();
                setIsEditModalOpen(false);
                setEditingUser(null);
                alert('Usuario actualizado exitosamente');
            } else {
                alert('Error al actualizar usuario');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario');
        }
    };

    // Provider Handlers
    const handleCreateProvider = async () => {
        if (!newProvider.name || !newProvider.rut) {
            alert('Nombre y RUT son obligatorios');
            return;
        }

        try {
            const response = await apiClient.createProvider(newProvider);
            if (response.success) {
                fetchProviders();
                setNewProvider({ name: '', rut: '', email: '', phone: '', status: 'Activo' });
            } else {
                alert('Error al crear proveedor');
            }
        } catch (error) {
            console.error('Error creating provider:', error);
            alert('Error al crear proveedor');
        }
    };

    const handleDeleteProvider = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

        try {
            const response = await apiClient.deleteProvider(id);
            if (response.success) {
                fetchProviders();
            } else {
                alert('Error al eliminar proveedor');
            }
        } catch (error) {
            console.error('Error deleting provider:', error);
            alert('Error al eliminar proveedor');
        }
    };

    const openEditProviderModal = (provider: any) => {
        setEditingProvider({ ...provider });
        setIsEditProviderModalOpen(true);
    };

    const handleUpdateProvider = async () => {
        try {
            const response = await apiClient.updateProvider(editingProvider.id, editingProvider);
            if (response.success) {
                fetchProviders();
                setIsEditProviderModalOpen(false);
                setEditingProvider(null);
            } else {
                alert('Error al actualizar proveedor');
            }
        } catch (error) {
            console.error('Error updating provider:', error);
            alert('Error al actualizar proveedor');
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [['Nombre', 'RUT', 'Email', 'Telefono']];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(headers);
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
        XLSX.writeFile(wb, 'plantilla_proveedores.xlsx');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Skip header row
            const rows = data.slice(1) as any[];

            let successCount = 0;
            for (const row of rows) {
                if (row[0]) { // Check if name exists
                    const providerData = {
                        name: row[0],
                        rut: row[1] || '',
                        email: row[2] || '',
                        phone: row[3] || '',
                        address: '',
                        status: 'Activo'
                    };
                    try {
                        await apiClient.createProvider(providerData);
                        successCount++;
                    } catch (err) {
                        console.error('Error importing row:', row, err);
                    }
                }
            }

            if (successCount > 0) {
                alert(`Se importaron ${successCount} proveedores exitosamente.`);
                fetchProviders();
            } else {
                alert('No se pudieron importar proveedores. Verifique el formato del archivo.');
            }

            // Reset input
            e.target.value = '';
        };
        reader.readAsBinaryString(file);
    };

    // Product Handlers
    const handleCreateProduct = async () => {
        if (!newProduct.name || !newProduct.sku) {
            alert('Nombre y SKU son obligatorios');
            return;
        }

        try {
            const response = await apiClient.createProduct({
                ...newProduct,
                price: Number(newProduct.price) || 0,
                cost: Number(newProduct.cost) || 0
            });

            if (response.success) {
                fetchProducts();
                setNewProduct({
                    name: '',
                    sku: '',
                    brand: '',
                    category: '',
                    unit: 'UN',
                    price: '',
                    cost: '',
                    description: ''
                });
                setIsProductModalOpen(false);
                alert('Producto creado exitosamente');
            } else {
                alert('Error al crear producto: ' + response.error);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Error al crear producto');
        }
    };

    const handleProductFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                if (Array.isArray(json)) {
                    let successCount = 0;
                    for (const item of json) {
                        if (item.name && item.sku) {
                            try {
                                await apiClient.createProduct(item);
                                successCount++;
                            } catch (err) {
                                console.error('Error importing product:', item, err);
                            }
                        }
                    }
                    if (successCount > 0) {
                        alert(`Se importaron ${successCount} productos exitosamente.`);
                        fetchProducts();
                    } else {
                        alert('No se pudieron importar productos.');
                    }
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('Error al leer el archivo JSON');
            }
            // Reset input
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const loadSeedData = async () => {
        if (!confirm('¿Cargar datos de ejemplo (captura de pantalla)? Esto agregará productos a la base de datos.')) return;

        try {
            const response = await fetch('/products_seed.json'); // Assuming we can serve it or just import it dynamically if placed in public
            // Since we placed it in the root, let's try to import it directly or just hardcode the fetch if it was in public. 
            // Actually, for simplicity in this environment, I'll just fetch it if I move it to public, OR I can just hardcode the data here for the "Quick Load" button.
            // But wait, I put it in the root. Let's move it to public or just read it via an API route? 
            // Client-side cannot read root files directly. 
            // I will implement a quick "Load Screenshot Data" button that uses the data I already know.

            const seedData = [
                { "sku": "7506195144947", "name": "Jdjs", "brand": "-", "category": "Hshs", "unit": "UN" },
                { "sku": "4r", "name": "H and", "brand": "-", "category": "Grasas", "unit": "UN" },
                { "sku": "1", "name": "Pan", "brand": "-", "category": "Insumos", "unit": "UN" },
                { "sku": "50146", "name": "caravella aljafor", "brand": "-", "category": "Insumos", "unit": "UN" },
                { "sku": "731199054801", "name": "Cafe", "brand": "-", "category": "Repostería", "unit": "UN" },
                { "sku": "7807910030782", "name": "Ñññññññññ", "brand": "-", "category": "Insumos", "unit": "UN" },
                { "sku": "5ur", "name": "Harina", "brand": "-", "category": "Grasas", "unit": "UN" },
                { "sku": "123", "name": "Y", "brand": "-", "category": "Insumos", "unit": "UN" },
                { "sku": "exp://10.35.6.160:8081", "name": "Kslskslslksa", "brand": "-", "category": "Insumos", "unit": "UN" },
                { "sku": "52415", "name": "pastelera plus", "brand": "-", "category": "Insumos", "unit": "UN" }
            ];

            let successCount = 0;
            for (const item of seedData) {
                // Check if exists first to avoid duplicates? API might handle it or just create new.
                // For now, just create.
                try {
                    await apiClient.createProduct({ ...item, price: 0, cost: 0, description: '' });
                    successCount++;
                } catch (err) {
                    console.error('Error seeding:', err);
                }
            }
            alert(`Se cargaron ${successCount} productos de ejemplo.`);
            fetchProducts();

        } catch (error) {
            console.error('Error loading seed data:', error);
            alert('Error al cargar datos de ejemplo');
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Administración y Configuración</h1>
                <p className="text-gray-500 mt-1">Gestión de usuarios, roles, proveedores y parámetros del sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit mb-8">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Usuarios y Roles
                </button>
                <button
                    onClick={() => setActiveTab('providers')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'providers' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Proveedores
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Productos y Lotes
                </button>
                <button
                    onClick={() => setActiveTab('params')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'params' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Parámetros del Sistema
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' ? (
                <div className="space-y-6">
                    {/* Create User Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Crear Nuevo Usuario</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Ej: Ana Silva"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Corporativo</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="ana@ataelqui.cl"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                >
                                    <option>Bodeguero</option>
                                    <option>Supervisor</option>
                                    <option>Administrador</option>
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    onClick={handleCreateUser}
                                    className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                                >
                                    + Crear Usuario
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Rol</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Activo' ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'providers' ? (
                <div className="space-y-6">
                    {/* Bulk Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar Plantilla
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition-colors">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Carga Masiva
                            </button>
                        </div>
                    </div>

                    {/* Create Provider Section */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Registrar Nuevo Proveedor</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre / Razón Social</label>
                                <input
                                    type="text"
                                    value={newProvider.name}
                                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    placeholder="Ej: Distribuidora Los Andes"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RUT</label>
                                <input
                                    type="text"
                                    value={newProvider.rut}
                                    onChange={(e) => setNewProvider({ ...newProvider, rut: formatRUT(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    placeholder="76.xxx.xxx-x"
                                    maxLength={12}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Contacto</label>
                                <input
                                    type="email"
                                    value={newProvider.email}
                                    onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    placeholder="contacto@proveedor.cl"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    value={newProvider.phone}
                                    onChange={(e) => setNewProvider({ ...newProvider, phone: formatPhone(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    placeholder="+56 9 1234 5678"
                                    maxLength={16}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                                <select
                                    value={newProvider.status}
                                    onChange={(e) => setNewProvider({ ...newProvider, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                >
                                    <option>Activo</option>
                                    <option>Inactivo</option>
                                </select>
                            </div>
                            <div>
                                <button
                                    onClick={handleCreateProvider}
                                    className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                                >
                                    + Crear Proveedor
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Providers Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">RUT</th>
                                    <th className="px-6 py-4">Contacto</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingProviders ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando proveedores...</td>
                                    </tr>
                                ) : providers.length > 0 ? (
                                    providers.map((provider) => (
                                        <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{provider.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{provider.rut}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span>{provider.email}</span>
                                                    <span className="text-xs text-gray-400">{provider.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${provider.status === 'Activo' ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                                                    {provider.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => openEditProviderModal(provider)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProvider(provider.id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
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
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay proveedores registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'products' ? (
                <div className="space-y-6">
                    {/* Product Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={loadSeedData}
                            className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-sm font-bold hover:bg-yellow-200 shadow-sm transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Cargar Datos Captura
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleProductFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Carga Masiva (JSON)
                            </button>
                        </div>
                        <button
                            onClick={() => setIsProductModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-700 shadow-sm transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Crear Producto
                        </button>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Código (SKU)</th>
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Marca</th>
                                    <th className="px-6 py-4">Categoría</th>
                                    <th className="px-6 py-4">Unidad</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-mono text-blue-600">{product.sku}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{product.brand || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{product.category || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{product.unit || 'UN'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openLotModal(product)}
                                                    className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors"
                                                >
                                                    Gestionar Lotes
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay productos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 max-w-2xl">
                    {/* Parameters Section */}
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Configuración de Alertas FEFO</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Días para Alerta Crítica (Rojo)</label>
                                <p className="text-xs text-gray-500 mb-3">Los productos que venzan en menos de estos días aparecerán en rojo en el dashboard.</p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={fefoDays}
                                        onChange={(e) => setFefoDays(parseInt(e.target.value))}
                                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center font-bold text-gray-900 focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-600">días</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Días para Alerta Preventiva (Amarillo)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={warningDays}
                                        onChange={(e) => setWarningDays(parseInt(e.target.value))}
                                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center font-bold text-gray-900 focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-600">días</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-md font-bold text-gray-900 mb-4">Excepciones por Producto</h3>
                                <p className="text-xs text-gray-500 mb-4">Configura días de alerta específicos para ciertos productos que requieren un control más estricto o más relajado.</p>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
                                            <select
                                                value={newException.productId}
                                                onChange={(e) => {
                                                    const product = products.find(p => p.id === e.target.value);
                                                    setNewException({ ...newException, productId: e.target.value, productName: product?.name || '' });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Días Críticos</label>
                                            <input
                                                type="number"
                                                value={newException.days}
                                                onChange={(e) => setNewException({ ...newException, days: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                                placeholder="Ej: 3"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <button
                                                onClick={handleAddException}
                                                className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                + Agregar Excepción
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* List of Exceptions */}
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                                            <tr>
                                                <th className="px-4 py-3">Producto</th>
                                                <th className="px-4 py-3 text-center">Días Alerta</th>
                                                <th className="px-4 py-3 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {exceptions.length > 0 ? (
                                                exceptions.map((ex, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{ex.productName}</td>
                                                        <td className="px-4 py-3 text-center font-bold text-red-600">{ex.days} días</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleRemoveException(index)}
                                                                className="text-red-500 hover:text-red-700 text-xs font-bold"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-center text-gray-500">No hay excepciones configuradas.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleSaveConfig}
                                    className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-md"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Editar Usuario</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                >
                                    <option>Bodeguero</option>
                                    <option>Supervisor</option>
                                    <option>Administrador</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    value={editingUser.status}
                                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                >
                                    <option>Activo</option>
                                    <option>Inactivo</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateUser}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-orange-700 shadow-sm"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Provider Modal */}
            {isEditProviderModalOpen && editingProvider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Editar Proveedor</h3>
                            <button onClick={() => setIsEditProviderModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social</label>
                                <input
                                    type="text"
                                    value={editingProvider.name}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                                <input
                                    type="text"
                                    value={editingProvider.rut}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, rut: formatRUT(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    maxLength={12}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingProvider.email}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    value={editingProvider.phone}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, phone: formatPhone(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    maxLength={16}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select
                                    value={editingProvider.status}
                                    onChange={(e) => setEditingProvider({ ...editingProvider, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                >
                                    <option>Activo</option>
                                    <option>Inactivo</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditProviderModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateProvider}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-orange-700 shadow-sm"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lot Management Modal */}
            {isLotModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Gestión de Lotes</h3>
                                <p className="text-sm text-gray-500">{selectedProduct.name} ({selectedProduct.sku})</p>
                            </div>
                            <button onClick={() => setIsLotModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Add New Lot */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">{editingLotId ? 'Editar Lote' : 'Agregar Nuevo Lote'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">N° Lote</label>
                                        <input
                                            type="text"
                                            value={newLot.batch}
                                            onChange={(e) => setNewLot({ ...newLot, batch: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="L-123"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Vencimiento</label>
                                        <input
                                            type="date"
                                            value={newLot.expiryDate}
                                            onChange={(e) => setNewLot({ ...newLot, expiryDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            value={newLot.quantity}
                                            onChange={(e) => setNewLot({ ...newLot, quantity: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="md:col-span-1 flex gap-2">
                                        {editingLotId && (
                                            <button
                                                onClick={handleCancelEdit}
                                                className="flex-1 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAddLot}
                                            className={`flex-1 py-2 text-white font-bold rounded-lg transition-colors text-sm ${editingLotId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            {editingLotId ? 'Actualizar' : '+ Agregar'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Lots List */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Lotes Existentes</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-xs text-gray-500 uppercase font-bold">
                                            <tr>
                                                <th className="px-4 py-3">Lote</th>
                                                <th className="px-4 py-3">Vencimiento</th>
                                                <th className="px-4 py-3 text-right">Cantidad</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                                <th className="px-4 py-3 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {productLots.length > 0 ? (
                                                productLots.map((lot) => (
                                                    <tr key={lot.id}>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{lot.batch}</td>
                                                        <td className="px-4 py-3 text-gray-600">{formatDate(lot.expiryDate)}</td>
                                                        <td className="px-4 py-3 text-right font-bold">{lot.quantity}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                                                                {lot.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleEditLot(lot)}
                                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLot(lot.id)}
                                                                    className="text-red-600 hover:text-red-800 font-medium text-xs"
                                                                >
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay lotes registrados para este producto.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Create Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Nuevo Producto</h3>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: Harina"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código *</label>
                                    <input
                                        type="text"
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                        placeholder="Ej: 780..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                    <input
                                        type="text"
                                        value={newProduct.brand}
                                        onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <input
                                        type="text"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                                    <select
                                        value={newProduct.unit}
                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="UN">Unidad (UN)</option>
                                        <option value="KG">Kilogramo (KG)</option>
                                        <option value="L">Litro (L)</option>
                                        <option value="CJ">Caja (CJ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                    <input
                                        type="number"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
                                    <input
                                        type="number"
                                        value={newProduct.cost}
                                        onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                                    rows={3}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateProduct}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-orange-700 shadow-sm"
                                >
                                    Crear Producto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
