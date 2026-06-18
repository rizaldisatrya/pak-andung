// app/page.tsx
// Halaman utama — cek login lalu arahkan ke halaman yang tepat
// Client component (pakai @/lib/supabase/client, SAMA dengan /login & ChatInterface
// — sebelumnya sempat pakai @supabase/auth-helpers-nextjs yang BEDA library dari
// sisa app ini; dua library Supabase browser berjalan bersamaan bisa saling
// rebutan lock auth dan membuat getSession() hang selamanya).

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const timeoutId = setTimeout(() => {
      setError('Auth timeout')
      router.push('/login')
    }, 8000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId)
      router.push(session?.user ? '/chat' : '/login')
    }).catch((err) => {
      clearTimeout(timeoutId)
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[/] Auth error:', msg)
      setError(msg)
      router.push('/login')
    })

    return () => clearTimeout(timeoutId)
  }, [router])

  if (error) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#c0392b', background: '#fff5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>Mengalihkan ke halaman login...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#7A8D97' }}>
      Memuat…
    </div>
  )
}
