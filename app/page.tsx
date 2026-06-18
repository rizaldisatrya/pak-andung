// app/page.tsx
// Halaman utama — cek login lalu arahkan ke halaman yang tepat
// Client component untuk menghindari cookie-setting error di Vercel serverless

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        if (user) {
          router.push('/chat')
        } else {
          router.push('/login')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (error) {
    return (
      <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#c0392b', background: '#fff5f5' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  return null
}


