import { createClient } from '@/lib/supabase-server'
import { Plus, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/types/database'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get user's projects through organization
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    const statusColors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Proyectos</h1>
                    <p className="text-slate-400 mt-1">Gestiona tus proyectos de ingeniería</p>
                </div>
                <Link href="/dashboard/projects/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Proyecto
                    </Button>
                </Link>
            </div>

            {/* Projects Grid */}
            {!projects || projects.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FolderKanban className="h-12 w-12 text-slate-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No tienes proyectos aún</h3>
                        <p className="text-slate-400 mb-4">Crea tu primer proyecto para comenzar a auditar planos.</p>
                        <Link href="/dashboard/projects/new">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Proyecto
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: Project) => (
                        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                            <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer group">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </CardTitle>
                                            {project.code && (
                                                <CardDescription className="text-slate-400 mt-1">
                                                    {project.code}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <Badge className={statusColors[project.status]}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-500">
                                        Creado: {new Date(project.created_at).toLocaleDateString('es-PE')}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
