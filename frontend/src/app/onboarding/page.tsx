'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
    const [orgName, setOrgName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        // Create organization via secure RPC
        // This avoids RLS "chicken-and-egg" issues where you can't view the org you just created
        const { data: orgId, error: rpcError } = await supabase
            .rpc('create_organization_with_owner', {
                org_name: orgName
            })

        if (rpcError) {
            setError(`Error al crear organización: ${rpcError.message}`)
            setLoading(false)
            return
        }

        // Success - redirect to dashboard

        router.push('/dashboard')
        router.refresh()
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Card className="w-full max-w-md mx-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm relative">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    onClick={handleSignOut}
                >
                    Cerrar Sesión
                </Button>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white">Configura tu Empresa</CardTitle>
                    <CardDescription className="text-slate-400">
                        Para comenzar, necesitamos crear un espacio de trabajo para tu equipo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateOrg} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="orgName" className="text-sm font-medium text-slate-300">
                                Nombre de la Organización
                            </label>
                            <Input
                                id="orgName"
                                type="text"
                                placeholder="Ej. Constructora Andina S.A.C."
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Creando espacio...' : 'Comenzar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
