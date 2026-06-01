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
