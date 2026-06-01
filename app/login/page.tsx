'use client'
// app/login/page.tsx

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email atau password salah. Coba lagi ya.')
      setLoading(false)
      return
    }

    router.push('/chat')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0F4C5C 0%, #1a6878 50%, #0F4C5C 100%)' }}>

      {/* Decorative orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
           style={{ background: 'radial-gradient(circle, #E89B3C, transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="fixed bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
           style={{ background: 'radial-gradient(circle, #D4E9ED, transparent)', transform: 'translate(-30%, 30%)' }} />

      {/* Card */}
      <div className="w-full max-w-sm relative">

        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="text-3xl">📈</span>
          </div>
          <h1 className="font-serif text-3xl text-white mb-1">
            Pak <span style={{ color: '#E89B3C', fontStyle: 'italic' }}>Andung</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(212,233,237,0.8)' }}>
            Mentor investasi saham pribadimu
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-6 shadow-2xl"
             style={{ background: '#FDF8F0', border: '1px solid rgba(255,255,255,0.3)' }}>

          <h2 className="font-serif text-xl text-ink mb-1">Masuk ke akun kamu</h2>
          <p className="text-sm text-muted mb-6">
            Gunakan email & password yang dikirim saat kamu membeli akses.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-body mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: '#F5EDD8',
                  border: '2px solid #E2D9C8',
                  color: '#1A2832',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onFocus={e => e.target.style.borderColor = '#2D6E7E'}
                onBlur={e => e.target.style.borderColor = '#E2D9C8'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: '#F5EDD8',
                  border: '2px solid #E2D9C8',
                  color: '#1A2832',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onFocus={e => e.target.style.borderColor = '#2D6E7E'}
                onBlur={e => e.target.style.borderColor = '#E2D9C8'}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                   style={{ background: '#FDECEA', color: '#C0392B', border: '1px solid #F5C5C0' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60"
              style={{
                background: loading ? '#7A8D97' : '#0F4C5C',
                color: '#FDF8F0',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
                  </svg>
                  Masuk...
                </span>
              ) : 'Masuk →'}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-5">
            Belum punya akses?{' '}
            <a href="https://mulaiinvest.id" className="font-medium" style={{ color: '#2D6E7E' }}>
              Beli di sini
            </a>
          </p>
        </div>

        {/* Help text */}
        <p className="text-center text-xs mt-4" style={{ color: 'rgba(212,233,237,0.6)' }}>
          Ada masalah login? Email kami di{' '}
          <a href="mailto:Admin@mulaiinvest.id" className="underline" style={{ color: 'rgba(232,155,60,0.9)' }}>
            Admin@mulaiinvest.id
          </a>
        </p>
      </div>
    </div>
  )
}
