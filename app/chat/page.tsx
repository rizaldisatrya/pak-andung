// app/chat/page.tsx
// Server component — cek login & akses SEBELUM render

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage() {
  const supabase = createServerSupabaseClient()
  // ... kode existing ...
  
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
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
