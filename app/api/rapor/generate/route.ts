// app/api/rapor/generate/route.ts
// ═══════════════════════════════════════════════════════════════
// API ENDPOINT — Generate Rapor 4 Dimensi
//
// GET  /api/rapor/generate        → ambil rapor dari cache Supabase (jika ada)
// POST /api/rapor/generate        → generate baru, simpan, kirim email
//
// Dipanggil dari:
//   1. Halaman /rapor (user klik "Lihat Rapor")
//   2. Cron job / webhook saat access_expires_at tercapai (opsional)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import { buildRaporPrompt } from '@/lib/rapor-rubrik'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const resend    = new Resend(process.env.RESEND_API_KEY!)

// ── GET: ambil rapor yang sudah ada ───────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id diperlukan' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('rapor')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return NextResponse.json({ rapor: null })
  return NextResponse.json({ rapor: data })
}

// ── POST: generate rapor baru ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'user_id diperlukan' }, { status: 400 })

    const admin = createAdminClient()

    // 1. Ambil data user dari profiles
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email, product_name, access_expires_at')
      .eq('id', user_id)
      .single()

    if (!profile) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    // 2. Ambil seluruh percakapan user dari Supabase
    //    CATATAN: sesuaikan nama tabel 'messages' dan nama kolom
    //    dengan struktur tabel messages di project kamu
    const { data: messages } = await admin
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })

    if (!messages || messages.length < 5) {
      return NextResponse.json({
        error: 'Percakapan terlalu sedikit untuk dinilai. Minimal 5 pesan diperlukan.'
      }, { status: 422 })
    }

    // 3. Format percakapan sebagai teks
    const percakapanTeks = messages
      .map(m => `${m.role === 'user' ? 'Pengguna' : 'Pak Andung'}: ${m.content}`)
      .join('\n\n')

    // 4. Panggil Anthropic API — TERPISAH dari chat biasa
    //    Ini adalah "LLM-as-judge" call, bukan chat Pak Andung
    console.log(`Generating rapor untuk user: ${user_id}`)

    const completion = await anthropic.messages.create({
      model:      'claude-opus-4-5',  // Gunakan model terkuat untuk akurasi penilaian
      max_tokens: 2000,
      messages: [
        {
          role:    'user',
          content: buildRaporPrompt(percakapanTeks),
        }
      ],
    })

    // 5. Parse JSON output
    const rawText = completion.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    let raporData
    try {
      // Bersihkan dari markdown backtick jika ada
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      raporData = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse error:', rawText)
      return NextResponse.json({ error: 'AI gagal generate format yang valid. Coba lagi.' }, { status: 500 })
    }

    // 6. Simpan ke Supabase tabel 'rapor'
    //    Jalankan SQL migration dulu (lihat komentar di bawah)
    const { data: savedRapor, error: saveError } = await admin
      .from('rapor')
      .upsert({
        user_id,
        ringkasan_umum: raporData.ringkasan_umum,
        dimensi:        raporData.dimensi,
        skor_rata:      Math.round(
          raporData.dimensi.reduce((sum: number, d: { skor: number }) => sum + d.skor, 0) / raporData.dimensi.length
        ),
        jumlah_pesan:   messages.length,
        generated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving rapor:', saveError)
      // Tetap lanjut ke email walaupun save gagal
    }

    // 7. Kirim email pengingat via Resend (JANGAN taruh skor di email)
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mulaiinvest.id'
    const raporUrl = `${appUrl}/rapor`
    const firstName = profile.full_name.split(' ')[0]

    try {
  await resend.emails.send({
    from:    `Pak Andung MulaiInvest <${process.env.RESEND_FROM_EMAIL || 'Admin@mulaiinvest.id'}>`,
    to:      profile.email,
    subject: `📋 Rapor ${profile.product_name?.includes('Trial') ? '7 hari' : '30 hari'} kamu sudah siap, ${firstName}`,
    html:    buildRaporEmailHtml({ firstName, raporUrl, productName: profile.product_name || '' }),
  })
  console.log(`Rapor generated dan email terkirim ke: ${profile.email}`)
} catch (emailError) {
  // Rapor sudah berhasil dinilai & disimpan di atas — jangan balas error ke user
  // hanya karena pengiriman email gagal (mereka tetap bisa lihat rapor di /rapor).
  console.error('Gagal kirim email rapor (rapor tetap tersimpan):', emailError)
}

    return NextResponse.json({
      success: true,
      rapor:   savedRapor || raporData,
    })

  } catch (error) {
    console.error('Rapor generation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ── EMAIL TEMPLATE (TANPA SKOR) ───────────────────────────────
function buildRaporEmailHtml({
  firstName, raporUrl, productName
}: { firstName: string; raporUrl: string; productName: string }): string {
  const isTrial   = productName.toLowerCase().includes('trial')
  const durasiStr = isTrial ? '7 hari' : '30 hari'

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5EDD8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#FDF8F0;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,76,92,0.12);">

    <!-- Header -->
    <div style="background:#0F4C5C;padding:32px 32px 24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">📋</div>
      <h1 style="margin:0;color:#FDF8F0;font-size:24px;font-weight:700;">
        Rapor ${durasiStr} kamu<br>sudah siap, ${firstName}!
      </h1>
      <p style="margin:10px 0 0;color:rgba(212,233,237,0.8);font-size:14px;">
        Pak Andung sudah menilai perkembanganmu selama ${durasiStr} ini.
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#3D4D58;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Selama ${durasiStr} bersama Pak Andung, kamu sudah berdiskusi tentang banyak hal soal saham dan investasi. 
        Sekarang saatnya melihat <strong>seberapa jauh cara berpikirmu berkembang</strong>.
      </p>

      <!-- Teaser tanpa skor -->
      <div style="background:#F5EDD8;border:2px solid #E2D9C8;border-radius:14px;padding:20px 24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#7A8D97;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">
          Rapor 4 Dimensi Kamu
        </p>
        <div style="display:flex;justify-content:center;gap:16px;margin:16px 0;flex-wrap:wrap;">
          ${['🏢 Bisnis', '📊 Finansial', '💰 Valuasi', '⚠️ Risiko'].map(d => `
            <div style="background:white;border-radius:10px;padding:10px 16px;font-size:13px;color:#0F4C5C;font-weight:600;border:1px solid #E2D9C8;">
              ${d}
            </div>
          `).join('')}
        </div>
        <p style="margin:8px 0 0;font-size:13px;color:#7A8D97;font-style:italic;">
          Buka rapor untuk melihat hasil lengkap + pertanyaan lanjutan
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${raporUrl}"
           style="display:inline-block;background:#0F4C5C;color:#FDF8F0;text-decoration:none;
                  padding:16px 36px;border-radius:14px;font-weight:700;font-size:15px;
                  letter-spacing:0.02em;">
          Buka Rapor Saya →
        </a>
      </div>

      <div style="background:#D4E9ED;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#1A2832;line-height:1.65;">
          💡 <strong>Tip:</strong> Setelah baca rapor, coba kerjakan <em>pertanyaan lanjutan</em> 
          dari Pak Andung — itu cara tercepat memperkuat titik lemahmu.
        </p>
      </div>

      ${isTrial ? `
      <div style="background:#FDF0DC;border:1px solid #F5D4A0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#7A4A0A;line-height:1.65;">
          🚀 <strong>Trial kamu sudah berakhir.</strong> Ingin lanjut dan lihat perkembangan 
          selama 30 hari penuh? <a href="https://mulaiinvest.id" style="color:#B5731C;font-weight:600;">Upgrade di sini</a>.
        </p>
      </div>` : ''}

      <p style="font-size:13px;color:#7A8D97;line-height:1.7;margin:0;">
        Ada pertanyaan? Balas email ini atau hubungi 
        <a href="mailto:Admin@mulaiinvest.id" style="color:#2D6E7E;">Admin@mulaiinvest.id</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F5EDD8;padding:20px 32px;text-align:center;border-top:1px solid #E2D9C8;">
      <p style="margin:0;font-size:12px;color:#7A8D97;">
        © 2024 MulaiInvest · <a href="https://mulaiinvest.id" style="color:#2D6E7E;">mulaiinvest.id</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE MIGRATION — jalankan SQL ini di Supabase SQL Editor
// sebelum menggunakan endpoint ini:
//
// CREATE TABLE IF NOT EXISTS rapor (
//   id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
//   ringkasan_umum TEXT,
//   dimensi       JSONB,
//   skor_rata     INTEGER,
//   jumlah_pesan  INTEGER,
//   generated_at  TIMESTAMPTZ DEFAULT NOW(),
//   created_at    TIMESTAMPTZ DEFAULT NOW()
// );
//
// ALTER TABLE rapor ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can read own rapor" ON rapor
//   FOR SELECT USING (auth.uid() = user_id);
//
// ═══════════════════════════════════════════════════════════════
