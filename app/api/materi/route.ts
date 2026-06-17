// app/api/materi/route.ts
// ─────────────────────────────────────────────────────────────
// Penyaji materi buku, DI BALIK LOGIN (mirror auth /chat).
// Merakit HTML buku (di-parse dari content/mulai_invest_full_v7.html), lalu:
//   - bab dengan level <= level user  -> tampil penuh
//   - bab di atas level user          -> kartu "Terkunci" (teaser)
// Override CSS layar agar nyaman dibaca-gulir di HP + nonaktif print.
// Dimuat lewat <iframe> oleh /materi (CSS buku terisolasi).
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { unlockedLevel, LEVEL_LABEL } from '@/lib/materi-map'
import { getMateri } from '@/lib/materi-parse'

export const dynamic = 'force-dynamic'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const OVERRIDE_CSS = `
.materi-screen { background:#e8e4dc; }
.materi-screen .page { width:auto !important; max-width:780px !important; min-height:0 !important; margin:0 auto 14px auto !important; padding:26px 22px !important; box-shadow:0 1px 8px rgba(0,0,0,.07); border-radius:4px; }
.materi-screen .page.page-cover, .materi-screen .page.chapter-opener { padding-top:40px !important; padding-bottom:40px !important; }
@media (max-width:640px){ .materi-screen .page { padding:18px 15px !important; } }
.materi-locked .lock-card { background:#fff; max-width:780px; margin:0 auto 14px auto; padding:30px 22px; border-radius:4px; box-shadow:0 1px 8px rgba(0,0,0,.07); text-align:center; border:1px dashed #b9b2a2; }
.materi-locked .lock-ic { font-size:30px; }
.materi-locked .lock-bab { font-family:'Public Sans',sans-serif; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#9a8f78; margin-top:6px; }
.materi-locked .lock-title { font-family:'Fraunces',serif; font-size:19px; color:#1a1d29; margin:4px 0 10px; line-height:1.25; }
.materi-locked .lock-msg { font-family:'Public Sans',sans-serif; font-size:13px; color:#6b7280; margin:0; }
@media print { body { display:none !important; } }
`

export async function GET(req: NextRequest) {
  // 1. Auth + expiry (pola sama dengan /chat)
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('access_expires_at, level, completed_checkpoints')
    .eq('id', user.id)
    .single()
  if (!profile) return new NextResponse('Unauthorized', { status: 401 })
  if (new Date() > new Date(profile.access_expires_at)) {
    return new NextResponse('Akses berakhir', { status: 403 })
  }

  // 2. Level yang sudah ter-unlock
  const completed = Array.isArray(profile.completed_checkpoints)
    ? (profile.completed_checkpoints as string[])
    : []
  const unlocked = unlockedLevel(completed, profile.level)

  // 3. Anchor target (sanitasi)
  const toRaw = req.nextUrl.searchParams.get('to') || ''
  const to = /^[a-z0-9-]+$/i.test(toRaw) ? toRaw : ''

  // 4. Rakit body: bab terkunci -> satu kartu teaser (di blok opener)
  const materi = await getMateri()
  if (!materi) {
    return new NextResponse(
      '<!DOCTYPE html><html lang="id"><body style="font-family:sans-serif;padding:32px;color:#3D4D58;background:#FDF8F0"><h2>Materi belum tersedia</h2><p>File buku belum diunggah ke server. Hubungi admin.</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
  const { head, blocks } = materi
  const body = blocks
    .map((b) => {
      if (b.kind !== 'chapter' || b.level <= unlocked) return b.html
      if (!b.anchor) return '' // lewati isi bab terkunci
      const label = LEVEL_LABEL[b.level] || ''
      return `<section class="page materi-locked"><div class="lock-card">
        <div class="lock-ic">🔒</div>
        <div class="lock-bab">Bab ${b.chapter}</div>
        <div class="lock-title">${escapeHtml(b.title)}</div>
        <p class="lock-msg">Terkunci. Capai <strong>Level ${b.level} · ${label}</strong> untuk membuka bab ini.</p>
      </div></section>`
    })
    .join('\n')

  const scrollJs = to
    ? `<script>window.addEventListener('load',function(){var el=document.getElementById(${JSON.stringify(to)});if(el){el.scrollIntoView();}});</script>`
    : ''

  const html = `<!DOCTYPE html><html lang="id"><head>${head}<style>${OVERRIDE_CSS}</style></head><body class="materi-screen">${body}${scrollJs}</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
