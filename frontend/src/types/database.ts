// Database Types - Auto-generated from schema
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise'
export type ProjectStatus = 'active' | 'archived' | 'completed'
export type FileType = 'dxf' | 'dwg' | 'ifc'
export type UploadStatus = 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error'
export type AuditStatus = 'pass' | 'fail' | 'warning' | 'pending'

export interface Organization {
    id: string
    name: string
    subscription_plan: SubscriptionPlan
    created_at: string
    updated_at: string
}

export interface OrganizationMember {
    id: string
    organization_id: string
    user_id: string
    role: 'owner' | 'admin' | 'member'
    created_at: string
}

export interface Project {
    id: string
    organization_id: string
    name: string
    code: string | null
    status: ProjectStatus
    created_at: string
    updated_at: string
}

export interface FileRecord {
    id: string
    project_id: string
    uploader_id: string | null
    filename: string
    storage_path: string
    file_type: FileType
    size_bytes: number | null
    version: number
    upload_status: UploadStatus
    created_at: string
}

export interface AuditResult {
    id: string
    file_id: string
    status: AuditStatus
    summary: {
        total_layers?: number
        errors?: number
        score?: number
        entities?: number
    }
    details: AuditDetail[]
    processed_at: string
}

export interface AuditDetail {
    code: string
    severity: 'error' | 'warning' | 'info'
    message: string
    location?: string
}
