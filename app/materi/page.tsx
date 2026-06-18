// app/materi/page.tsx
// Halaman "Baca Materi" — DI BALIK LOGIN (pola sama dengan /chat).
// Menentukan level ter-unlock user lalu menyerahkan ke <MateriReader>.
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { unlockedLevel, defaultAnchorWithCap, chapterForAnchor, materiChapterCap, LEVEL_LABEL } from '@/lib/materi-map'
import MateriReader from '@/components/MateriReader'

export const dynamic = 'force-dynamic'

export default async function MateriPage({
  searchParams,
}: {
  searchParams: { to?: string }
}) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_expires_at, level, completed_checkpoints, product_name, created_at')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const now = new Date()
  if (now > new Date(profile.access_expires_at)) redirect('/expired')

  const completed = Array.isArray(profile.completed_checkpoints)
    ? (profile.completed_checkpoints as string[])
    : []
  const unlocked = unlockedLevel(completed, profile.level)
  const cap = materiChapterCap(profile.product_name, profile.created_at)

  const raw = searchParams?.to
  let to = raw && /^[a-z0-9-]+$/i.test(raw) ? raw : defaultAnchorWithCap(unlocked, cap)
  if (cap != null) {
    const meta = chapterForAnchor(to)
    if (meta && meta.chapter > cap) to = defaultAnchorWithCap(unlocked, cap)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          background: '#0F4C5C',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: '0 0 auto',
        }}
      >
        <a
          href="/chat"
          style={{ color: '#FDF8F0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
        >
          ← Chat
        </a>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 18,
            color: '#FDF8F0',
            margin: 0,
          }}
        >
          📖 Materi
        </h1>
        <span style={{ color: '#A8D4DC', fontSize: 12, fontWeight: 500 }}>
          Level {unlocked} · {LEVEL_LABEL[unlocked]}
        </span>
      </nav>

      {/* ═══ READER ═══ */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MateriReader unlocked={unlocked} initialTo={to} cap={cap} />
      </div>
    </div>
  )
}
