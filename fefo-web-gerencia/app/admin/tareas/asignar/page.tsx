'use client';

import React, { useState } from 'react';
import DatePicker from '@/components/ui/DatePicker';

export default function AssignTaskPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignee, setAssignee] = useState('');
    const [priority, setPriority] = useState('Media');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Validation
        if (!title || !assignee || !dueDate) {
            alert('Por favor complete todos los campos obligatorios.');
            return;
        }

        // Mock submission logic
        console.log({ title, description, assignee, priority, dueDate });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Reset form
        setTitle('');
        setDescription('');
        setAssignee('');
        setPriority('Media');
        setDueDate(null);
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/50 flex justify-center">
            <div className="w-full max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Asignar Nueva Tarea</h1>
                    <p className="text-gray-500 mt-1">Crea y asigna tareas a los miembros del equipo.</p>
                </div>

                {showSuccess && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center animate-fade-in">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Tarea asignada exitosamente.
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Tarea</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Ej: Revisar Stock de Harina"
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Detalles de la tarea..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Asignado a */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                                <select
                                    required
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Seleccionar Usuario...</option>
                                    <option value="Juan Pérez">Juan Pérez</option>
                                    <option value="María González">María González</option>
                                    <option value="Carlos López">Carlos López</option>
                                </select>
                            </div>

                            {/* Prioridad */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="Baja">Baja</option>
                                    <option value="Media">Media</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Urgente">Urgente</option>
                                </select>
                            </div>
                        </div>

                        {/* Fecha de Vencimiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                            <div className="w-full md:w-1/2">
                                <DatePicker selectedDate={dueDate} onChange={setDueDate} placeholder="Seleccionar fecha límite" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                            <button type="button" className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all">
                                Asignar Tarea
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
