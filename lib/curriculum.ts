// lib/curriculum.ts
// ═══════════════════════════════════════════════════════════════
// KURIKULUM PAK ANDUNG v2 (Fase 2) — SUMBER KEBENARAN
//
// 4 level -> modul -> 3 checkpoint, di-seed dari PDF v7
// (Mindset / Toolkit / Moat & Thesis / Behavior).
// Checkpoint = gerbang objektif untuk naik level.
//
// File ini dipakai backend (hitung level, checkpoint aktif) DAN frontend
// (Peta Belajar, banner Belajar Terpandu). Murni data + fungsi, tanpa
// dependensi server — aman diimpor dari komponen client.
// ═══════════════════════════════════════════════════════════════

export interface Checkpoint {
  id: string          // mis. 'L1_C1'
  title: string       // judul singkat (untuk Peta Belajar / banner)
  description: string  // apa yang harus DITUNJUKKAN murid
}

export interface ModuleDef {
  level: number          // 1..4
  label: string          // Pemula | Menengah | Lanjutan | Mahir
  module: string         // nama modul (PDF v7)
  focus: string          // fokus singkat
  primaryMatrix: string  // dimensi matrix utama level ini
  checkpoints: Checkpoint[]
}

export const CURRICULUM: ModuleDef[] = [
  {
    level: 1,
    label: 'Pemula',
    module: 'Mindset',
    focus: 'saham = memiliki bisnis, bukan judi',
    primaryMatrix: 'Bisnis',
    checkpoints: [
      { id: 'L1_C1', title: 'Bisnis cari uang dari mana', description: 'Jelaskan dengan kata sendiri sebuah bisnis (mis. BBCA) menghasilkan uang dari mana.' },
      { id: 'L1_C2', title: 'Investasi vs spekulasi', description: 'Bedakan investasi vs spekulasi/judi dengan benar.' },
      { id: 'L1_C3', title: 'Kenali jebakan mental', description: 'Sebutkan satu jebakan mental yang rentan kamu alami + kenapa.' },
    ],
  },
  {
    level: 2,
    label: 'Menengah',
    module: 'Toolkit',
    focus: 'baca laporan keuangan & nilai wajar',
    primaryMatrix: 'Finansial',
    checkpoints: [
      { id: 'L2_C1', title: 'Baca 3 laporan keuangan', description: 'Tunjukkan kamu bisa membaca 3 laporan utama (laba rugi, neraca, arus kas) tingkat dasar.' },
      { id: 'L2_C2', title: 'Hitung PER/PBV/ROE', description: 'Hitung & tafsirkan PER/PBV/ROE untuk satu emiten LQ45.' },
      { id: 'L2_C3', title: 'Margin of safety', description: 'Jelaskan margin of safety dengan kata sendiri + kenapa penting.' },
    ],
  },
  {
    level: 3,
    label: 'Lanjutan',
    module: 'Moat & Thesis',
    focus: 'moat, DCF, investment thesis & risiko',
    primaryMatrix: 'Valuasi',
    checkpoints: [
      { id: 'L3_C1', title: 'Identifikasi moat', description: 'Identifikasi jenis moat sebuah emiten + bukti dari laporan keuangan.' },
      { id: 'L3_C2', title: 'Investment thesis 5 paragraf', description: 'Susun investment thesis 5 paragraf yang lengkap.' },
      { id: 'L3_C3', title: 'Kondisi thesis pecah', description: 'Sebutkan kondisi "thesis pecah" (apa yang membuktikan kamu salah).' },
    ],
  },
  {
    level: 4,
    label: 'Mahir',
    module: 'Behavior',
    focus: 'investor mandiri, konsisten, kritik-diri',
    primaryMatrix: 'Risiko',
    checkpoints: [
      { id: 'L4_C1', title: 'Position sizing & diversifikasi', description: 'Rancang position sizing & diversifikasi sehat (aturan 5-10 saham).' },
      { id: 'L4_C2', title: '3 protokol bertahan', description: 'Tuliskan 3 protokol bertahan (crash, FOMO, postmortem).' },
      { id: 'L4_C3', title: 'Kritik keputusan sendiri', description: 'Kritik satu keputusan investasimu yang lalu secara objektif.' },
    ],
  },
]

export const MAX_LEVEL = CURRICULUM.length

// ── Helper umum ───────────────────────────────────────────────
export const ALL_CHECKPOINT_IDS: string[] =
  CURRICULUM.flatMap(m => m.checkpoints.map(c => c.id))

export function isValidCheckpoint(id: string | null | undefined): boolean {
  return !!id && ALL_CHECKPOINT_IDS.includes(id)
}

export function levelDef(level: number): ModuleDef {
  return CURRICULUM.find(m => m.level === level) ?? CURRICULUM[0]
}

export function checkpointById(id: string): { cp: Checkpoint; module: ModuleDef } | null {
  for (const m of CURRICULUM) {
    const cp = m.checkpoints.find(c => c.id === id)
    if (cp) return { cp, module: m }
  }
  return null
}

// Hitung level dari daftar checkpoint yang sudah lulus (anti-inflasi).
// Mulai dari level 1; selama SEMUA checkpoint level saat ini ada di completed,
// naik ke level berikutnya (sampai maksimum).
export function computeLevel(completed: string[]): ModuleDef {
  const done = new Set(completed)
  let current = CURRICULUM[0]
  for (const m of CURRICULUM) {
    const allDone = m.checkpoints.every(c => done.has(c.id))
    if (allDone && m.level < MAX_LEVEL) {
      current = levelDef(m.level + 1)
    } else if (allDone && m.level === MAX_LEVEL) {
      current = m
    } else {
      current = m
      break
    }
  }
  return current
}

export interface ActiveCheckpoint {
  id: string
  title: string
  description: string
  module: string
  level: number
  label: string
}

// Checkpoint berikutnya yang BELUM lulus (urut level lalu urut checkpoint).
// Dipakai untuk banner Belajar Terpandu. null jika semua sudah lulus.
export function nextCheckpoint(completed: string[]): ActiveCheckpoint | null {
  const done = new Set(completed)
  for (const m of CURRICULUM) {
    for (const cp of m.checkpoints) {
      if (!done.has(cp.id)) {
        return {
          id: cp.id,
          title: cp.title,
          description: cp.description,
          module: m.module,
          level: m.level,
          label: m.label,
        }
      }
    }
  }
  return null
}
