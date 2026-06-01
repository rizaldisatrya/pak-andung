// app/chat/page.tsx
// Server component — cek login & akses SEBELUM render

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage() {
  const supabase = createServerSupabaseClient()

  // 1. Cek apakah sudah login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Ambil profil pengguna (termasuk tanggal akses berakhir)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // 3. Cek apakah akses masih berlaku
  const now = new Date()
  const expires = new Date(profile.access_expires_at)
  if (now > expires) redirect('/expired')

  // 4. Ambil riwayat chat (50 pesan terakhir)
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <ChatInterface
      userId={user.id}
      userName={profile.full_name || 'Kamu'}
      messageCount={profile.message_count}
      accessExpiresAt={profile.access_expires_at}
      initialMessages={messages || []}
    />
  )
}
