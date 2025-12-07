'use client';

import { useEffect, useState } from 'react';
import KpiCard from '@/components/kpi/KpiCard';
import Link from 'next/link';
import { apiClient } from '@/utils/api';

export default function DashboardPage() {
    // 1. ESTADOS PARA LOS DATOS (Inicializados con 0 o vacíos)
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        alerts: 0,
        stock: 0,
        valorizado: 0,
        rotation: '0.0x',
        fefoAlerts: 0
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [categoriesData, setCategoriesData] = useState<any[]>([]);
    const [pendingTasks, setPendingTasks] = useState({ returns: 0, counting: 0 });

    // 2. CARGAR DATOS REALES DE FIREBASE
    useEffect(() => {
        async function fetchData() {
            try {
                // Pedimos los productos, inventario (para alertas FEFO), tareas y kardex a la API
                const [productsRes, fefoRes, tasksRes, kardexRes] = await Promise.all([
                    apiClient.getProducts(),
                    apiClient.getFefoAlerts(),
                    apiClient.getTasks({ status: 'pending' }),
                    apiClient.getKardex()
                ]);

                if (productsRes.success && productsRes.data) {
                    const productos = productsRes.data as any[];

                    // A. STOCK TOTAL
                    const totalStock = productos.reduce((acc, item) => acc + (Number(item.stock) || Number(item.quantity) || Number(item.totalStock) || 0), 0);

                    // B. ALERTAS (Stock bajo < 10)
                    const totalAlertas = productos.filter((p) => (Number(p.stock) || Number(p.totalStock) || 0) <= (Number(p.minStock) || 10)).length;

                    // C. VALORIZADO TOTAL
                    const totalValor = productos.reduce((acc, item) => {
                        const qty = Number(item.stock) || Number(item.quantity) || Number(item.totalStock) || 0;
                        const cost = Number(item.cost) || 0;
                        return acc + (qty * cost);
                    }, 0);

                    // D. TOP 5 PRODUCTOS
                    const sortedProducts = [...productos]
                        .sort((a, b) => (Number(b.stock) || Number(b.totalStock) || 0) - (Number(a.stock) || Number(a.totalStock) || 0))
                        .slice(0, 5)
                        .map(p => ({
                            name: p.name,
                            volume: Number(p.stock) || Number(p.totalStock) || 0
                        }));

                    // E. CATEGORÍAS (Para el gráfico de dona)
                    const catMap: Record<string, number> = {};
                    productos.forEach(p => {
                        const cat = p.category || 'Otros';
                        const val = (Number(p.stock) || Number(p.totalStock) || 0) * (Number(p.cost) || 0);
                        catMap[cat] = (catMap[cat] || 0) + val;
                    });

                    const catArray = Object.entries(catMap)
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 3);

                    // F. FEFO ALERTS
                    const fefoAlertsCount = fefoRes.success && fefoRes.data ? (fefoRes.data as any).alertsCount : 0;

                    // G. TASKS
                    const tasks = tasksRes.success && tasksRes.data ? (tasksRes.data as any[]) : [];
                    const returnsPending = tasks.filter(t => t.type === 'devolution').length;
                    const countingPending = tasks.filter(t => t.type === 'counting').length;

                    // H. ROTATION (Real Calculation)
                    let calculatedRotation = '0.0x';
                    if (kardexRes.success && kardexRes.data) {
                        const kardex = kardexRes.data as any[];
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                        const totalOutputs = kardex
                            .filter(k =>
                                k.type === 'Salida' &&
                                new Date(k.date) >= thirtyDaysAgo
                            )
                            .reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);

                        if (totalStock > 0) {
                            calculatedRotation = (totalOutputs / totalStock).toFixed(1) + 'x';
                        }
                    }

                    setStats({
                        alerts: totalAlertas,
                        stock: totalStock,
                        valorizado: totalValor,
                        rotation: calculatedRotation,
                        fefoAlerts: fefoAlertsCount
                    });
                    setTopProducts(sortedProducts);
                    setCategoriesData(catArray);
                    setPendingTasks({ returns: returnsPending, counting: countingPending });
                }
            } catch (error) {
                console.error("Error al cargar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando Tablero de Control...</div>;
    }

    return (
        <div className="p-8 min-h-screen space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Gerencial</h1>
                <p className="text-gray-500 mt-1">Visión general estratégica y operativa.</p>
            </div>

            {/* FILA 1: KPIs CRÍTICOS (Datos Reales) */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Alerta Stock"
                    value={`${stats.alerts} Productos`}
                    description="Nivel Crítico"
                    type={stats.alerts > 0 ? "danger" : "success"}
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                />
                <KpiCard
                    title="Valor Inventario"
                    value={`$${stats.valorizado.toLocaleString('es-CL')}`}
                    description="Costo total"
                    type="warning" // Usamos warning para mantener el color amarillo de tu diseño
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <KpiCard
                    title="Stock Total"
                    value={`${stats.stock} Unidades`}
                    description="Inventario disponible"
                    type="success"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    }
                />
                <KpiCard
                    title="Rotación"
                    value={stats.rotation}
                    description="Velocidad de salida"
                    type="info"
                    icon={
                        <svg className="w-6 h-6 spin-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    }
                />
            </section>

            {/* FILA 2: ANÁLISIS ESTRATÉGICO */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                {/* Tarjeta Izquierda: Valorización (Dona) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl card-shadow border border-gray-100 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Valorización de Inventario por Categoría</h2>
                    <div className="flex-1 flex items-center justify-center gap-12">
                        {/* Gráfico de Dona CSS Puro (Estático por diseño, pero datos al lado reales) */}
                        <div className="relative w-48 h-48 rounded-full" style={{
                            background: 'conic-gradient(#3B82F6 0% 40%, #F59E0B 40% 70%, #10B981 70% 100%)'
                        }}>
                            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner">
                                <div className="text-center">
                                    <span className="text-gray-400 text-xs font-medium block">Total</span>
                                    <span className="text-gray-800 text-sm font-bold">${(stats.valorizado / 1000).toFixed(0)}k</span>
                                </div>
                            </div>
                        </div>

                        {/* Leyenda Dinámica */}
                        <div className="space-y-4">
                            {categoriesData.length === 0 ? <p className="text-sm text-gray-400">Sin datos de categorías</p> :
                                categoriesData.map((cat, index) => {
                                    const colors = ['bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];
                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-400'}`}></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                                                <p className="text-xs text-gray-400">${cat.value.toLocaleString('es-CL')}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                </div>

                {/* Tarjeta Derecha: Top Productos (REAL) */}
                <div className="lg:col-span-1 bg-white p-8 rounded-2xl card-shadow border border-gray-100 overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Top 5 Mayor Stock</h2>
                    <div className="space-y-5">
                        {topProducts.length === 0 ? <p className="text-gray-400">No hay productos.</p> :
                            topProducts.map((product, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{product.name}</span>
                                        <span className="text-gray-500 font-bold">{product.volume} un.</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((product.volume / (stats.stock || 1)) * 100 * 3, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>

            {/* FILA 3: DATOS REALES DE VENCIMIENTOS Y TAREAS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1: Vencimientos (Real) */}
                <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Próximos Vencimientos (30d)</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{stats.fefoAlerts}</p>
                            <p className="text-sm text-gray-500">Productos por vencer</p>
                        </div>
                        <div className={`p-3 rounded-full ${stats.fefoAlerts > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Columna 2: Tareas (Real) */}
                <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Urgente / Pendiente</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-sm text-gray-600">Devoluciones por aprobar</span>
                            <span className={`px-2 py-1 text-xs font-bold text-white rounded-md ${pendingTasks.returns > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>{pendingTasks.returns}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-sm text-gray-600">Conteos pendientes</span>
                            <span className={`px-2 py-1 text-xs font-bold text-white rounded-md ${pendingTasks.counting > 0 ? 'bg-orange-500' : 'bg-gray-400'}`}>{pendingTasks.counting}</span>
                        </div>
                    </div>
                    <Link href="/admin/tareas" className="block w-full mt-4 text-center text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wide">Ver todas →</Link>
                </div>
            </section>
        </div>
    );
}