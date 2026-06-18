'use client'
// app/rapor/page.tsx
// ═══════════════════════════════════════════════════════════════
// HALAMAN RAPOR SAYA
// Tampilkan 4 kartu dimensi + grafik batang
// Dipanggil saat user klik "Lihat Rapor" atau akses berakhir
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// ── TYPES ─────────────────────────────────────────────────────
interface DimensiRapor {
  id: string
  nama: string
  skor: number
  label: 'Kuat' | 'Sedang' | 'Lemah'
  apa_yang_bagus: string
  area_berkembang: string
  pertanyaan_lanjutan: string
}

interface RaporData {
  ringkasan_umum: string
  dimensi: DimensiRapor[]
  skor_rata: number
  jumlah_pesan: number
  generated_at: string
}

// ── CONSTANTS ─────────────────────────────────────────────────
const DIMENSI_META: Record<string, { emoji: string; warna: string; warnaLight: string }> = {
  bisnis:    { emoji: '🏢', warna: '#0F4C5C', warnaLight: '#D4E9ED' },
  finansial: { emoji: '📊', warna: '#2E7D52', warnaLight: '#DCF0E5' },
  valuasi:   { emoji: '💰', warna: '#B5731C', warnaLight: '#FDF0DC' },
  risiko:    { emoji: '⚠️', warna: '#C0392B', warnaLight: '#FDECEA' },
}

const LABEL_META = {
  Kuat:   { warna: '#2E7D52', bg: '#DCF0E5', border: '#B2DEC5' },
  Sedang: { warna: '#B5731C', bg: '#FDF0DC', border: '#F5D4A0' },
  Lemah:  { warna: '#C0392B', bg: '#FDECEA', border: '#F5C5C0' },
}

// ── KOMPONEN BAR CHART SEDERHANA ──────────────────────────────
function GrafikBatang({ dimensi }: { dimensi: DimensiRapor[] }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E2D9C8',
      borderRadius: 14,
      padding: '24px 28px',
      marginBottom: 32,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A8D97', marginBottom: 20 }}>
        Ringkasan 4 Dimensi
      </p>
      {dimensi.map(d => {
        const meta = DIMENSI_META[d.id]
        return (
          <div key={d.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2832' }}>
                {meta?.emoji} {d.nama}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: meta?.warna }}>
                {d.skor}/100
              </span>
            </div>
            {/* Track */}
            <div style={{ height: 10, background: '#F5EDD8', borderRadius: 99, overflow: 'hidden' }}>
              {/* Fill */}
              <div style={{
                height: '100%',
                width: `${d.skor}%`,
                background: meta?.warna,
                borderRadius: 99,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── KOMPONEN KARTU DIMENSI ────────────────────────────────────
function KartuDimensi({ d }: { d: DimensiRapor }) {
  const meta      = DIMENSI_META[d.id]
  const labelMeta = LABEL_META[d.label]

  return (
    <div style={{
      background: 'white',
      border: `1px solid #E2D9C8`,
      borderTop: `3px solid ${meta?.warna}`,
      borderRadius: 14,
      padding: '22px 24px',
      marginBottom: 16,
    }}>
      {/* Header kartu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A8D97', marginBottom: 4 }}>
            {meta?.emoji} Dimensi
          </p>
          <h3 style={{ fontSize: 19, fontFamily: "'Instrument Serif', serif", color: '#1A2832', lineHeight: 1.2, margin: 0 }}>
            {d.nama}
          </h3>
        </div>
        <div style={{
          background: labelMeta?.bg,
          border: `1px solid ${labelMeta?.border}`,
          color: labelMeta?.warna,
          fontSize: 13,
          fontWeight: 700,
          padding: '6px 14px',
          borderRadius: 20,
          flexShrink: 0,
          marginLeft: 12,
        }}>
          {d.label}
        </div>
      </div>

      {/* Apa yang bagus */}
      <div style={{ background: '#DCF0E5', border: '1px solid #B2DEC5', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#2E7D52', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          ✅ Yang sudah bagus
        </p>
        <p style={{ fontSize: 14, color: '#1A5236', lineHeight: 1.65, margin: 0 }}>
          {d.apa_yang_bagus}
        </p>
      </div>

      {/* Area berkembang */}
      <div style={{ background: '#FDF0DC', border: '1px solid #F5D4A0', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#B5731C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          🎯 Bisa diperdalam
        </p>
        <p style={{ fontSize: 14, color: '#7A4A0A', lineHeight: 1.65, margin: 0 }}>
          {d.area_berkembang}
        </p>
      </div>

      {/* Pertanyaan lanjutan */}
      <div style={{ background: '#D4E9ED', border: '1px solid #B0D4DC', borderRadius: 10, padding: '12px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#0F4C5C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          💬 Coba tanyakan ke Pak Andung
        </p>
        <p style={{ fontSize: 14, color: '#1A2832', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
          "{d.pertanyaan_lanjutan}"
        </p>
      </div>
    </div>
  )
}

// ── HALAMAN UTAMA ─────────────────────────────────────────────
export default function RaporPage() {
  const supabase = createClient()

  const [userId, setUserId]           = useState<string | null>(null)
  const [profile, setProfile]         = useState<{ full_name: string; access_expires_at: string } | null>(null)
  const [rapor, setRapor]             = useState<RaporData | null>(null)
  const [loading, setLoading]         = useState(false)
  const [generating, setGenerating]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const aksesExpired = profile
    ? new Date(profile.access_expires_at) < new Date()
    : false

  // Ambil user session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
      }
    })
  }, [supabase])

  // Ambil profile & rapor yang sudah ada
  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, access_expires_at')
        .eq('id', userId)
        .single()
      setProfile(prof)

      // Fetch rapor jika sudah ada
      const res  = await fetch(`/api/rapor/generate?user_id=${userId}`)
      const json = await res.json()
      if (json.rapor) setRapor(json.rapor)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // Generate rapor baru
  async function handleGenerateRapor() {
    if (!userId) return
    setGenerating(true)
    setError(null)
    try {
      const res  = await fetch('/api/rapor/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal generate rapor')
      setRapor(json.rapor.dimensi ? json.rapor : json.rapor)
      await fetchData() // refresh
    } catch (e) {
      setError(String(e))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#7A8D97', fontFamily: 'DM Sans, sans-serif' }}>Memuat rapor kamu...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0F4C5C', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/chat" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#FDF8F0', textDecoration: 'none' }}>
          Mulai<em style={{ color: '#E89B3C', fontStyle: 'italic' }}>Invest</em>
        </Link>
        <span style={{ background: 'rgba(255,255,255,0.12)', color: '#A8D4DC', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', padding: '5px 12px', borderRadius: 20 }}>
          RAPOR SAYA
        </span>
      </div>

      {/* Hero */}
      <div style={{ background: '#0F4C5C', padding: '48px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 40, background: '#FDF8F0', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        <p style={{ display: 'inline-block', background: 'rgba(232,155,60,0.2)', color: '#E89B3C', border: '1px solid rgba(232,155,60,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 20, marginBottom: 20 }}>
          Evaluasi Perkembangan
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 5vw, 44px)', color: '#FDF8F0', margin: '0 0 12px', lineHeight: 1.12 }}>
          Rapor Saya 📋
        </h1>
        <p style={{ color: 'rgba(212,233,237,0.8)', fontSize: 15, maxWidth: '54ch', margin: '0 auto' }}>
          {profile ? `Halo, ${profile.full_name.split(' ')[0]}! ` : ''}
          Ini adalah penilaian cara berpikirmu dalam 4 dimensi analisa saham.
        </p>
      </div>

      {/* Konten utama */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Rapor belum ada — tampilkan trigger */}
        {!rapor && (
          <div style={{ background: 'white', border: '1px solid #E2D9C8', borderRadius: 14, padding: '32px', textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#1A2832', marginBottom: 12 }}>
              Rapor belum dibuat
            </h2>
            <p style={{ fontSize: 15, color: '#3D4D58', lineHeight: 1.7, marginBottom: 24, maxWidth: '44ch', margin: '0 auto 24px' }}>
              {aksesExpired
                ? 'Masa aksesmu sudah berakhir. Klik di bawah untuk melihat rapor perkembanganmu.'
                : 'Kamu bisa lihat rapor kapan saja selama masa akses aktif.'}
            </p>
            <button
              onClick={handleGenerateRapor}
              disabled={generating}
              style={{
                background:    generating ? '#7A8D97' : '#0F4C5C',
                color:         '#FDF8F0',
                border:        'none',
                padding:       '16px 36px',
                borderRadius:  14,
                fontWeight:    700,
                fontSize:      15,
                cursor:        generating ? 'not-allowed' : 'pointer',
                fontFamily:    'DM Sans, sans-serif',
              }}
            >
              {generating ? '⏳ Sedang dinilai Pak Andung...' : '📋 Lihat Rapor Saya'}
            </button>
            {generating && (
              <p style={{ fontSize: 13, color: '#7A8D97', marginTop: 12 }}>
                Pak Andung sedang membaca seluruh percakapanmu. Ini butuh 15–30 detik.
              </p>
            )}
            {error && (
              <p style={{ fontSize: 13, color: '#C0392B', marginTop: 12 }}>
                ❌ {error}
              </p>
            )}
          </div>
        )}

        {/* Rapor sudah ada — tampilkan */}
        {rapor && rapor.dimensi && (
          <>
            {/* Ringkasan umum */}
            <div style={{ background: '#D4E9ED', border: '1px solid #B0D4DC', borderRadius: 14, padding: '22px 26px', marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#0F4C5C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                📝 Catatan dari Pak Andung
              </p>
              <p style={{ fontSize: 15, color: '#1A2832', lineHeight: 1.7, margin: 0 }}>
                {rapor.ringkasan_umum}
              </p>
            </div>

            {/* Grafik batang */}
            <GrafikBatang dimensi={rapor.dimensi} />

            {/* 4 Kartu dimensi */}
            {rapor.dimensi.map(d => (
              <KartuDimensi key={d.id} d={d} />
            ))}

            {/* Metadata */}
            <div style={{ background: '#F5EDD8', border: '1px solid #E2D9C8', borderRadius: 12, padding: '16px 20px', marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, color: '#7A8D97', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Total percakapan</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A2832', margin: 0 }}>{rapor.jumlah_pesan} pesan</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#7A8D97', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Dinilai pada</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A2832', margin: 0 }}>
                  {new Date(rapor.generated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#7A8D97', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Rata-rata skor</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0F4C5C', margin: 0 }}>{rapor.skor_rata}/100</p>
              </div>
            </div>

            {/* Tombol regenerate */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={handleGenerateRapor}
                disabled={generating}
                style={{
                  background:   'transparent',
                  color:        '#7A8D97',
                  border:       '1px solid #E2D9C8',
                  padding:      '10px 24px',
                  borderRadius: 10,
                  fontSize:     13,
                  cursor:       generating ? 'not-allowed' : 'pointer',
                  fontFamily:   'DM Sans, sans-serif',
                }}
              >
                {generating ? '⏳ Memperbarui...' : '🔄 Perbarui Rapor'}
              </button>
              <p style={{ fontSize: 12, color: '#7A8D97', marginTop: 8 }}>
                Rapor diperbarui dengan percakapan terbaru
              </p>
            </div>

            {/* CTA upgrade jika trial berakhir */}
            {aksesExpired && (
              <div style={{ background: '#FDF0DC', border: '2px solid #E89B3C', borderRadius: 14, padding: '24px', textAlign: 'center', marginTop: 32 }}>
                <p style={{ fontSize: 20, margin: '0 0 8px' }}>🚀</p>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#1A2832', marginBottom: 8 }}>
                  Lanjut 30 hari penuh?
                </h3>
                <p style={{ fontSize: 14, color: '#7A4A0A', lineHeight: 1.7, marginBottom: 20 }}>
                  Kamu baru mulai. 30 hari memberikan waktu untuk memperdalam keempat dimensi ini dengan saham pilihanmu.
                </p>
                <a
                  href="https://mulaiinvest.id"
                  style={{ display: 'inline-block', background: '#E89B3C', color: 'white', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15 }}
                >
                  Upgrade ke 30 Hari →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
