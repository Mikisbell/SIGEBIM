'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings, Play } from 'lucide-react'
import { FileUploader, FileList } from '@/components/FileUploader'
import { LargeFileUploader } from '@/components/LargeFileUploader'
import { AuditResultsTable } from '@/components/AuditResultsTable'
import { AIChat } from '@/components/AIChat'
import Link from 'next/link'
import type { Project, FileRecord, AuditResult } from '@/types/database'

interface ProjectDetailClientProps {
    projectId: string
    initialProject: Project
    initialFiles: (FileRecord & { audit_results?: AuditResult[] })[]
}

// Type for sync audit result from backend
interface SyncAuditResult {
    status: 'pass' | 'fail' | 'warning' | 'error'
    summary: {
        total_layers: number
        entities: number
        version: string
        score: number
        error?: string
    }
    layers?: Array<{ name: string; color: number; linetype: string }>
    details: Array<{ code: string; severity: string; layer?: string; message: string }>
}

export default function ProjectDetailClient({
    projectId,
    initialProject,
    initialFiles
}: ProjectDetailClientProps) {
    const [project] = useState(initialProject)
    const [files, setFiles] = useState(initialFiles)
    const [auditing, setAuditing] = useState<string | null>(null)
    const [currentResult, setCurrentResult] = useState<SyncAuditResult | null>(null)
    const [testAuditing, setTestAuditing] = useState(false)
    const supabase = createClient()

    const refreshFiles = async () => {
        const { data } = await supabase
            .from('files')
            .select('*, audit_results(*)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (data) setFiles(data)
    }

    const handleDelete = async (fileId: string) => {
        if (!confirm('¿Estás seguro de eliminar este archivo?')) return

        try {
            // Delete from database (R2 file will remain but orphaned)
            const { error: auditError } = await supabase.from('audit_results').delete().eq('file_id', fileId)
            if (auditError) console.error('Audit delete error:', auditError)

            const { error: fileError } = await supabase.from('files').delete().eq('id', fileId)
            if (fileError) {
                console.error('File delete error:', fileError)
                alert('Error al eliminar: ' + fileError.message)
                return
            }

            await refreshFiles()
        } catch (err) {
            console.error('Delete error:', err)
            alert('Error al eliminar archivo')
        }
    }

    // Quick test audit without file
    const handleTestAudit = async () => {
        setTestAuditing(true)
        setCurrentResult(null)

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'
            const response = await fetch(`${backendUrl}/api/v1/audit/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_url: 'test' }),
            })

            if (!response.ok) throw new Error('Backend error')

            const result: SyncAuditResult = await response.json()
            setCurrentResult(result)
        } catch (err) {
            console.error('Test audit error:', err)
            setCurrentResult({
                status: 'error',
                summary: { total_layers: 0, entities: 0, version: '', score: 0, error: 'Error de conexión con backend' },
                details: [{ code: 'CONNECTION_ERROR', severity: 'fail', message: 'No se pudo conectar con el servidor' }]
            })
        } finally {
            setTestAuditing(false)
        }
    }

    const handleAudit = async (fileId: string) => {
        setAuditing(fileId)
        setCurrentResult(null)

        try {
            // Update file status to processing
            await supabase
                .from('files')
                .update({ upload_status: 'processing' })
                .eq('id', fileId)

            // Get signed URL for the file from R2
            const file = files.find(f => f.id === fileId)
            if (!file) throw new Error('Archivo no encontrado')

            // Get R2 download URL from backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'
            const urlResponse = await fetch(`${backendUrl}/api/v1/storage/download-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_key: file.storage_path })
            })

            if (!urlResponse.ok) {
                throw new Error('No se pudo generar URL de descarga')
            }

            const { download_url } = await urlResponse.json()

            // Call Python backend SYNC endpoint
            const response = await fetch(`${backendUrl}/api/v1/audit/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_url: download_url }),
            })

            if (!response.ok) {
                throw new Error('Error del servidor de auditoría')
            }

            const result: SyncAuditResult = await response.json()
            setCurrentResult(result)

            // Save result to database
            await supabase
                .from('audit_results')
                .insert({
                    file_id: fileId,
                    status: result.status,
                    summary: result.summary,
                    details: result.details,
                })

            await supabase
                .from('files')
                .update({ upload_status: 'processed' })
                .eq('id', fileId)

            await refreshFiles()

        } catch (err) {
            console.error('Audit error:', err)
            setCurrentResult({
                status: 'error',
                summary: { total_layers: 0, entities: 0, version: '', score: 0, error: String(err) },
                details: [{ code: 'PROCESSING_ERROR', severity: 'fail', message: String(err) }]
            })
            await supabase
                .from('files')
                .update({ upload_status: 'error' })
                .eq('id', fileId)
            await refreshFiles()
        } finally {
            setAuditing(null)
        }
    }

    const statusColors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                            <Badge className={statusColors[project.status]}>
                                {project.status}
                            </Badge>
                        </div>
                        {project.code && (
                            <p className="text-slate-400 mt-1">{project.code}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleTestAudit}
                        disabled={testAuditing}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {testAuditing ? 'Procesando...' : 'Test DXF Demo'}
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: File Upload */}
                <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Archivos DXF</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <FileUploader projectId={projectId} onUploadComplete={refreshFiles} />
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-600" />
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-slate-800 px-2 text-slate-400">o archivo grande (+100MB)</span>
                                    </div>
                                </div>
                                <LargeFileUploader projectId={projectId} onUploadComplete={refreshFiles} />
                            </div>
                            {files.length > 0 && (
                                <div className="mt-6">
                                    <FileList files={files} onAudit={handleAudit} onDelete={handleDelete} auditing={auditing} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Audit Results + AI Chat */}
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-white">Resultados de Auditoría</h2>
                    <AuditResultsTable result={currentResult} loading={auditing !== null || testAuditing} />

                    {/* AI Chat */}
                    <AIChat fileContext={currentResult ? {
                        version: currentResult.summary.version,
                        total_layers: currentResult.summary.total_layers,
                        entities: currentResult.summary.entities,
                        score: currentResult.summary.score,
                        layers: currentResult.layers,
                        details: currentResult.details
                    } : undefined} />
                </div>
            </div>
        </div>
    )
}
