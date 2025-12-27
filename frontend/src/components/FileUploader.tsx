'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileIcon, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { FileRecord, AuditResult } from '@/types/database'

interface FileUploaderProps {
    projectId: string
    onUploadComplete?: () => void
}

export function FileUploader({ projectId, onUploadComplete }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const dxfFile = files.find(f => f.name.toLowerCase().endsWith('.dxf'))

        if (!dxfFile) {
            setError('Por favor sube un archivo .DXF')
            return
        }

        await uploadFile(dxfFile)
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.dxf')) {
            setError('Por favor sube un archivo .DXF')
            return
        }

        await uploadFile(file)
    }

    const uploadFile = async (file: File) => {
        setUploading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            // Sanitize filename - remove special characters
            const sanitizedName = file.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[{}[\]()#%&*<>?\/\\|'"`~^]/g, '') // Remove special chars
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .replace(/__+/g, '_') // Replace multiple underscores with single

            // 1. Get presigned upload URL from R2 backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'
            const urlResponse = await fetch(`${backendUrl}/api/v1/storage/upload-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: sanitizedName,
                    content_type: 'application/octet-stream'
                })
            })

            if (!urlResponse.ok) {
                throw new Error('Error al obtener URL de subida')
            }

            const { upload_url, file_key } = await urlResponse.json()

            // 2. Create file record in database with R2 file_key
            const { data: fileRecord, error: dbError } = await supabase
                .from('files')
                .insert({
                    project_id: projectId,
                    uploader_id: user.id,
                    filename: file.name,
                    storage_path: file_key, // R2 file key
                    file_type: 'dxf',
                    size_bytes: file.size,
                    upload_status: 'uploading'
                })
                .select()
                .single()

            if (dbError) throw new Error(dbError.message)

            // 3. Upload directly to R2 with progress tracking
            const xhr = new XMLHttpRequest()
            const uploadPromise = new Promise<void>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100)
                        setUploadProgress(progress)
                    }
                })
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve()
                    } else {
                        reject(new Error('Error al subir archivo'))
                    }
                })
                xhr.addEventListener('error', () => reject(new Error('Error de red')))
            })

            xhr.open('PUT', upload_url)
            xhr.setRequestHeader('Content-Type', 'application/octet-stream')
            xhr.send(file)

            try {
                await uploadPromise
            } catch {
                await supabase.from('files').delete().eq('id', fileRecord.id)
                throw new Error('Error al subir archivo a R2')
            }

            // 4. Update status
            await supabase
                .from('files')
                .update({ upload_status: 'uploaded' })
                .eq('id', fileRecord.id)

            onUploadComplete?.()

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <Card
            className={`bg-slate-800/50 border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600'
                }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                {uploading ? (
                    <>
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-300 mb-3">Subiendo archivo... {uploadProgress}%</p>
                        <div className="w-full max-w-xs bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <Upload className="h-10 w-10 text-slate-500 mb-4" />
                        <p className="text-slate-300 mb-2">Arrastra tu archivo .DXF aquí</p>
                        <p className="text-sm text-slate-500 mb-4">o</p>
                        <label>
                            <input
                                type="file"
                                accept=".dxf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer" asChild>
                                <span>Seleccionar Archivo</span>
                            </Button>
                        </label>
                    </>
                )}
                {error && (
                    <p className="text-red-400 text-sm mt-4">{error}</p>
                )}
            </CardContent>
        </Card>
    )
}

// File List Component
interface FileListProps {
    files: (FileRecord & { audit_results?: AuditResult[] })[]
    onAudit: (fileId: string) => void
    auditing: string | null
}

export function FileList({ files, onAudit, auditing }: FileListProps) {
    const statusIcons: Record<string, React.ReactNode> = {
        uploading: <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />,
        uploaded: <FileIcon className="h-4 w-4 text-slate-400" />,
        processing: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
        processed: <CheckCircle className="h-4 w-4 text-green-400" />,
        error: <XCircle className="h-4 w-4 text-red-400" />,
    }

    const auditStatusIcons: Record<string, React.ReactNode> = {
        pass: <CheckCircle className="h-4 w-4 text-green-400" />,
        fail: <XCircle className="h-4 w-4 text-red-400" />,
        warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
        pending: <Loader2 className="h-4 w-4 animate-spin text-slate-400" />,
    }

    return (
        <div className="space-y-3">
            {files.map((file) => {
                const result = file.audit_results?.[0]
                return (
                    <Card key={file.id} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {statusIcons[file.upload_status]}
                                <div>
                                    <p className="text-white font-medium">{file.filename}</p>
                                    <p className="text-xs text-slate-500">
                                        {(file.size_bytes! / 1024).toFixed(1)} KB • v{file.version}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {result && (
                                    <div className="flex items-center gap-2 text-sm">
                                        {auditStatusIcons[result.status]}
                                        <span className="text-slate-400">
                                            Score: {result.summary.score ?? 'N/A'}
                                        </span>
                                    </div>
                                )}
                                {file.upload_status === 'uploaded' && (
                                    <Button
                                        size="sm"
                                        onClick={() => onAudit(file.id)}
                                        disabled={auditing === file.id}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {auditing === file.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Auditar'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
