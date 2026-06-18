// app/page.tsx
// Halaman utama — cek login lalu arahkan ke halaman yang tepat
// Client component untuk menghindari cookie-setting error di Vercel serverless

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/chat')
      } else {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  return null
}

