'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/utils/api';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await apiClient.getTasks();
            if (response.success && response.data) {
                setTasks(response.data as any[]);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to map backend status to UI status
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'in_progress': return 'En Curso';
            case 'completed': return 'Finalizada';
            default: return status;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgente': return 'border-red-500 ring-1 ring-red-100';
            case 'alta': return 'border-orange-500';
            default: return 'border-gray-300';
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Centro de Comando de Tareas</h1>
                <p className="text-gray-500 mt-1">Asignación y monitoreo de actividades de bodega en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Create Task Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 sticky top-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </span>
                            Asignar Nueva Tarea
                        </h2>

                        <form className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarea</label>
                                <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option>Picking Pedido</option>
                                    <option>Conteo Cíclico</option>
                                    <option>Revisión FEFO</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Ubicación</label>
                                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Ej: Pedido #405 o Pasillo B" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                                <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="">Seleccionar Bodeguero...</option>
                                    <option>Juan Pérez</option>
                                    <option>Pedro Soto</option>
                                    <option>Maria Gomez</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input type="radio" name="priority" className="text-primary focus:ring-primary" defaultChecked />
                                        <span className="ml-2 text-sm text-gray-700">Normal</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="radio" name="priority" className="text-orange-500 focus:ring-orange-500" />
                                        <span className="ml-2 text-sm text-gray-700">Alta</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="radio" name="priority" className="text-red-600 focus:ring-red-600" />
                                        <span className="ml-2 text-sm text-red-600 font-bold">Urgente</span>
                                    </label>
                                </div>
                            </div>

                            <button type="button" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all mt-4">
                                Enviar Tarea al Móvil
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Kanban Monitor */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Cargando tareas...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                            {/* Column: Pendientes */}
                            <div className="bg-gray-100/50 rounded-xl p-4 border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 flex justify-between items-center">
                                    Pendientes <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">
                                        {tasks.filter(t => t.status === 'pending').length}
                                    </span>
                                </h3>
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === 'pending').map(task => (
                                        <div key={task.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase">{task.type}</span>
                                                {task.priority === 'Urgente' && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">URGENTE</span>}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">{task.title}</h4>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-2">
                                                    {(task.assignedTo || 'U').charAt(0)}
                                                </div>
                                                {task.assignedTo || 'Sin asignar'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column: En Curso */}
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                <h3 className="text-xs font-bold text-blue-600 uppercase mb-4 flex justify-between items-center">
                                    En Curso <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                                        {tasks.filter(t => t.status === 'in_progress').length}
                                    </span>
                                </h3>
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === 'in_progress').map(task => (
                                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-blue-500 uppercase">{task.type}</span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded animate-pulse">Trabajando...</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">{task.title}</h4>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-2">
                                                    {(task.assignedTo || 'U').charAt(0)}
                                                </div>
                                                {task.assignedTo}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column: Finalizadas */}
                            <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                                <h3 className="text-xs font-bold text-green-600 uppercase mb-4 flex justify-between items-center">
                                    Finalizadas <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px]">
                                        {tasks.filter(t => t.status === 'completed').length}
                                    </span>
                                </h3>
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === 'completed').map(task => (
                                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 opacity-75">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-green-600 uppercase">{task.type}</span>
                                                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">HOY</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-through decoration-gray-400">{task.title}</h4>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold mr-2">
                                                    {(task.assignedTo || 'U').charAt(0)}
                                                </div>
                                                {task.assignedTo}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
