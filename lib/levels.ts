// lib/levels.ts
// ═══════════════════════════════════════════════════════════════
// Sejak Fase 2, sumber kebenaran kurikulum pindah ke lib/curriculum.ts.
// File ini tinggal menyambungkan ulang (re-export) supaya kode lama yang
// mengimpor dari '@/lib/levels' tetap berfungsi tanpa diubah.
// ═══════════════════════════════════════════════════════════════

export {
  CURRICULUM,
  MAX_LEVEL,
  ALL_CHECKPOINT_IDS,
  isValidCheckpoint,
  levelDef,
  checkpointById,
  computeLevel,
  nextCheckpoint,
} from './curriculum'

export type { Checkpoint, ModuleDef, ActiveCheckpoint } from './curriculum'

// Alias kompatibilitas: dulu bernama LEVELS / LevelDef.
export { CURRICULUM as LEVELS } from './curriculum'
export type { ModuleDef as LevelDef } from './curriculum'
