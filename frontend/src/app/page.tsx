import Link from 'next/link'
import { ArrowRight, CheckCircle, FileStack, Shield, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            SIGE<span className="text-blue-500">BIM</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Dashboard Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Auditoría Automatizada de<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Planos CAD
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Valida tus archivos DXF contra normativas peruanas (RNE, MTC, Invierte.pe)
            en segundos. Reduce un 80% el tiempo de revisión manual.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
            >
              Probar Ahora <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/register"
              className="border border-slate-600 hover:border-slate-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Crear Cuenta Gratis
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <Zap className="h-10 w-10 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Validación Instantánea</h3>
            <p className="text-slate-400">
              Sube tu archivo DXF y obtén un reporte detallado en segundos.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <Shield className="h-10 w-10 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Normativa Peruana</h3>
            <p className="text-slate-400">
              Reglas pre-configuradas según RNE, MTC, OSCE e Invierte.pe.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <FileStack className="h-10 w-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Reportes Profesionales</h3>
            <p className="text-slate-400">
              Exporta PDFs listos para presentar a supervisión o fiscalización.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 text-center">
          <div>
            <p className="text-4xl font-bold text-blue-400">80%</p>
            <p className="text-slate-400 mt-2">Reducción de tiempo</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-green-400">50+</p>
            <p className="text-slate-400 mt-2">Reglas de validación</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-cyan-400">DXF</p>
            <p className="text-slate-400 mt-2">R12 hasta R2018</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center py-12 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl border border-blue-500/30">
          <h3 className="text-2xl font-bold text-white mb-4">
            ¿Listo para automatizar tu flujo de trabajo?
          </h3>
          <p className="text-slate-400 mb-6">No requiere tarjeta de crédito. Empieza gratis hoy.</p>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2"
          >
            Ver Demo <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p>© 2024 SIGEBIM. Hecho con ❤️ para ingenieros peruanos.</p>
        </div>
      </footer>
    </div>
  )
}
