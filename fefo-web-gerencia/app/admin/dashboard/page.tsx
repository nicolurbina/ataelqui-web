// app/dashboard/page.tsx
import KpiCard from '@/components/kpi/KpiCard';
import Link from 'next/link';

export default function DashboardPage() {
    // Datos simulados para el diseño de alta fidelidad
    const kpiData = {
        alerts: '8 Lotes',
        lossValue: '$543.500',
        stock: '1,247',
        rotation: '8.5x',
    };

    const topProducts = [
        { name: 'Harina Selecta 1kg', volume: 85 },
        { name: 'Aceite Girasol 900ml', volume: 72 },
        { name: 'Arroz Premium 1kg', volume: 64 },
        { name: 'Azúcar Refinada 1kg', volume: 50 },
        { name: 'Leche Entera 1L', volume: 45 },
    ];

    return (
        <div className="p-8 min-h-screen space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Gerencial</h1>
                <p className="text-gray-500 mt-1">Visión general estratégica y operativa.</p>
            </div>

            {/* FILA 1: KPIs CRÍTICOS */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Alerta FEFO"
                    value={kpiData.alerts}
                    description="Lotes Críticos"
                    type="danger"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                />
                <KpiCard
                    title="Pérdidas (Mermas)"
                    value={kpiData.lossValue}
                    description="Valorizado mes actual"
                    type="warning"
                    trend="-2% vs mes anterior"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <KpiCard
                    title="Stock Total"
                    value={`${kpiData.stock} Unidades`}
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
                    value={kpiData.rotation}
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
                        {/* Gráfico de Dona CSS Puro */}
                        <div className="relative w-48 h-48 rounded-full" style={{
                            background: 'conic-gradient(#3B82F6 0% 40%, #F59E0B 40% 70%, #10B981 70% 100%)'
                        }}>
                            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-inner">
                                <span className="text-gray-400 text-sm font-medium">Total Valor</span>
                            </div>
                        </div>

                        {/* Leyenda */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Lácteos (40%)</p>
                                    <p className="text-xs text-gray-400">$217,400</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Harinas (30%)</p>
                                    <p className="text-xs text-gray-400">$163,050</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Grasas (30%)</p>
                                    <p className="text-xs text-gray-400">$163,050</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta Derecha: Top Productos */}
                <div className="lg:col-span-1 bg-white p-8 rounded-2xl card-shadow border border-gray-100 overflow-y-auto">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Top 5 Mayor Movimiento</h2>
                    <div className="space-y-5">
                        {topProducts.map((product, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{product.name}</span>
                                    <span className="text-gray-500">{product.volume}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${product.volume}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FILA 3: CONTROL OPERATIVO Y PROYECCIÓN */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna 1: Proyección Vencimientos */}
                <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Proyección Vencimientos (30d)</h3>
                    <div className="h-32 flex items-end justify-between gap-2 px-2">
                        {/* Barras simples */}
                        <div className="w-full bg-red-100 rounded-t-lg relative group h-[30%]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-600">12</div>
                            <div className="w-full h-full bg-red-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"></div>
                            <p className="text-[10px] text-center mt-1 text-gray-400">Sem 1</p>
                        </div>
                        <div className="w-full bg-orange-100 rounded-t-lg relative group h-[60%]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-orange-600">24</div>
                            <div className="w-full h-full bg-orange-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"></div>
                            <p className="text-[10px] text-center mt-1 text-gray-400">Sem 2</p>
                        </div>
                        <div className="w-full bg-yellow-100 rounded-t-lg relative group h-[45%]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-600">18</div>
                            <div className="w-full h-full bg-yellow-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"></div>
                            <p className="text-[10px] text-center mt-1 text-gray-400">Sem 3</p>
                        </div>
                        <div className="w-full bg-green-100 rounded-t-lg relative group h-[20%]">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-green-600">8</div>
                            <div className="w-full h-full bg-green-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"></div>
                            <p className="text-[10px] text-center mt-1 text-gray-400">Sem 4</p>
                        </div>
                    </div>
                </div>

                {/* Columna 2: Eficiencia Operativa */}
                <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Eficiencia Operativa</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Tiempo Promedio Picking</p>
                                    <p className="text-lg font-bold text-gray-800">12 min</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Tareas Completadas Hoy</p>
                                    <p className="text-lg font-bold text-gray-800">95%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna 3: Resumen Tareas */}
                <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Urgente / Pendiente</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-sm text-gray-600">Devoluciones por aprobar</span>
                            <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-md">2</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-sm text-gray-600">Conteos pendientes</span>
                            <span className="px-2 py-1 text-xs font-bold text-white bg-orange-500 rounded-md">4</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span className="text-sm text-gray-600">Solicitudes de stock</span>
                            <span className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-200 rounded-md">1</span>
                        </div>
                    </div>
                    <Link href="/admin/tareas" className="block w-full mt-4 text-center text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wide">Ver todas las tareas →</Link>
                </div>
            </section>
        </div>
    );
}