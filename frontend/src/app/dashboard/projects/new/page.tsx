'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Get user's organization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('Usuario no autenticado')
            setLoading(false)
            return
        }

        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            setError('No perteneces a ninguna organización')
            setLoading(false)
            return
        }

        const { data, error: insertError } = await supabase
            .from('projects')
            .insert({
                name,
                code: code || null,
                organization_id: membership.organization_id,
            })
            .select()
            .single()

        if (insertError) {
            setError('Error al crear proyecto: ' + insertError.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/projects/${data.id}`)
    }

    return (
        <div className="p-8">
            <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Proyectos
            </Link>

            <Card className="max-w-lg bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Nuevo Proyecto</CardTitle>
                    <CardDescription className="text-slate-400">
                        Crea un proyecto para organizar tus planos CAD
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-slate-300">
                                Nombre del Proyecto *
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Hospital Regional Huancayo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="code" className="text-sm font-medium text-slate-300">
                                Código (Opcional)
                            </label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="PRJ-2024-001"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Creando...' : 'Crear Proyecto'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
