'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings } from 'lucide-react'
import { FileUploader, FileList } from '@/components/FileUploader'
import Link from 'next/link'
import type { Project, FileRecord, AuditResult } from '@/types/database'

interface ProjectDetailClientProps {
    projectId: string
    initialProject: Project
    initialFiles: (FileRecord & { audit_results?: AuditResult[] })[]
}

export default function ProjectDetailClient({
    projectId,
    initialProject,
    initialFiles
}: ProjectDetailClientProps) {
    const [project] = useState(initialProject)
    const [files, setFiles] = useState(initialFiles)
    const [auditing, setAuditing] = useState<string | null>(null)
    const supabase = createClient()

    const refreshFiles = async () => {
        const { data } = await supabase
            .from('files')
            .select('*, audit_results(*)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (data) setFiles(data)
    }

    const handleAudit = async (fileId: string) => {
        setAuditing(fileId)

        try {
            // Update file status to processing
            await supabase
                .from('files')
                .update({ upload_status: 'processing' })
                .eq('id', fileId)

            // Get signed URL for the file
            const file = files.find(f => f.id === fileId)
            if (!file) throw new Error('Archivo no encontrado')

            const { data: signedUrlData } = await supabase.storage
                .from('files_bucket')
                .createSignedUrl(file.storage_path, 60)

            if (!signedUrlData?.signedUrl) {
                throw new Error('No se pudo generar URL firmada')
            }

            // Call Python backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
            const response = await fetch(`${backendUrl}/api/v1/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_id: fileId,
                    file_url: signedUrlData.signedUrl,
                }),
            })

            if (!response.ok) {
                throw new Error('Error del servidor de auditoría')
            }

            // For now, create a mock result (since real processing is async)
            // In production, you'd poll or use realtime to get the result
            await supabase
                .from('audit_results')
                .insert({
                    file_id: fileId,
                    status: 'pass',
                    summary: { total_layers: 5, errors: 0, score: 100 },
                    details: [],
                })

            await supabase
                .from('files')
                .update({ upload_status: 'processed' })
                .eq('id', fileId)

            await refreshFiles()

        } catch (err) {
            console.error('Audit error:', err)
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
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                </Button>
            </div>

            {/* File Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">Archivos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FileUploader projectId={projectId} onUploadComplete={refreshFiles} />
                            {files.length > 0 && (
                                <div className="mt-6">
                                    <FileList files={files} onAudit={handleAudit} auditing={auditing} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Archivos</span>
                                <span className="text-white font-medium">{files.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Auditados</span>
                                <span className="text-white font-medium">
                                    {files.filter(f => f.upload_status === 'processed').length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Con Errores</span>
                                <span className="text-red-400 font-medium">
                                    {files.filter(f => f.audit_results?.some(r => r.status === 'fail')).length}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
