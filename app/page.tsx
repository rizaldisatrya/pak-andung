// app/page.tsx
// Halaman utama — cek login lalu arahkan ke halaman yang tepat

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/chat')
  } else {
    redirect('/login')
  }
}
