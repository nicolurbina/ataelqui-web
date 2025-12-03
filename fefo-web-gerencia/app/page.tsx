import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Navbar */}
            <nav className="w-full py-6 px-8 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="text-2xl font-bold text-slate-900">Ataelqui<span className="text-blue-500">.</span></div>
                <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
                    <a href="#" className="hover:text-blue-600 transition-colors">Características</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">Sobre Nosotros</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">Contacto</a>
                </div>
                <Link
                    href="/auth/login"
                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                    Ingresar
                </Link>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50 to-white rounded-full blur-3xl -z-10 opacity-60"></div>

                <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide uppercase mb-6 border border-blue-100">
                    Sistema de Gestión FEFO
                </span>

                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl leading-tight">
                    Control total de tu inventario <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">sin pérdidas.</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
                    Optimiza la rotación de productos, reduce mermas y gestiona devoluciones en tiempo real con nuestra plataforma integral para Ataelqui.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/auth/login"
                        className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all hover:-translate-y-1"
                    >
                        Comenzar Ahora
                    </Link>
                    <button className="px-8 py-4 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all hover:-translate-y-1">
                        Ver Demo
                    </button>
                </div>

                {/* Stats Preview */}
                <div className="mt-20 w-full max-w-5xl bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Reducción de Mermas</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">35%</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Precisión de Inventario</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">99.9%</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Tiempo de Respuesta</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">&lt; 1s</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center text-sm text-slate-400">
                © 2025 Ataelqui. Todos los derechos reservados.
            </footer>
        </div>
    );
}
