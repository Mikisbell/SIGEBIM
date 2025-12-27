import { createBrowserClient } from '@supabase/ssr'

// Demo mode detection
const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

// Mock client for demo mode
const mockClient = {
    auth: {
        getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@sigebim.com' } }, error: null }),
        signInWithPassword: async () => ({ data: { user: { id: 'demo-user', email: 'demo@sigebim.com' } }, error: null }),
        signUp: async () => ({ data: { user: { id: 'demo-user', email: 'demo@sigebim.com' } }, error: null }),
        signOut: async () => ({ error: null }),
    },
    from: () => ({
        select: () => ({
            order: () => ({ data: [], error: null }),
            eq: () => ({
                single: () => ({ data: null, error: null }),
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
    storage: {
        from: () => ({
            upload: async () => ({ data: { path: 'demo-path' }, error: null }),
            createSignedUrl: async () => ({ data: { signedUrl: 'https://demo.url' }, error: null }),
        }),
    },
}

export function createClient() {
    if (DEMO_MODE) {
        console.log('[DEMO MODE] Using mock Supabase client')
        return mockClient as any
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
