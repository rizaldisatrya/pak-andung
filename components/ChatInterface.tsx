'use client'
// components/ChatInterface.tsx
// Komponen utama antarmuka chat — semua interaksi pengguna ada di sini

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SOFT_CAP_MESSAGES } from '@/lib/config'
import ProgressRail, { RailScores } from '@/components/ProgressRail'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface InitialProgress {
  level: number
  levelLabel: string
  focus: string
  xp: number
  scores: RailScores
}

interface Props {
  userId: string
  userName: string
  messageCount: number
  accessExpiresAt: string
  initialMessages: Message[]
  initialProgress: InitialProgress
}

export default function ChatInterface({
  userId, userName, messageCount: initialCount, accessExpiresAt, initialMessages, initialProgress
}: Props) {
  const [messages, setMessages]     = useState<Message[]>(initialMessages)
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [msgCount, setMsgCount]     = useState(initialCount)
  const [showMenu, setShowMenu]     = useState(false)
  const [progress, setProgress]     = useState<InitialProgress>(initialProgress)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Hitung sisa hari akses
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(accessExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ))

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    // Tambah pesan user ke layar segera
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, messageCount: msgCount }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
      setMsgCount(data.newMessageCount)

      // Update ProgressRail dari sidecar yang sudah di-parse server
      if (data.progress) {
        setProgress({
          level: data.progress.level,
          levelLabel: data.progress.level_label,
          focus: data.progress.focus,
          xp: data.progress.xp,
          scores: data.progress.scores,
        })
      }

    } catch (err) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Maaf, ada gangguan koneksi sebentar. Coba kirim lagi ya. 🙏',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format waktu pesan
  function formatTime(iso?: string) {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const softCapWarning = msgCount >= SOFT_CAP_MESSAGES * 0.9 && msgCount < SOFT_CAP_MESSAGES

  return (
    <div className="flex flex-col h-screen" style={{ background: '#FDF8F0', maxWidth: 720, margin: '0 auto' }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-3 shadow-sm z-10"
           style={{ background: '#0F4C5C', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: 'rgba(232,155,60,0.2)', border: '1px solid rgba(232,155,60,0.3)' }}>
            📈
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Pak Andung</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(212,233,237,0.7)' }}>
              MulaiInvest · Mentor Investasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sisa hari akses */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
               style={{
                 background: daysLeft <= 3 ? 'rgba(192,57,43,0.2)' : 'rgba(255,255,255,0.1)',
                 color: daysLeft <= 3 ? '#FFAAAA' : 'rgba(212,233,237,0.8)',
                 border: `1px solid ${daysLeft <= 3 ? 'rgba(192,57,43,0.3)' : 'rgba(255,255,255,0.1)'}`,
               }}>
            <span>🗓</span>
            <span>{daysLeft} hari tersisa</span>
          </div>

          {/* Menu */}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
              ⋯
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 rounded-xl shadow-xl py-1 z-50 min-w-44"
                   style={{ background: '#FDF8F0', border: '1px solid #E2D9C8' }}>
                <p className="px-4 py-2 text-xs text-muted border-b" style={{ borderColor: '#E2D9C8' }}>
                  Hai, <strong>{userName}</strong>
                </p>
                <p className="px-4 py-2 text-xs text-muted sm:hidden">
                  🗓 {daysLeft} hari tersisa
                </p>
                <a href="https://mulaiinvest.id" target="_blank"
                   className="block px-4 py-2.5 text-sm text-body hover:bg-cream-dark transition-colors">
                  🔄 Perpanjang akses
                </a>
                <a href="mailto:Admin@mulaiinvest.id"
                   className="block px-4 py-2.5 text-sm text-body hover:bg-cream-dark transition-colors">
                  ✉️ Hubungi admin
                </a>
                <hr style={{ borderColor: '#E2D9C8' }} />
                <button onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#C0392B' }}>
                  🚪 Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PROGRESS RAIL ── */}
      <ProgressRail
        level={progress.level}
        levelLabel={progress.levelLabel}
        focus={progress.focus}
        xp={progress.xp}
        scores={progress.scores}
      />

      {/* ── PERINGATAN SOFT CAP ── */}
      {softCapWarning && (
        <div className="px-4 py-2.5 text-xs text-center"
             style={{ background: '#FDF0DC', color: '#B5731C', borderBottom: '1px solid #F5D4A0' }}>
          ⚡ Kamu sudah mengirim {msgCount} dari {SOFT_CAP_MESSAGES} pesan dalam periode ini. Semangat belajarnya keren!
        </div>
      )}

      {/* ── AREA PESAN ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Pesan sambutan jika belum ada riwayat */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-4">
            <div className="text-5xl">👋</div>
            <div>
              <p className="font-serif text-2xl text-ink mb-2">Halo, {userName}!</p>
              <p className="text-sm text-muted max-w-xs">
                Saya Pak Andung, mentor investasi saham kamu. Mau mulai dari mana hari ini?
                Tanya apa saja soal saham, analisa, atau strategi investasi.
              </p>
            </div>
            {/* Prompt starters */}
            <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-sm">
              {[
                '📊 Cara baca laporan keuangan?',
                '🔍 Apa itu PBV dan PER?',
                '💡 Saham value vs growth?',
                '⚠️ Bagaimana kelola risiko?',
              ].map(q => (
                <button key={q} onClick={() => setInput(q.slice(3))}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                        style={{ background: '#D4E9ED', color: '#0F4C5C', border: '1px solid #B0D4DC' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render pesan */}
        {messages.map((msg) => (
          <div key={msg.id}
               className={`flex gap-3 message-enter ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm
                            ${msg.role === 'assistant'
                              ? 'bg-teal text-white'
                              : 'text-white'}`}
                 style={msg.role === 'user' ? { background: '#2D6E7E' } : { background: '#0F4C5C' }}>
              {msg.role === 'assistant' ? '📈' : userName.charAt(0).toUpperCase()}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                   style={msg.role === 'assistant'
                     ? { background: '#FFFFFF', color: '#1A2832', border: '1px solid #E2D9C8',
                         borderTopLeftRadius: 4 }
                     : { background: '#0F4C5C', color: '#FDF8F0', borderTopRightRadius: 4 }}>
                {msg.content}
              </div>
              <span className="text-xs text-muted px-1">{formatTime(msg.created_at)}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 message-enter">
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm"
                 style={{ background: '#0F4C5C' }}>📈</div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E2D9C8', borderTopLeftRadius: 4 }}>
              <div className="flex gap-1 items-center h-4">
                <div className="typing-dot w-2 h-2 rounded-full" style={{ background: '#7A8D97' }}/>
                <div className="typing-dot w-2 h-2 rounded-full" style={{ background: '#7A8D97' }}/>
                <div className="typing-dot w-2 h-2 rounded-full" style={{ background: '#7A8D97' }}/>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div className="px-4 pb-safe pb-4 pt-3"
           style={{ background: '#FDF8F0', borderTop: '1px solid #E2D9C8' }}>
        <div className="flex items-end gap-2 px-4 py-2 rounded-2xl"
             style={{ background: '#FFFFFF', border: '2px solid #E2D9C8' }}
             onFocus={() => {}} // handled per-element
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya Pak Andung soal investasi..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none outline-none text-sm leading-relaxed py-1 bg-transparent"
            style={{ color: '#1A2832', fontFamily: 'DM Sans, sans-serif', maxHeight: 120 }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: input.trim() && !loading ? '#0F4C5C' : '#E2D9C8' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? '#FDF8F0' : '#7A8D97'} strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-muted mt-2">
          Enter kirim · Shift+Enter baris baru · {msgCount}/{SOFT_CAP_MESSAGES} pesan
        </p>
      </div>
    </div>
  )
}
