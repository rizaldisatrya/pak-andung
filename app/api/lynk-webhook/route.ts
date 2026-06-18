// app/api/lynk-webhook/route.ts
// ═══════════════════════════════════════════════════════════════
// ENDPOINT WEBHOOK DARI LYNK.ID
// Saat pembeli selesai bayar, Lynk mengirim POST ke sini.
// Kita buat akun → set akses → kirim email login.
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { DEFAULT_ACCESS_DAYS, TRIAL_ACCESS_DAYS, isTrialProduct } from '@/lib/config'


// ── COHORT DETECTION FUNCTIONS ──────────────────────────────
const COHORT_KEYWORDS = ['cohort', 'sesi', 'expert', 'learning cohort']

function isCohortProduct(productName: string): boolean {
  return COHORT_KEYWORDS.some(kw =>
    productName.toLowerCase().includes(kw)
  )
}

const resend = new Resend(process.env.RESEND_API_KEY!)

// ── CONTOH PAYLOAD DARI LYNK.ID ─────────────────────────────
// Ini adalah struktur data yang Lynk kirim saat bayar sukses.
// Sesuaikan field name di bagian "Ambil data" di bawah jika Lynk
// menggunakan nama field yang berbeda.
//
// {
//   "event": "payment.success",
//   "order_id": "ORD-12345",
//   "buyer_name": "Budi Santoso",
//   "buyer_email": "budi@email.com",
//   "buyer_phone": "081234567890",
//   "product_name": "Pak Andung — Akses 30 Hari",
//   "amount": 79000,
//   "paid_at": "2024-01-15T10:30:00Z"
// }
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 🔥 FIRST LOG SEBELUM APAPUN
    //console.log('🚀 WEBHOOK ENDPOINT HIT')
    //console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
// Verifikasi signature dari Lynk
    const signature = req.headers.get('x-lynk-signature')
    console.log('Signature dari Lynk:', signature)
    
    if (!signature) {
      console.error('⚠️ Signature tidak ditemukan')
      return NextResponse.json({ error: 'Unauthorized: missing signature' }, { status: 401 })
    }
    
    // TODO: Implement signature verification dengan crypto jika diperlukan
    // Untuk sekarang, terima signature yang ada (asalkan ada)
    console.log('✅ Signature valid (received)')

    const payload = await req.json()
    // 🔥 DEBUG: Cek apakah webhook diterima
    //console.log('🔥 WEBHOOK HIT - Payload diterima:', JSON.stringify(payload, null, 2))
    console.log('Lynk webhook received:', JSON.stringify(payload, null, 2))

   // ── AMBIL DATA PEMBELI ─────────────────────────────────────
    // Struktur payload Lynk: nested di dalam data.message_data
    const customerData = payload.data?.message_data?.customer || {}
    const itemsData    = payload.data?.message_data?.items || []
    
    const buyerName    = customerData.name      || payload.buyer_name || payload.name || 'Pelanggan'
    const buyerEmail   = customerData.email     || payload.buyer_email || payload.email || ''
    const productName  = itemsData[0]?.title    || payload.product_name || payload.product || ''
    const eventType    = payload.event          || 'payment.success'
    
    // Debug: lihat nilai setelah extract
    //console.log('📊 Data setelah extract:', { buyerName, buyerEmail, productName, eventType })

   // Hanya proses event pembayaran sukses
    const isPaymentSuccess = eventType.includes('success') || eventType.includes('paid') || eventType.includes('complete') || eventType.includes('received')
    
    if (!isPaymentSuccess) {
      console.log('⏭️ Event diabaikan (bukan payment success):', eventType)
      return NextResponse.json({ message: 'Event diabaikan' })
    }
    
    //console.log('✅ Event valid, lanjut buat akun...')

    if (!buyerEmail) {
      console.error('Email pembeli tidak ditemukan dalam payload')
      return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 400 })
    }

// ── CEK APAKAH INI PRODUK COHORT ──────────────────
const isCohort = isCohortProduct(productName)

if (isCohort) {
  // ALUR COHORT
  const admin = createAdminClient()

  // Cari sesi cohort yang sesuai dengan nama produk
  const { data: cohortSessions } = await admin
    .from('cohort_sessions')
    .select('*')
    .eq('aktif', true)

  // Cari sesi yang topiknya mirip dengan nama produk
  const matchedSession = cohortSessions?.find(s =>
    productName.toLowerCase().includes(s.speaker_nama.toLowerCase().split(' ')[0].toLowerCase()) ||
    s.topik.toLowerCase().split(' ').some((kata: string) => productName.toLowerCase().includes(kata))
  )

  if (!matchedSession) {
    console.error('Cohort session tidak ditemukan untuk produk:', productName)
    return NextResponse.json({ error: 'Sesi cohort tidak ditemukan' }, { status: 404 })
  }

  // Update slot tersisa
  await admin
    .from('cohort_sessions')
    .update({ slot_tersisa: Math.max(0, matchedSession.slot_tersisa - 1) })
    .eq('id', matchedSession.id)

  // Kirim email berisi link meeting
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mulaiinvest.id'
  const fromEmail    = process.env.RESEND_FROM_EMAIL   || 'Admin@mulaiinvest.id'
  const tglFormatted = new Date(matchedSession.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  await resend.emails.send({
    from:    `Pak Andung MulaiInvest <${fromEmail}>`,
    to:      buyerEmail,
    subject: `🎓 Link sesi cohort kamu — ${tglFormatted}`,
    html:    buildCohortEmailHtml({
      buyerName:    buyerName,
      tanggal:      tglFormatted,
      waktuMulai:   matchedSession.waktu_mulai,
      speakerNama:  matchedSession.speaker_nama,
      topik:        matchedSession.topik,
      linkMeeting:  matchedSession.link_meeting,
    }),
  })

  console.log(`✅ Email cohort terkirim ke: ${buyerEmail} untuk sesi: ${matchedSession.topik}`)

  return NextResponse.json({
    success:     true,
    type:        'cohort',
    message:     'Link meeting terkirim ke email pembeli',
    email:       buyerEmail,
    session_id:  matchedSession.id,
  })
}

// ── TENTUKAN DURASI AKSES (untuk non-cohort) ────────────────
    
    // ── TENTUKAN DURASI AKSES ──────────────────────────────────
    // Kalau nama produk mengandung kata trial, beri akses 7 hari.
    // Kalau tidak, beri akses 30 hari.
    const isTrial = isTrialProduct(productName)
    const accessDays    = isTrial ? TRIAL_ACCESS_DAYS : DEFAULT_ACCESS_DAYS
    const expiresAt     = new Date()
    expiresAt.setDate(expiresAt.getDate() + accessDays)

    // ── BUAT AKUN DI SUPABASE ──────────────────────────────────
    const admin = createAdminClient()

    // Generate password sementara yang mudah dibaca
    const tempPassword = generatePassword()

    // Cek apakah email sudah terdaftar
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === buyerEmail)

    let userId: string

    if (existingUser) {
      // Sudah ada → update akses (perpanjangan)
      userId = existingUser.id
      await admin.auth.admin.updateUserById(userId, { password: tempPassword })
      await admin.from('profiles')
        .update({
          full_name:         buyerName,
          product_name:      productName,
          access_expires_at: expiresAt.toISOString(),
          message_count:     0, // reset counter saat perpanjang
        })
        .eq('id', userId)

      console.log(`Akses diperpanjang untuk: ${buyerEmail}`)
    } else {
      // Belum ada → buat akun baru
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email:         buyerEmail,
        password:      tempPassword,
        email_confirm: true, // langsung aktif, tanpa perlu verifikasi email
      })

      if (createError || !newUser?.user) {
        throw new Error(`Gagal buat akun: ${createError?.message}`)
      }

      userId = newUser.user.id

      // Buat profil
      await admin.from('profiles').insert({
        id:                userId,
        full_name:         buyerName,
        email:             buyerEmail,
        product_name:      productName,
        access_expires_at: expiresAt.toISOString(),
        message_count:     0,
      })

      console.log(`Akun baru dibuat untuk: ${buyerEmail}`)
    }

    // ── KIRIM EMAIL LOGIN ──────────────────────────────────────
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mulaiinvest.id'
    const fromEmail   = process.env.RESEND_FROM_EMAIL   || 'Admin@mulaiinvest.id'
    const expiresStr  = expiresAt.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    await resend.emails.send({
      from:    `Pak Andung MulaiInvest <${fromEmail}>`,
      to:      buyerEmail,
      subject: `🎉 Akses Pak Andung kamu sudah siap, ${buyerName.split(' ')[0]}!`,
      html: buildEmailHtml({
        buyerName,
        buyerEmail,
        tempPassword,
        appUrl,
        accessDays,
        expiresStr,
        isTrial,
        productName,
      }),
    })

    console.log(`Email login terkirim ke: ${buyerEmail}`)

    return NextResponse.json({
      success:  true,
      message:  `Akun ${existingUser ? 'diperbarui' : 'dibuat'} dan email terkirim`,
      email:    buyerEmail,
      expires:  expiresAt.toISOString(),
      isTrial,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', detail: String(error) },
      { status: 500 }
    )
  }
}

// ── GENERATE PASSWORD ──────────────────────────────────────────
// Password 10 karakter yang mudah dibaca (tanpa huruf ambigu)
function generatePassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)]
  }
  // Kapitalisasi huruf pertama agar memenuhi syarat password umum
  return pass.charAt(0).toUpperCase() + pass.slice(1)
}

// ── TEMPLATE EMAIL HTML ────────────────────────────────────────
interface EmailProps {
  buyerName: string
  buyerEmail: string
  tempPassword: string
  appUrl: string
  accessDays: number
  expiresStr: string
  isTrial: boolean
  productName: string
}

function buildEmailHtml(p: EmailProps): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Akses Pak Andung kamu sudah siap</title>
</head>
<body style="margin:0;padding:0;background:#F5EDD8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#FDF8F0;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,76,92,0.12);">

    <!-- Header -->
    <div style="background:#0F4C5C;padding:32px 32px 24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">📈</div>
      <h1 style="margin:0;color:#FDF8F0;font-size:26px;font-weight:700;">
        Halo, ${p.buyerName.split(' ')[0]}! 🎉
      </h1>
      <p style="margin:8px 0 0;color:rgba(212,233,237,0.8);font-size:14px;">
        Akses <strong style="color:#E89B3C">Pak Andung</strong> kamu sudah siap.
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#3D4D58;font-size:15px;line-height:1.7;margin:0 0 24px;">
        ${p.isTrial
          ? `Selamat datang di <strong>Trial ${p.accessDays} Hari</strong> Pak Andung! Selama ${p.accessDays} hari ke depan, kamu bisa tanya apa saja soal investasi saham langsung ke Pak Andung.`
          : `Terima kasih sudah membeli akses <strong>${p.productName}</strong>! Selama <strong>${p.accessDays} hari</strong> ke depan, Pak Andung siap menemani perjalanan investasimu.`
        }
      </p>

      <!-- Login box -->
      <div style="background:#F5EDD8;border:2px solid #E2D9C8;border-radius:14px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7A8D97;letter-spacing:0.1em;text-transform:uppercase;">
          Data Login Kamu
        </p>
        <table style="width:100%;margin-top:16px;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#7A8D97;width:90px;">Email</td>
            <td style="padding:8px 0;font-size:14px;color:#1A2832;font-weight:600;">${p.buyerEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#7A8D97;">Password</td>
            <td style="padding:8px 0;font-size:16px;color:#0F4C5C;font-weight:700;font-family:monospace;letter-spacing:0.05em;">
              ${p.tempPassword}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#7A8D97;">Akses sampai</td>
            <td style="padding:8px 0;font-size:13px;color:#1A2832;">${p.expiresStr}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${p.appUrl}" 
           style="display:inline-block;background:#0F4C5C;color:#FDF8F0;text-decoration:none;
                  padding:16px 36px;border-radius:14px;font-weight:700;font-size:15px;
                  letter-spacing:0.02em;">
          Mulai Chat dengan Pak Andung →
        </a>
      </div>

      <!-- Tips -->
      <div style="background:#D4E9ED;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#0F4C5C;text-transform:uppercase;letter-spacing:0.08em;">
          Tips pertama dari Pak Andung:
        </p>
        <p style="margin:0;font-size:14px;color:#1A2832;line-height:1.65;">
          Coba tanya: <em>"Pak Andung, tolong bantu saya analisa saham [nama saham yang kamu minati]"</em> — 
          dan kita akan bahas bersama dari 4 dimensi: bisnis, keuangan, valuasi, dan risiko.
        </p>
      </div>

      ${p.isTrial ? `
      <div style="background:#FDF0DC;border:1px solid #F5D4A0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#7A4A0A;line-height:1.65;">
          ⏳ <strong>Ini akses trial ${p.accessDays} hari.</strong> Setelah trial berakhir, kamu bisa upgrade 
          ke akses penuh 30 hari di <a href="https://mulaiinvest.id" style="color:#B5731C;">mulaiinvest.id</a>.
        </p>
      </div>` : ''}

      <p style="font-size:13px;color:#7A8D97;line-height:1.7;margin:0;">
        Ada pertanyaan atau masalah login? Balas email ini atau hubungi kami di
        <a href="mailto:Admin@mulaiinvest.id" style="color:#2D6E7E;">Admin@mulaiinvest.id</a>.
        Kami biasanya membalas dalam 1–2 jam di hari kerja.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F5EDD8;padding:20px 32px;text-align:center;border-top:1px solid #E2D9C8;">
      <p style="margin:0;font-size:12px;color:#7A8D97;">
        © 2024 MulaiInvest · 
        <a href="https://mulaiinvest.id" style="color:#2D6E7E;">mulaiinvest.id</a> · 
        Untuk berhenti berlangganan, hubungi Admin@mulaiinvest.id
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// ── EMAIL TEMPLATE UNTUK COHORT ──────────────────
function buildCohortEmailHtml({
  buyerName,
  tanggal,
  waktuMulai,
  speakerNama,
  topik,
  linkMeeting,
}: {
  buyerName:   string
  tanggal:     string
  waktuMulai:  string
  speakerNama: string
  topik:       string
  linkMeeting: string
}): string {
  const firstName = buyerName.split(' ')[0]

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
      <div style="font-size:40px;margin-bottom:12px;">🎓</div>
      <h1 style="margin:0;color:#FDF8F0;font-size:24px;font-weight:700;">
        Halo, ${firstName}!<br>Tempat kamu sudah terkonfirmasi.
      </h1>
      <p style="margin:10px 0 0;color:rgba(212,233,237,0.8);font-size:14px;">
        Berikut detail sesi cohort kamu.
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <!-- Detail sesi -->
      <div style="background:#F5EDD8;border:2px solid #E2D9C8;border-radius:14px;padding:22px 24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7A8D97;letter-spacing:0.1em;text-transform:uppercase;">
          Detail Sesi
        </p>
        <table style="width:100%;margin-top:14px;border-collapse:collapse;">
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#7A8D97;width:100px;vertical-align:top;">Tanggal</td>
            <td style="padding:7px 0;font-size:14px;color:#1A2832;font-weight:600;">${tanggal}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#7A8D97;vertical-align:top;">Waktu</td>
            <td style="padding:7px 0;font-size:14px;color:#1A2832;">${waktuMulai} (up to 2 jam)</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#7A8D97;vertical-align:top;">Speaker</td>
            <td style="padding:7px 0;font-size:14px;color:#1A2832;font-weight:600;">${speakerNama}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#7A8D97;vertical-align:top;">Topik</td>
            <td style="padding:7px 0;font-size:14px;color:#1A2832;">${topik}</td>
          </tr>
        </table>
      </div>

      <!-- Link meeting (highlight utama) -->
      <div style="background:#DCF0E5;border:2px solid #B2DEC5;border-radius:14px;padding:22px 24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#2E7D52;text-transform:uppercase;letter-spacing:0.08em;">
          🔗 Link Sesi Kamu
        </p>
        <a href="${linkMeeting}"
           style="display:inline-block;background:#2E7D52;color:white;text-decoration:none;
                  padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;
                  letter-spacing:0.02em;margin-top:8px;">
          Masuk ke Sesi →
        </a>
        <p style="margin:12px 0 0;font-size:12px;color:#2E7D52;word-break:break-all;">
          ${linkMeeting}
        </p>
      </div>

      <div style="background:#FDF0DC;border:1px solid #F5D4A0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#7A4A0A;line-height:1.65;">
          ⏰ <strong>Simpan link ini.</strong> Masuk ke sesi tepat waktu pada ${tanggal} jam ${waktuMulai}.
          Siapkan pertanyaan kamu sebelum sesi dimulai!
        </p>
      </div>

      <p style="font-size:13px;color:#7A8D97;line-height:1.7;margin:0;">
        Ada kendala? Balas email ini atau hubungi
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
