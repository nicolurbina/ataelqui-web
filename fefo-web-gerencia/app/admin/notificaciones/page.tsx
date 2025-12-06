'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todas');
    const [filterRead, setFilterRead] = useState('Todas');
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for notifications from 'general_alerts'
        const q = query(collection(db, 'general_alerts'), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Map fields from general_alerts to component state
                    title: data.title,
                    message: data.desc, // 'desc' in general_alerts maps to 'message'
                    type: data.type || 'System',
                    timestamp: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
                    read: data.read || false, // Handle missing 'read' field
                    details: data.details || (data.expected !== undefined ? `Esperado: ${data.expected}\nContado: ${data.counted}\nDiferencia: ${data.counted - data.expected}` : '')
                };
            });
            setNotifications(notifs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'FEFO':
                return (
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'Stock':
                return (
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                );
            case 'Discrepancy':
                return (
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'Merma':
                return (
                    <div className="p-2 bg-brown-100 rounded-lg text-brown-600" style={{ backgroundColor: '#efebe9', color: '#795548' }}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                );
        }
    };

    const handleMarkAllAsRead = async () => {
        const batch = writeBatch(db);
        const unreadNotifications = notifications.filter(n => !n.read);

        unreadNotifications.forEach(n => {
            const ref = doc(db, 'general_alerts', n.id);
            batch.update(ref, { read: true });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleViewDetail = async (notification: any) => {
        setSelectedNotification(notification);
        setIsModalOpen(true);
        if (!notification.read) {
            try {
                const ref = doc(db, 'general_alerts', notification.id);
                await updateDoc(ref, { read: true });
            } catch (error) {
                console.error("Error marking as read:", error);
            }
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Estás seguro de eliminar esta notificación?')) {
            try {
                await deleteDoc(doc(db, 'general_alerts', id));
            } catch (error) {
                console.error("Error deleting notification:", error);
            }
        }
    };

    // Filter Logic
    const filteredNotifications = notifications.filter(notif => {
        const matchesSearch =
            notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Todas' || notif.type === filterType;
        const matchesRead = filterRead === 'Todas' ||
            (filterRead === 'Leídas' && notif.read) ||
            (filterRead === 'No leídas' && !notif.read);
        return matchesSearch && matchesType && matchesRead;
    });

    // Grouping Logic
    const groupedNotifications = filteredNotifications.reduce((groups: any, notif) => {
        const date = notif.timestamp;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let groupKey = 'Anterior';

        if (date.toDateString() === today.toDateString()) {
            groupKey = 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'Ayer';
        } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            groupKey = 'Esta Semana';
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(notif);
        return groups;
    }, {});

    const groupOrder = ['Hoy', 'Ayer', 'Esta Semana', 'Anterior'];

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Centro de Notificaciones</h1>
                    <p className="text-gray-500 mt-1">Alertas operativas y avisos del sistema.</p>
                </div>
                <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary font-medium hover:underline"
                >
                    Marcar todas como leídas
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Buscar notificaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="Todas">Todos los Tipos</option>
                    <option value="FEFO">FEFO</option>
                    <option value="Stock">Stock</option>
                    <option value="Discrepancy">Discrepancia</option>
                    <option value="Merma">Merma</option>
                    <option value="System">Sistema</option>
                </select>
                <select
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="Todas">Todas</option>
                    <option value="No leídas">No leídas</option>
                    <option value="Leídas">Leídas</option>
                </select>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Cargando notificaciones...</div>
                ) : (
                    <>
                        {groupOrder.map(group => {
                            const items = groupedNotifications[group];
                            if (!items || items.length === 0) return null;

                            return (
                                <div key={group}>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">{group}</h3>
                                    <div className="space-y-3">
                                        {items.map((notif: any) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleViewDetail(notif)}
                                                className={`bg-white p-5 rounded-xl border shadow-sm flex gap-4 transition-all hover:shadow-md cursor-pointer ${notif.read ? 'border-gray-200 opacity-75' : 'border-orange-100 ring-1 ring-orange-50'}`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <h3 className={`text-base font-bold ${notif.read ? 'text-gray-700' : 'text-primary'}`}>{notif.title}</h3>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {notif.type} • {notif.timestamp?.toLocaleString ? notif.timestamp.toLocaleString('es-CL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : ''}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => handleDelete(notif.id, e)}
                                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                                title="Eliminar notificación"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed mb-3 mt-2">{notif.message}</p>
                                                    {notif.details && (
                                                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 mb-2 whitespace-pre-line">
                                                            {notif.details}
                                                        </p>
                                                    )}
                                                    <span className="inline-flex items-center text-xs font-bold text-primary hover:text-orange-700 transition-colors">
                                                        Ver detalle
                                                        <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </div>
                                                {!notif.read && (
                                                    <div className="flex-shrink-0 self-center">
                                                        <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {Object.keys(groupedNotifications).length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No hay notificaciones que coincidan con los filtros.
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {isModalOpen && selectedNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                {getIcon(selectedNotification.type)}
                                <h3 className="text-lg font-bold text-gray-900">{selectedNotification.title}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mensaje</span>
                                <p className="text-gray-800 mt-1 text-lg">{selectedNotification.message}</p>
                            </div>
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles Adicionales</span>
                                <p className="text-gray-600 mt-1 text-sm leading-relaxed">{selectedNotification.details}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-400">
                                <span>{selectedNotification.timestamp?.toLocaleDateString ? selectedNotification.timestamp.toLocaleDateString('es-CL') : ''} {selectedNotification.timestamp?.toLocaleTimeString ? selectedNotification.timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">{selectedNotification.type}</span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
