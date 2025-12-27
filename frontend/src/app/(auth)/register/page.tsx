'use client'

// Disable static generation for this page (requires Supabase at runtime)
export const dynamic = 'force-dynamic'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [orgName, setOrgName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // 1. Create user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (!authData.user) {
            setError('Error al crear usuario')
            setLoading(false)
            return
        }

        // 2. Create organization
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: orgName })
            .select()
            .single()

        if (orgError) {
            setError('Error al crear organización: ' + orgError.message)
            setLoading(false)
            return
        }

        // 3. Link user to organization as owner
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: orgData.id,
                user_id: authData.user.id,
                role: 'owner'
            })

        if (memberError) {
            setError('Error al vincular usuario: ' + memberError.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Card className="w-full max-w-md mx-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-green-400">¡Registro Exitoso!</CardTitle>
                        <CardDescription className="text-slate-400">
                            Revisa tu email para confirmar tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => router.push('/login')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Ir a Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Card className="w-full max-w-md mx-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white">Crear Cuenta</CardTitle>
                    <CardDescription className="text-slate-400">
                        Comienza a auditar tus planos CAD
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label htmlFor="orgName" className="text-sm font-medium text-slate-300">
                                Nombre de tu Empresa
                            </label>
                            <Input
                                id="orgName"
                                type="text"
                                placeholder="Constructora ABC S.A.C."
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-slate-300">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-slate-900/50 border-slate-600 text-white"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>
                        <p className="text-center text-sm text-slate-400">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
                                Inicia sesión
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
