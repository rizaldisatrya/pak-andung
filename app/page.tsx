// app/page.tsx
// Halaman utama — cek login lalu arahkan ke halaman yang tepat
// Client component untuk menghindari cookie-setting error di Vercel serverless

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function HomePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient()

        // Timeout 10 detik jika getSession hang (network issue, CORS, dll)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout — arahkan ke /login')), 10000)
        )

        const sessionPromise = supabase.auth.getSession()
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getSession>>

        if (session?.user) {
          router.push('/chat')
        } else {
          router.push('/login')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[/] Auth error:', msg)
        setError(msg)
        // Fallback: arahkan ke /login setelah 2 detik
        setTimeout(() => router.push('/login'), 2000)
      }
    }
    checkAuth()
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



