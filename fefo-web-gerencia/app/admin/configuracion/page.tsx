'use client';

import React, { useState } from 'react';

// Mock Data for Users
const users = [
    { id: '1', name: 'Juan Pérez', email: 'juan@ataelqui.cl', role: 'Bodeguero', status: 'Activo' },
    { id: '2', name: 'Maria Gomez', email: 'maria@ataelqui.cl', role: 'Supervisor', status: 'Activo' },
    { id: '3', name: 'Pedro Soto', email: 'pedro@ataelqui.cl', role: 'Bodeguero', status: 'Inactivo' },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('users');
    const [fefoDays, setFefoDays] = useState(7);

    // User State
    const [users, setUsers] = useState([
        { id: '1', name: 'Juan Pérez', email: 'juan@ataelqui.cl', role: 'Bodeguero', status: 'Activo' },
        { id: '2', name: 'Maria Gomez', email: 'maria@ataelqui.cl', role: 'Supervisor', status: 'Activo' },
        { id: '3', name: 'Pedro Soto', email: 'pedro@ataelqui.cl', role: 'Bodeguero', status: 'Inactivo' },
    ]);

    // Create User State
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Bodeguero' });

    // Edit User State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Handlers
    const handleCreateUser = () => {
        if (!newUser.name || !newUser.email) return;
        const user = {
            id: Date.now().toString(),
            ...newUser,
            status: 'Activo'
        };
        setUsers([...users, user]);
        setNewUser({ name: '', email: '', role: 'Bodeguero' });
    };

    const handleDeleteUser = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = () => {
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Administración y Configuración</h1>
                <p className="text-gray-500 mt-1">Gestión de usuarios, roles y parámetros del sistema.</p>
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
                                        defaultValue={30}
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
                                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                                                <option>Seleccionar...</option>
                                                <option>Levadura Fresca 500g</option>
                                                <option>Crema Pastelera</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Días Críticos</label>
                                            <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" placeholder="Ej: 3" />
                                        </div>
                                        <div className="md:col-span-1">
                                            <button className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
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
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-gray-900">Levadura Fresca 500g</td>
                                                <td className="px-4 py-3 text-center font-bold text-red-600">3 días</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button className="text-red-500 hover:text-red-700 text-xs font-bold">Eliminar</button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-md">
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
        </div>
    );
}
