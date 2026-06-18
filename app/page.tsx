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
        // getSession tidak melempar "Auth session missing" saat user logout
        // (berbeda dgn getUser). null session = belum login = ke /login.
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          router.push('/chat')
        } else {
          router.push('/login')
        }
      } catch (err) {
        // Error tak terduga -> tetap arahkan ke login agar tidak blank
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      }
    }
    checkAuth()
  }, [router])

  if (error) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#c0392b', background: '#fff5f5' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <a href="/login" style={{ color: '#0F4C5C' }}>→ Ke halaman login</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#7A8D97' }}>
      Memuat…
    </div>
  )
}


