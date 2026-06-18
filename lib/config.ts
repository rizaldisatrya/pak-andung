// lib/config.ts
// ═══════════════════════════════════════════════════════════════
// KONFIGURASI GLOBAL — ubah angka di sini untuk adjust perilaku app
// ═══════════════════════════════════════════════════════════════

// Batas pesan sebelum Pak Andung menyarankan istirahat (soft cap)
// Ini dibaca dari env variable; default 180 jika tidak di-set
export const SOFT_CAP_MESSAGES = parseInt(
  process.env.SOFT_CAP_MESSAGES || '180', 10
)

// Durasi akses default dalam hari untuk produk berbayar
export const DEFAULT_ACCESS_DAYS = 30

// Durasi akses trial dalam hari
export const TRIAL_ACCESS_DAYS = 7

// Kata kunci untuk mendeteksi produk trial (case-insensitive)
export const TRIAL_KEYWORDS = ['trial', 'coba', 'gratis']

export function isTrialProduct(productName?: string | null): boolean {
  return TRIAL_KEYWORDS.some(kw => (productName || '').toLowerCase().includes(kw))
}

// Bab materi yang boleh dibaca produk Trial (teaser) — bab di atasnya jadi
// kartu "upgrade". Produk 30 hari (non-trial) tidak terkena batas ini.
export const TRIAL_MATERI_CHAPTER_CAP = 2

// Tanggal batas ini mulai berlaku. Profil yang dibuat SEBELUM tanggal ini
// di-grandfather (tidak kena batas) supaya tidak ada akses yang tiba-tiba
// dicabut dari pelanggan yang sudah sempat baca lebih jauh.
export const MATERI_CAP_LAUNCH_AT = '2026-06-18T00:00:00Z'
