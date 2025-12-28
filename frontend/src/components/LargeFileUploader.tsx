'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface LargeFileUploaderProps {
    projectId: string
    onUploadComplete?: () => void
}

const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB per chunk

export function LargeFileUploader({ projectId, onUploadComplete }: LargeFileUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentChunk, setCurrentChunk] = useState(0)
    const [totalChunks, setTotalChunks] = useState(0)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const sanitizeFilename = (name: string) => {
        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[{}[\]()#%&*<>?\/\\|'"`~^]/g, '')
            .replace(/\s+/g, '_')
            .replace(/__+/g, '_')
    }

    const uploadLargeFile = useCallback(async (file: File) => {
        setUploading(true)
        setError(null)
        setStatus('uploading')
        setProgress(0)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const sanitizedName = sanitizeFilename(file.name)
            const chunks = Math.ceil(file.size / CHUNK_SIZE)
            setTotalChunks(chunks)

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'

            // 1. Initiate multipart upload
            const initResponse = await fetch(`${backendUrl}/api/v1/storage/multipart/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: sanitizedName,
                    content_type: 'application/octet-stream',
                    total_parts: chunks
                })
            })

            if (!initResponse.ok) throw new Error('Error al iniciar subida')

            const { upload_id, file_key, part_urls } = await initResponse.json()

            // 2. Create file record
            const { data: fileRecord, error: dbError } = await supabase
                .from('files')
                .insert({
                    project_id: projectId,
                    uploader_id: user.id,
                    filename: file.name,
                    storage_path: file_key,
                    file_type: 'dxf',
                    size_bytes: file.size,
                    upload_status: 'uploading'
                })
                .select()
                .single()

            if (dbError) throw new Error(dbError.message)

            // 3. Upload each chunk
            const uploadedParts: { PartNumber: number; ETag: string }[] = []

            for (let i = 0; i < chunks; i++) {
                setCurrentChunk(i + 1)
                const start = i * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, file.size)
                const chunk = file.slice(start, end)

                const partUrl = part_urls[i]?.upload_url
                if (!partUrl) throw new Error(`No URL for part ${i + 1}`)

                const response = await fetch(partUrl, {
                    method: 'PUT',
                    body: chunk,
                    headers: { 'Content-Type': 'application/octet-stream' }
                })

                if (!response.ok) throw new Error(`Error subiendo parte ${i + 1}`)

                const etag = response.headers.get('ETag')
                if (etag) {
                    uploadedParts.push({
                        PartNumber: i + 1,
                        ETag: etag.replace(/"/g, '')
                    })
                }

                setProgress(Math.round(((i + 1) / chunks) * 100))
            }

            // 4. Complete multipart upload
            const completeResponse = await fetch(`${backendUrl}/api/v1/storage/multipart/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_key,
                    upload_id,
                    parts: uploadedParts
                })
            })

            if (!completeResponse.ok) throw new Error('Error al completar subida')

            // 5. Update file status
            await supabase
                .from('files')
                .update({ upload_status: 'uploaded' })
                .eq('id', fileRecord.id)

            setStatus('complete')
            onUploadComplete?.()

        } catch (err) {
            console.error('Upload error:', err)
            setError(err instanceof Error ? err.message : 'Error desconocido')
            setStatus('error')
        } finally {
            setUploading(false)
        }
    }, [projectId, supabase, onUploadComplete])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.name.toLowerCase().endsWith('.dxf')) {
            await uploadLargeFile(file)
        } else {
            setError('Por favor selecciona un archivo .DXF')
        }
    }

    return (
        <Card className="bg-slate-800/50 border-2 border-dashed border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                {status === 'uploading' ? (
                    <>
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-white font-medium mb-2">
                            Subiendo archivo grande...
                        </p>
                        <p className="text-slate-400 text-sm mb-3">
                            Parte {currentChunk} de {totalChunks} • {progress}%
                        </p>
                        <div className="w-full max-w-xs bg-slate-700 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                            No cierres esta ventana
                        </p>
                    </>
                ) : status === 'complete' ? (
                    <>
                        <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
                        <p className="text-green-400 font-medium">¡Archivo subido exitosamente!</p>
                    </>
                ) : status === 'error' ? (
                    <>
                        <XCircle className="h-10 w-10 text-red-500 mb-4" />
                        <p className="text-red-400">{error}</p>
                        <label className="mt-4">
                            <input
                                type="file"
                                accept=".dxf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button variant="outline" className="border-slate-600 cursor-pointer" asChild>
                                <span>Intentar de nuevo</span>
                            </Button>
                        </label>
                    </>
                ) : (
                    <>
                        <Upload className="h-10 w-10 text-slate-400 mb-4" />
                        <p className="text-slate-300 mb-2">Subidor de archivos grandes</p>
                        <p className="text-slate-500 text-xs mb-4">Soporta archivos de hasta 5GB+</p>
                        <label>
                            <input
                                type="file"
                                accept=".dxf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button className="bg-purple-600 hover:bg-purple-700 cursor-pointer" asChild>
                                <span>Seleccionar archivo DXF grande</span>
                            </Button>
                        </label>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
