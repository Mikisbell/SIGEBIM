'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface FileContext {
    version?: string
    total_layers?: number
    entities?: number
    score?: number
    layers?: Array<{ name: string; color: number; linetype: string }>
    details?: Array<{ code: string; severity: string; message: string }>
}

interface AIChatProps {
    fileContext?: FileContext | null
}

export function AIChat({ fileContext }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '¡Hola! Soy el asistente de SIGEBIM. Puedo ayudarte con preguntas sobre:\n\n• Archivos DXF y sus capas\n• Normas de construcción\n• Validación de planos\n• Metrados y presupuestos\n\n¿En qué puedo ayudarte?'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'
            const response = await fetch(`${backendUrl}/api/v1/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    file_context: fileContext
                }),
            })

            const data = await response.json()

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || 'Lo siento, no pude procesar tu pregunta.'
            }])
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Error de conexión con el servidor. Por favor intenta de nuevo.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <Card className="bg-slate-800/50 border-slate-700 flex flex-col h-[500px]">
            <CardHeader className="pb-3 border-b border-slate-700">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Asistente IA
                    {fileContext && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full ml-2">
                            Con contexto del archivo
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-purple-400" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-200'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-400" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="bg-slate-700 rounded-lg p-3">
                                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Pregunta sobre tu plano..."
                            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                            disabled={loading}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Solo responde preguntas sobre CAD/BIM y construcción
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
