// lib/levels.ts
// ═══════════════════════════════════════════════════════════════
// PETA LEVEL & CHECKPOINT (minimal, Fase 1)
//
// Ini dipakai backend untuk MENGHITUNG level secara JUJUR di server
// (bukan sekadar percaya "level_changed" dari model) — anti-inflasi.
//
// Isi modul & penjelasan kurikulum lengkap menyusul di Fase 2
// (lib/curriculum.ts). Di sini cukup: label, fokus, dan 3 checkpoint
// per level — itu yang menentukan kapan boleh naik level.
// ═══════════════════════════════════════════════════════════════

export interface LevelDef {
  level: number          // 1..4
  label: string          // Pemula | Menengah | Lanjutan | Mahir
  module: string         // nama modul (dari PDF v7)
  focus: string          // fokus singkat, ditampilkan di rail
  checkpoints: string[]  // ID checkpoint; semua harus lulus untuk naik level
}

export const LEVELS: LevelDef[] = [
  {
    level: 1,
    label: 'Pemula',
    module: 'Mindset',
    focus: 'saham = memiliki bisnis, bukan judi',
    checkpoints: ['L1_C1', 'L1_C2', 'L1_C3'],
  },
  {
    level: 2,
    label: 'Menengah',
    module: 'Toolkit',
    focus: 'baca laporan keuangan & nilai wajar',
    checkpoints: ['L2_C1', 'L2_C2', 'L2_C3'],
  },
  {
    level: 3,
    label: 'Lanjutan',
    module: 'Moat & Thesis',
    focus: 'moat, DCF, investment thesis & risiko',
    checkpoints: ['L3_C1', 'L3_C2', 'L3_C3'],
  },
  {
    level: 4,
    label: 'Mahir',
    module: 'Behavior',
    focus: 'investor mandiri, konsisten, kritik-diri',
    checkpoints: ['L4_C1', 'L4_C2', 'L4_C3'],
  },
]

export const MAX_LEVEL = LEVELS.length

// Semua ID checkpoint yang valid (untuk validasi input dari model)
export const ALL_CHECKPOINT_IDS: string[] = LEVELS.flatMap(l => l.checkpoints)

export function isValidCheckpoint(id: string | null | undefined): boolean {
  return !!id && ALL_CHECKPOINT_IDS.includes(id)
}

export function levelDef(level: number): LevelDef {
  return LEVELS.find(l => l.level === level) ?? LEVELS[0]
}

// Hitung level dari daftar checkpoint yang sudah lulus.
// Aturan: mulai dari level 1; selama SEMUA checkpoint level saat ini ada
// di completed, naik ke level berikutnya (sampai maksimum).
export function computeLevel(completed: string[]): LevelDef {
  const done = new Set(completed)
  let current = LEVELS[0]
  for (const def of LEVELS) {
    const allDone = def.checkpoints.every(c => done.has(c))
    if (allDone && def.level < MAX_LEVEL) {
      current = levelDef(def.level + 1)
    } else if (allDone && def.level === MAX_LEVEL) {
      current = def
    } else {
      // level ini belum selesai → berhenti di sini
      current = def
      break
    }
  }
  return current
}
