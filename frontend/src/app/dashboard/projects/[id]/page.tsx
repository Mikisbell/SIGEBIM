import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProjectDetailClient from './ProjectDetailClient'

interface ProjectPageProps {
    params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch project
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !project) {
        notFound()
    }

    // Fetch files with audit results
    const { data: files } = await supabase
        .from('files')
        .select('*, audit_results(*)')
        .eq('project_id', id)
        .order('created_at', { ascending: false })

    return (
        <ProjectDetailClient
            projectId={id}
            initialProject={project}
            initialFiles={files || []}
        />
    )
}
