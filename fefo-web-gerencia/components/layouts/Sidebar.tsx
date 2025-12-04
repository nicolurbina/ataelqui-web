'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/utils/api';

const Sidebar = () => {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        inventario: true,
        tareas: false,
        devoluciones: false,
    });
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // Fetch various alerts/counts
            const [fefoRes, tasksRes, returnsRes] = await Promise.all([
                apiClient.getFefoAlerts(),
                apiClient.getTasks({ status: 'pending' }),
                apiClient.getReturns({ status: 'pending' })
            ]);

            let count = 0;

            if (fefoRes.success && fefoRes.data) {
                count += (fefoRes.data as any).alertsCount || 0;
            }

            if (tasksRes.success && Array.isArray(tasksRes.data)) {
                count += tasksRes.data.length;
            }

            if (returnsRes.success && Array.isArray(returnsRes.data)) {
                count += returnsRes.data.length;
            }

            setNotificationCount(count);

        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const toggleMenu = (menu: string) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const isActive = (path: string) => pathname === path;
    const isGroupActive = (prefix: string) => pathname.startsWith(prefix);

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 z-50 flex flex-col shadow-lg bg-white">
            <div className="p-6 flex items-center justify-center h-20">
                <Image src="/logo.png" alt="Ataelqui" width={140} height={50} className="object-contain" />
            </div>

            <div className="flex-1 flex flex-col bg-gradient-to-b from-[#F57C00] to-[#E65100] overflow-hidden">
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Dashboard */}
                    <Link href="/admin/dashboard" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isActive('/admin/dashboard') ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                        <span className={`w-5 h-5 mr-3 ${isActive('/admin/dashboard') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </span>
                        Dashboard
                    </Link>

                    {/* Inventario Group */}
                    <div>
                        <button onClick={() => toggleMenu('inventario')} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isGroupActive('/admin/inventario') ? 'text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                            <div className="flex items-center">
                                <span className={`w-5 h-5 mr-3 ${isGroupActive('/admin/inventario') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </span>
                                Inventario
                            </div>
                            <svg className={`w-4 h-4 transition-transform ${openMenus.inventario ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openMenus.inventario && (
                            <div className="pl-12 space-y-1 mt-1">
                                <Link href="/admin/inventario/stock" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/inventario/stock') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Stock Actual</Link>
                                <Link href="/admin/inventario/historial" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/inventario/historial') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Historial Conteos</Link>
                                <Link href="/admin/inventario/kardex" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/inventario/kardex') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Kardex</Link>
                            </div>
                        )}
                    </div>

                    {/* Tareas Group */}
                    <div>
                        <button onClick={() => toggleMenu('tareas')} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isGroupActive('/admin/tareas') ? 'text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                            <div className="flex items-center">
                                <span className={`w-5 h-5 mr-3 ${isGroupActive('/admin/tareas') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                </span>
                                Tareas
                            </div>
                            <svg className={`w-4 h-4 transition-transform ${openMenus.tareas ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openMenus.tareas && (
                            <div className="pl-12 space-y-1 mt-1">
                                <Link href="/admin/tareas/asignar" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/tareas/asignar') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Asignar Tarea</Link>
                                <Link href="/admin/tareas/monitor" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/tareas/monitor') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Monitor (Kanban)</Link>
                            </div>
                        )}
                    </div>

                    {/* Devoluciones Group */}
                    <div>
                        <button onClick={() => toggleMenu('devoluciones')} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isGroupActive('/admin/devoluciones') ? 'text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                            <div className="flex items-center">
                                <span className={`w-5 h-5 mr-3 ${isGroupActive('/admin/devoluciones') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                </span>
                                Devoluciones
                            </div>
                            <svg className={`w-4 h-4 transition-transform ${openMenus.devoluciones ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openMenus.devoluciones && (
                            <div className="pl-12 space-y-1 mt-1">
                                <Link href="/admin/devoluciones/bandeja" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/devoluciones/bandeja') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Por Aprobar</Link>
                                <Link href="/admin/devoluciones/nueva" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/devoluciones/nueva') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Nueva Devolución</Link>
                                <Link href="/admin/devoluciones/historial" className={`block px-4 py-2 text-sm rounded-lg transition-all ${isActive('/admin/devoluciones/historial') ? 'text-white bg-white/20 font-medium shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Historial</Link>
                            </div>
                        )}
                    </div>

                    {/* Mermas */}
                    <Link href="/admin/mermas" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isActive('/admin/mermas') ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                        <span className={`w-5 h-5 mr-3 ${isActive('/admin/mermas') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </span>
                        Mermas
                    </Link>

                    {/* Notificaciones */}
                    <Link href="/admin/notificaciones" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isActive('/admin/notificaciones') ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                        <span className={`w-5 h-5 mr-3 ${isActive('/admin/notificaciones') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                            <svg className="bell-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </span>
                        Notificaciones
                        {notificationCount > 0 && (
                            <span className="ml-auto bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {notificationCount}
                            </span>
                        )}
                    </Link>

                    {/* Administración Group */}
                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Administración</p>
                    </div>

                    <Link href="/admin/administracion/usuarios" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin/administracion/usuarios') ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-medium">Usuarios</span>
                    </Link>

                    {/* Configuración */}
                    <Link href="/admin/configuracion" className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all group ${isActive('/admin/configuracion') ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}>
                        <span className={`w-5 h-5 mr-3 ${isActive('/admin/configuracion') ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </span>
                        Configuración
                    </Link>
                </nav>

                <div className="p-4 border-t border-orange-400/30">
                    <Link href="/auth/login" className="flex items-center px-4 py-2 text-sm font-medium text-white/90 rounded-lg hover:bg-white/10 hover:text-white transition-all">
                        <span className="w-5 h-5 mr-3">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </span>
                        Cerrar Sesión
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
