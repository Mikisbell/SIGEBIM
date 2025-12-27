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
            email: email.trim(),
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            }
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        // Success state - verify email
        setSuccess(true)
        setLoading(false)
    }

    const handleResend = async () => {
        setLoading(true)
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email.trim(),
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            }
        })
        setLoading(false)
        if (error) {
            setError(error.message)
        } else {
            alert('¡Correo reenviado! Revisa tu bandeja de entrada.')
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Card className="w-full max-w-md mx-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-green-400">Verifica tu Correo</CardTitle>
                        <CardDescription className="text-slate-400">
                            Hemos enviado un enlace de confirmación a <span className="text-white font-medium">{email}</span>.
                            <br /><br />
                            Por favor, haz clic en el enlace para activar tu cuenta y continuar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={() => router.push('/login')}
                            variant="outline"
                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                            Ir a Login
                        </Button>

                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-2">¿No recibiste el correo o expiró?</p>
                            <Button
                                onClick={handleResend}
                                disabled={loading}
                                variant="link"
                                className="text-blue-400 h-auto p-0"
                            >
                                {loading ? 'Enviando...' : 'Reenviar correo de confirmación'}
                            </Button>
                        </div>
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
