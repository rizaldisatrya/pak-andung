// lib/supabase/server.ts
// Dipakai di Server Components dan API Routes (sisi server)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // Di Server Component, cookies bersifat read-only → set() melempar error.
          // Bungkus try-catch agar Supabase tidak retry refresh token tanpa henti
          // (penyebab OOM). Token tetap valid untuk request ini.
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // diabaikan dengan sengaja (read-only context)
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // diabaikan dengan sengaja (read-only context)
          }
        },
      },
    }
  )
}

// Versi admin — bypass Row Level Security, dipakai hanya di webhook
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
