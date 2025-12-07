'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { apiClient } from '@/utils/api';
import { createNotification } from '@/utils/notifications';
import { AuthContext } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('users');
    const [fefoDays, setFefoDays] = useState(7);
    const [warningDays, setWarningDays] = useState(30);
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [newException, setNewException] = useState({ productId: '', productName: '', days: '', warningDays: '' });
    const [products, setProducts] = useState<any[]>([]);

    // Auth Context
    const { user: authUser } = React.useContext(AuthContext) || {};

    // User State (Existing Mock/Local)
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Bodeguero', password: '' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ userId: '', newPassword: '' });
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

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



    // Fetch Data based on tab
    useEffect(() => {
        if (authUser) {
            authUser.getIdToken().then((token) => {
                apiClient.setToken(token);

                // Fetch current user role
                apiClient.getUser(authUser.uid).then((response) => {
                    if (response.success && response.data) {
                        setCurrentUserRole((response.data as any).role);
                    }
                });

                if (activeTab === 'users') {
                    fetchUsers();
                } else if (activeTab === 'providers') {
                    fetchProviders();
                } else if (activeTab === 'params') {
                    fetchConfig();
                    fetchProducts();
                }
            });
        }
    }, [activeTab, authUser]);

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
            } else {
                console.error('Error fetching users:', response.error);
                if (response.error?.includes('Unauthorized') || response.error?.includes('403')) {
                    alert('No tienes permisos para ver los usuarios. Asegúrate de ser Administrador.');
                }
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
                setNewUser({ name: '', email: '', role: 'Bodeguero', password: '' });
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

    const openPasswordModal = (userId: string) => {
        setPasswordData({ userId, newPassword: '' });
        setIsPasswordModalOpen(true);
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const response = await apiClient.updateUserPassword(passwordData.userId, passwordData.newPassword);
            if (response.success) {
                setIsPasswordModalOpen(false);
                setPasswordData({ userId: '', newPassword: '' });
                alert('Contraseña actualizada exitosamente');
            } else {
                alert('Error al actualizar contraseña: ' + response.error);
            }
        } catch (error) {
            console.error('Error updating password:', error);
            alert('Error al actualizar contraseña');
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
                    {/* Create User Section - Only for Admins */}
                    {currentUserRole === 'Administrador' && (
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
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="******"
                                    />
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
                    )}

                    {/* Users Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Rol</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    {currentUserRole === 'Administrador' && (
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {user.name || <span className="text-gray-400 italic">Sin Nombre</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.email || <span className="text-gray-400 italic">Sin Email</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.role || 'Sin Rol'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Activo' ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                                                {user.status || 'Desconocido'}
                                            </span>
                                        </td>
                                        {currentUserRole === 'Administrador' && (
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
                                                    onClick={() => openPasswordModal(user.id)}
                                                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                                                    title="Cambiar Contraseña"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Password Modal */}
                    {isPasswordModalOpen && (
                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                            <div className="bg-white p-6 rounded-xl shadow-2xl w-96 transform transition-all scale-100">
                                <h3 className="text-lg font-bold mb-4 text-gray-900">Cambiar Contraseña</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setIsPasswordModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleChangePassword}
                                        className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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



        </div>
    );
}
