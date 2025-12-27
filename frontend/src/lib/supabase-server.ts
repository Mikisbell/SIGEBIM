import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Demo mode detection
const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// Mock client for demo mode
const mockClient = {
    auth: {
        getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@sigebim.com' } }, error: null }),
    },
    from: () => ({
        select: () => ({
            order: () => ({ data: [], error: null }),
            eq: () => ({
                single: () => ({ data: { id: 'demo-org', name: 'Demo Organization', role: 'owner', organizations: { name: 'Demo Corp' } }, error: null }),
                data: [],
                error: null
            }),
            single: () => ({ data: null, error: null }),
            data: [],
            error: null
        }),
        insert: () => ({ select: () => ({ single: () => ({ data: { id: 'demo-id' }, error: null }) }) }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
}

export async function createClient() {
    if (DEMO_MODE) {
        console.log('[DEMO MODE] Using mock server Supabase client')
        return mockClient as any
    }

    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    )
}
