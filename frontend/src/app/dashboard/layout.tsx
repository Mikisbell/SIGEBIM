import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, FileText, Settings, LogOut, Building2 } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's organization
    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name)')
        .eq('user_id', user.id)
        .single()

    // Handle the foreign table join result - can be single object or array depending on relation
    const orgs = membership?.organizations as unknown as { name: string } | { name: string }[] | null
    const orgName = Array.isArray(orgs) ? orgs[0]?.name : orgs?.name || 'Mi Empresa'

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-slate-700">
                    <h1 className="text-xl font-bold text-white">SIGEBIM</h1>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {orgName}
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <FolderKanban className="h-5 w-5" />
                        Proyectos
                    </Link>
                    <Link
                        href="/dashboard/reports"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <FileText className="h-5 w-5" />
                        Reportes
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <Settings className="h-5 w-5" />
                        Configuración
                    </Link>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{user.email}</p>
                            <p className="text-xs text-slate-400">{membership?.role || 'member'}</p>
                        </div>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm"
                        >
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
