'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Layers, Box, FileCode } from 'lucide-react'

interface AuditResult {
    status: 'pass' | 'fail' | 'warning' | 'error'
    summary: {
        total_layers: number
        entities: number
        version: string
        score: number
        error?: string
    }
    layers?: Array<{
        name: string
        color: number
        linetype: string
    }>
    details: Array<{
        code: string
        severity: string  // Relaxed type for backend compatibility
        layer?: string
        message: string
    }>
}

interface AuditResultsTableProps {
    result: AuditResult | null
    loading?: boolean
}

export function AuditResultsTable({ result, loading }: AuditResultsTableProps) {
    if (loading) {
        return (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-500/50 mb-4" />
                        <div className="h-4 w-32 bg-slate-700 rounded" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!result) {
        return (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center text-slate-500">
                    <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sube un archivo DXF y presiona "Auditar" para ver los resultados</p>
                </CardContent>
            </Card>
        )
    }

    const statusConfig = {
        pass: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Aprobado' },
        warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Advertencias' },
        fail: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rechazado' },
        error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Error' },
    }

    const status = statusConfig[result.status] || statusConfig.error
    const StatusIcon = status.icon

    return (
        <div className="space-y-4">
            {/* Score Card */}
            <Card className={`${status.bg} border-none`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <StatusIcon className={`h-10 w-10 ${status.color}`} />
                            <div>
                                <p className={`text-2xl font-bold ${status.color}`}>
                                    Score: {result.summary.score}/100
                                </p>
                                <p className="text-slate-400">{status.label}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {result.summary.version || 'DXF'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Layers className="h-8 w-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{result.summary.total_layers}</p>
                            <p className="text-sm text-slate-400">Capas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Box className="h-8 w-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{result.summary.entities}</p>
                            <p className="text-sm text-slate-400">Entidades</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertTriangle className={`h-8 w-8 ${result.details.length > 0 ? 'text-yellow-400' : 'text-green-400'}`} />
                        <div>
                            <p className="text-2xl font-bold text-white">{result.details.length}</p>
                            <p className="text-sm text-slate-400">Problemas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Layers Table */}
            {result.layers && result.layers.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Capas Detectadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Nombre</th>
                                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Color</th>
                                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Tipo Línea</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.layers.map((layer, i) => (
                                        <tr key={i} className="border-b border-slate-700/50">
                                            <td className="py-2 px-3 text-white">{layer.name}</td>
                                            <td className="py-2 px-3">
                                                <span className="inline-flex items-center gap-2">
                                                    <span
                                                        className="w-4 h-4 rounded-full border border-slate-600"
                                                        style={{ backgroundColor: getAcadColor(layer.color) }}
                                                    />
                                                    <span className="text-slate-300">{layer.color}</span>
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-slate-300">{layer.linetype}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Issues Table */}
            {result.details.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">Problemas Detectados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {result.details.map((detail, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-lg border ${detail.severity === 'fail'
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : 'bg-yellow-500/10 border-yellow-500/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {detail.severity === 'fail' ? (
                                            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                                        )}
                                        <div>
                                            <p className="text-white font-medium">{detail.code}</p>
                                            <p className="text-sm text-slate-400">{detail.message}</p>
                                            {detail.layer && (
                                                <p className="text-xs text-slate-500 mt-1">Capa: {detail.layer}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// AutoCAD color index to RGB (simplified)
function getAcadColor(colorIndex: number): string {
    const colors: Record<number, string> = {
        0: '#000000', // ByBlock
        1: '#FF0000', // Red
        2: '#FFFF00', // Yellow
        3: '#00FF00', // Green
        4: '#00FFFF', // Cyan
        5: '#0000FF', // Blue
        6: '#FF00FF', // Magenta
        7: '#FFFFFF', // White/Black
        256: '#808080', // ByLayer
    }
    return colors[colorIndex] || '#808080'
}
