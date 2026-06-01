// app/chat/page.tsx
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
    <div>
      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        background: '#0F4C5C',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <h1 style={{ 
          fontFamily: "'Instrument Serif', serif",
          fontSize: 20,
          color: '#FDF8F0',
          margin: 0
        }}>
          Mulai<span style={{ color: '#E89B3C', fontStyle: 'italic' }}>Invest</span>
        </h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
         <a 
  href="/rapor"
  style={{
    color: '#FDF8F0',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: 6,
  }}
>
  📋 Rapor Saya
</a>
        </div>
      </nav>

      {/* ═══ CHAT INTERFACE ═══ */}
      <ChatInterface
        userId={user.id}
        userName={profile.full_name || 'Kamu'}
        messageCount={profile.message_count}
        accessExpiresAt={profile.access_expires_at}
        initialMessages={messages || []}
      />
    </div>
  )
}
