'use client';

import React, { useState } from 'react';

// Mock Data
const initialTasks = [
    { id: 1, title: 'Revisar Stock de Harina', assignee: 'Juan Pérez', priority: 'Alta', status: 'Pendiente', date: '25/11/2025' },
    { id: 2, title: 'Limpieza de Bodega 2', assignee: 'María González', priority: 'Media', status: 'En Progreso', date: '26/11/2025' },
    { id: 3, title: 'Inventario Cíclico', assignee: 'Carlos López', priority: 'Baja', status: 'Completada', date: '24/11/2025' },
    { id: 4, title: 'Verificar Devoluciones', assignee: 'Juan Pérez', priority: 'Urgente', status: 'Pendiente', date: '25/11/2025' },
];

export default function KanbanMonitorPage() {
    const [tasks, setTasks] = useState(initialTasks);

    const moveTask = (taskId: number, newStatus: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgente': return 'bg-red-100 text-red-700 border-red-200';
            case 'Alta': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Media': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    const renderColumn = (title: string, status: string, bgColor: string) => {
        const columnTasks = tasks.filter(task => task.status === status);

        return (
            <div className={`flex-1 min-w-[300px] bg-gray-100 rounded-xl p-4 flex flex-col h-full`}>
                <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${bgColor === 'bg-blue-50' ? 'border-blue-200' : bgColor === 'bg-yellow-50' ? 'border-yellow-200' : 'border-green-200'}`}>
                    <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wider">{title}</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">{columnTasks.length}</span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    {columnTasks.map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                                <span className="text-xs text-gray-400">{task.date}</span>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-3 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {task.assignee}
                            </p>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                                {status !== 'Pendiente' && (
                                    <button
                                        onClick={() => moveTask(task.id, status === 'En Progreso' ? 'Pendiente' : 'En Progreso')}
                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        title="Mover atrás"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}
                                {status !== 'Completada' && (
                                    <button
                                        onClick={() => moveTask(task.id, status === 'Pendiente' ? 'En Progreso' : 'Completada')}
                                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                        title="Mover adelante"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 h-screen bg-gray-50/50 flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monitor de Tareas</h1>
                    <p className="text-gray-500 mt-1">Visualiza y gestiona el flujo de trabajo del equipo.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Filtrar
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-700 shadow-sm">
                        Nueva Tarea
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                {renderColumn('Pendiente', 'Pendiente', 'bg-blue-50')}
                {renderColumn('En Progreso', 'En Progreso', 'bg-yellow-50')}
                {renderColumn('Completada', 'Completada', 'bg-green-50')}
            </div>
        </div>
    );
}
