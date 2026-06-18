'use client'
// app/admin/cohort/page.tsx
// ═══════════════════════════════════════════════════════════════
// HALAMAN ADMIN — Kelola Sesi Cohort
// Hanya bisa diakses admin (email kamu)
// URL: app.mulaiinvest.id/admin/cohort
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── TYPES ─────────────────────────────────────────────────────
interface CohortSession {
  id?: string
  tanggal: string
  waktu_mulai: string
  speaker_nama: string
  speaker_jabatan: string
  topik: string
  harga: number
  total_slot: number
  slot_tersisa: number
  lynk_url: string
  link_meeting: string
  aktif: boolean
  created_at?: string
}

const EMPTY_SESSION: CohortSession = {
  tanggal: '',
  waktu_mulai: '10:00',
  speaker_nama: '',
  speaker_jabatan: '',
  topik: '',
  harga: 150000,
  total_slot: 30,
  slot_tersisa: 30,
  lynk_url: '',
  link_meeting: '',
  aktif: true,
}

// ── KOMPONEN FORM SESI ────────────────────────────────────────
function FormSesi({
  sesi, onSave, onCancel, saving
}: {
  sesi: CohortSession
  onSave: (s: CohortSession) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<CohortSession>(sesi)
  const set = (k: keyof CohortSession, v: string | number | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: '#F5EDD8', border: '1px solid #E2D9C8',
    borderRadius: 8, fontSize: 14, color: '#1A2832',
    fontFamily: 'DM Sans, sans-serif', outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700 as const,
    color: '#7A8D97', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: 6,
  }

  return (
    <div style={{
      background: 'white', border: '1px solid #E2D9C8',
      borderTop: '3px solid #0F4C5C', borderRadius: 14,
      padding: '28px', marginBottom: 24,
    }}>
      <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#1A2832', marginBottom: 24 }}>
        {sesi.id ? '✏️ Edit Sesi' : '➕ Tambah Sesi Baru'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Tanggal Sesi *</label>
          <input type="date" style={inputStyle} value={form.tanggal}
            onChange={e => set('tanggal', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Waktu Mulai *</label>
          <input type="time" style={inputStyle} value={form.waktu_mulai}
            onChange={e => set('waktu_mulai', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Nama Speaker *</label>
          <input type="text" style={inputStyle} placeholder="Misal: Budi Setiawan, CFA"
            value={form.speaker_nama} onChange={e => set('speaker_nama', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Jabatan / Latar Belakang</label>
          <input type="text" style={inputStyle} placeholder="Misal: Analis Senior BCA Sekuritas"
            value={form.speaker_jabatan} onChange={e => set('speaker_jabatan', e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Topik Sesi *</label>
        <input type="text" style={inputStyle}
          placeholder="Misal: Cara membaca laporan keuangan bank: NPL, NIM, dan BOPO dalam konteks"
          value={form.topik} onChange={e => set('topik', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Harga (Rp)</label>
          <input type="number" style={inputStyle} placeholder="150000"
            value={form.harga} onChange={e => set('harga', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label style={labelStyle}>Total Slot</label>
          <input type="number" style={inputStyle} placeholder="30"
            value={form.total_slot} onChange={e => set('total_slot', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label style={labelStyle}>Slot Tersisa</label>
          <input type="number" style={inputStyle}
            value={form.slot_tersisa} onChange={e => set('slot_tersisa', parseInt(e.target.value) || 0)} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>URL Lynk.id untuk Sesi Ini *</label>
        <input type="url" style={inputStyle}
          placeholder="https://lynk.id/mulaiinvest/cohort-saham-xyz"
          value={form.lynk_url} onChange={e => set('lynk_url', e.target.value)} />
        <p style={{ fontSize: 12, color: '#7A8D97', marginTop: 6 }}>
          Buat 1 produk baru di Lynk.id per sesi. Setelah bayar, webhook otomatis kirim link meeting ke email pembeli.
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Link Meeting (Zoom / Google Meet / Teams) *</label>
        <input type="url" style={inputStyle}
          placeholder="https://zoom.us/j/xxx atau https://meet.google.com/xxx"
          value={form.link_meeting} onChange={e => set('link_meeting', e.target.value)} />
        <p style={{ fontSize: 12, color: '#7A8D97', marginTop: 6 }}>
          Link ini dikirim otomatis ke email pembeli setelah bayar via Lynk. Tidak tampil di website.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <input type="checkbox" id="aktif-check" checked={form.aktif}
          onChange={e => set('aktif', e.target.checked)}
          style={{ width: 18, height: 18, cursor: 'pointer' }} />
        <label htmlFor="aktif-check" style={{ fontSize: 14, color: '#3D4D58', cursor: 'pointer' }}>
          Tampilkan di website (aktif)
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => onSave(form)} disabled={saving} style={{
          background: saving ? '#7A8D97' : '#0F4C5C', color: '#FDF8F0',
          border: 'none', padding: '12px 28px', borderRadius: 10,
          fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {saving ? '⏳ Menyimpan...' : '💾 Simpan Sesi'}
        </button>
        <button onClick={onCancel} style={{
          background: 'transparent', color: '#7A8D97',
          border: '1px solid #E2D9C8', padding: '12px 24px',
          borderRadius: 10, fontSize: 14, cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Batal
        </button>
      </div>
    </div>
  )
}

// ── HALAMAN UTAMA ADMIN ───────────────────────────────────────
export default function AdminCohortPage() {
  const supabase = createClient()
  const [sessions, setSessions]       = useState<CohortSession[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [editSesi, setEditSesi]       = useState<CohortSession | null>(null)
  const [saving, setSaving]           = useState(false)
  const [message, setMessage]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [authorized, setAuthorized]   = useState<boolean | null>(null)

  // ─ Cek apakah admin ─
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'rizaldisatryaherlambang@gmail.com'
      setAuthorized(data.user?.email === adminEmail)
    })
  }, [supabase])

  // ─ Fetch semua sesi ─
  async function fetchSessions() {
    setLoading(true)
    const { data } = await supabase
      .from('cohort_sessions')
      .select('*')
      .order('tanggal', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }

  useEffect(() => { if (authorized) fetchSessions() }, [authorized])

  // ─ Simpan sesi (create/update) ─
  async function handleSave(form: CohortSession) {
    setSaving(true)
    setMessage(null)
    try {
      if (form.id) {
        const { error } = await supabase
          .from('cohort_sessions')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', form.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cohort_sessions')
          .insert({ ...form })
        if (error) throw error
      }
      setMessage({ type: 'ok', text: '✅ Sesi berhasil disimpan!' })
      setShowForm(false)
      setEditSesi(null)
      fetchSessions()
    } catch (e) {
      setMessage({ type: 'err', text: `❌ Gagal: ${String(e)}` })
    } finally {
      setSaving(false)
    }
  }

  // ─ Hapus sesi ─
  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin hapus sesi ini?')) return
    const { error } = await supabase.from('cohort_sessions').delete().eq('id', id)
    if (error) { setMessage({ type: 'err', text: `❌ Gagal hapus: ${error.message}` }); return }
    setMessage({ type: 'ok', text: '✅ Sesi dihapus.' })
    fetchSessions()
  }

  // ─ Toggle aktif ─
  async function handleToggleAktif(sesi: CohortSession) {
    await supabase
      .from('cohort_sessions')
      .update({ aktif: !sesi.aktif })
      .eq('id', sesi.id!)
    fetchSessions()
  }

  // ─ Guard: not authorized ─
  if (authorized === false) return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#C0392B', fontFamily: 'DM Sans, sans-serif' }}>❌ Akses ditolak. Halaman ini hanya untuk admin.</p>
    </div>
  )

  if (authorized === null || loading) return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#7A8D97', fontFamily: 'DM Sans, sans-serif' }}>Memuat...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0F4C5C', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#FDF8F0' }}>
          Mulai<em style={{ color: '#E89B3C' }}>Invest</em> · Admin
        </span>
        <span style={{ background: 'rgba(255,255,255,0.12)', color: '#A8D4DC', fontSize: 11, fontWeight: 500, padding: '5px 12px', borderRadius: 20 }}>
          KELOLA COHORT
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Pesan sukses/error */}
        {message && (
          <div style={{
            background: message.type === 'ok' ? '#DCF0E5' : '#FDECEA',
            border: `1px solid ${message.type === 'ok' ? '#B2DEC5' : '#F5C5C0'}`,
            color: message.type === 'ok' ? '#1A5236' : '#7A1F1A',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14,
          }}>
            {message.text}
          </div>
        )}

        {/* Header + Tombol Tambah */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, color: '#1A2832', margin: '0 0 4px' }}>
              Kelola Sesi Cohort
            </h1>
            <p style={{ fontSize: 14, color: '#7A8D97', margin: 0 }}>
              {sessions.length} sesi terdaftar · {sessions.filter(s => s.aktif).length} aktif di website
            </p>
          </div>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditSesi(null) }} style={{
              background: '#0F4C5C', color: '#FDF8F0',
              border: 'none', padding: '12px 24px', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              ➕ Tambah Sesi
            </button>
          )}
        </div>

        {/* Form tambah/edit */}
        {(showForm || editSesi) && (
          <FormSesi
            sesi={editSesi || EMPTY_SESSION}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditSesi(null) }}
            saving={saving}
          />
        )}

        {/* List Sesi */}
        {sessions.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #E2D9C8', borderRadius: 14, padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📅</p>
            <p style={{ color: '#7A8D97', fontSize: 15 }}>Belum ada sesi. Klik "Tambah Sesi" untuk mulai.</p>
          </div>
        ) : (
          sessions.map(sesi => (
            <div key={sesi.id} style={{
              background: 'white',
              border: `1px solid ${sesi.aktif ? '#E2D9C8' : '#F0E8D8'}`,
              borderLeft: `4px solid ${sesi.aktif ? '#0F4C5C' : '#E2D9C8'}`,
              borderRadius: 12, padding: '20px 24px',
              marginBottom: 12,
              opacity: sesi.aktif ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      background: sesi.aktif ? '#D4E9ED' : '#F5EDD8',
                      color: sesi.aktif ? '#0F4C5C' : '#7A8D97',
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    }}>
                      {sesi.aktif ? '✅ Aktif' : '⏸ Tersembunyi'}
                    </span>
                    <span style={{ fontSize: 13, color: '#7A8D97' }}>
                      {new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {sesi.waktu_mulai}
                    </span>
                  </div>

                  <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#1A2832', margin: '0 0 4px' }}>
                    {sesi.speaker_nama}
                    {sesi.speaker_jabatan && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#7A8D97', fontWeight: 400 }}> · {sesi.speaker_jabatan}</span>}
                  </p>
                  <p style={{ fontSize: 14, color: '#3D4D58', margin: '0 0 8px' }}>{sesi.topik}</p>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#0F4C5C', fontWeight: 600 }}>
                      Rp {sesi.harga.toLocaleString('id-ID')}
                    </span>
                    <span style={{ fontSize: 13, color: '#7A8D97' }}>
                      {sesi.slot_tersisa}/{sesi.total_slot} slot tersisa
                    </span>
                    <span style={{ fontSize: 13, color: sesi.link_meeting ? '#2E7D52' : '#C0392B' }}>
                      {sesi.link_meeting ? '✅ Link meeting tersimpan' : '⚠️ Link meeting belum diisi'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleToggleAktif(sesi)} style={{
                    background: 'transparent', border: '1px solid #E2D9C8',
                    color: '#7A8D97', padding: '8px 14px', borderRadius: 8,
                    fontSize: 12, cursor: 'pointer',
                  }}>
                    {sesi.aktif ? '⏸ Sembunyikan' : '✅ Aktifkan'}
                  </button>
                  <button onClick={() => { setEditSesi(sesi); setShowForm(false) }} style={{
                    background: '#F5EDD8', border: '1px solid #E2D9C8',
                    color: '#1A2832', padding: '8px 14px', borderRadius: 8,
                    fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(sesi.id!)} style={{
                    background: '#FDECEA', border: '1px solid #F5C5C0',
                    color: '#C0392B', padding: '8px 14px', borderRadius: 8,
                    fontSize: 12, cursor: 'pointer',
                  }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Info box */}
        <div style={{ background: '#D4E9ED', border: '1px solid #B0D4DC', borderRadius: 12, padding: '16px 20px', marginTop: 32 }}>
          <p style={{ fontSize: 13, color: '#0F4C5C', lineHeight: 1.65, margin: 0, fontWeight: 600 }}>
            💡 Cara kerja alur pembayaran:
          </p>
          <ol style={{ fontSize: 13, color: '#1A2832', lineHeight: 1.8, margin: '8px 0 0 16px', paddingLeft: 0 }}>
            <li>Peserta klik tombol sesi di mulaiinvest.id → diarahkan ke Lynk.id (URL yang kamu isi)</li>
            <li>Peserta bayar di Lynk.id</li>
            <li>Webhook otomatis terdeteksi → email dikirim ke peserta berisi <strong>link meeting</strong></li>
            <li>Peserta masuk sesi sesuai jadwal</li>
          </ol>
          <p style={{ fontSize: 12, color: '#2D6E7E', margin: '10px 0 0', fontStyle: 'italic' }}>
            ⚠️ Pastikan <strong>setiap sesi punya produk Lynk.id sendiri</strong> dan <strong>link meeting sudah terisi</strong> sebelum diaktifkan.
          </p>
        </div>

      </div>
    </div>
  )
}
