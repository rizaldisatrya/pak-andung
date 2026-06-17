// lib/materi-map.ts
// ─────────────────────────────────────────────────────────────
// Metadata RINGAN untuk reader materi (aman diimpor client — TIDAK
// memuat isi buku 418KB; itu hanya dibaca server di /api/materi).
//
//   - CHAPTERS: daftar 8 bab + level + anchor + judul (untuk nav reader).
//   - CHECKPOINT_ANCHOR: peta checkpoint -> anchor bab relevan.
//   - levelDefaultAnchor(): bab pertama sebuah level (tombol "Baca Materi").
//   - unlockedLevel(): level tertinggi yang boleh dibaca (unlock saat
//     MENCAPAI level, sejalan dengan kurikulum).
// ─────────────────────────────────────────────────────────────
import { computeLevel } from './curriculum'

export interface ChapterMeta {
  chapter: number   // 1..8
  level: number     // 1..4 (bab 1-2=L1, 3-4=L2, 5-6=L3, 7-8=L4)
  anchor: string    // 'bab-N'
  title: string
}

export const LEVEL_LABEL: Record<number, string> = {
  1: 'Pemula',
  2: 'Menengah',
  3: 'Lanjutan',
  4: 'Mahir',
}

export const CHAPTERS: ChapterMeta[] = [
  { chapter: 1, level: 1, anchor: 'bab-1', title: 'Saham itu bukan judi, kalau caranya bener.' },
  { chapter: 2, level: 1, anchor: 'bab-2', title: 'Cara pikir investor — yang bikin Ramdhan berhenti rugi.' },
  { chapter: 3, level: 2, anchor: 'bab-3', title: '5 angka di laporan keuangan yang benar-benar penting.' },
  { chapter: 4, level: 2, anchor: 'bab-4', title: 'Murah atau mahal? Belajar valuasi tanpa pusing.' },
  { chapter: 5, level: 3, anchor: 'bab-5', title: 'Bisnis bagus vs bisnis murahan — mengukur kualitas.' },
  { chapter: 6, level: 3, anchor: 'bab-6', title: 'Investment thesis — senjata anti-panik.' },
  { chapter: 7, level: 4, anchor: 'bab-7', title: 'Diversifikasi & position sizing — cara membatasi kerusakan.' },
  { chapter: 8, level: 4, anchor: 'bab-8', title: '10 kesalahan pemula & protokol bertahan.' },
]

// Checkpoint -> bab yang paling relevan (untuk "Buka di buku →").
export const CHECKPOINT_ANCHOR: Record<string, string> = {
  L1_C1: 'bab-1', L1_C2: 'bab-1', L1_C3: 'bab-2',
  L2_C1: 'bab-3', L2_C2: 'bab-4', L2_C3: 'bab-4',
  L3_C1: 'bab-5', L3_C2: 'bab-6', L3_C3: 'bab-6',
  L4_C1: 'bab-7', L4_C2: 'bab-8', L4_C3: 'bab-8',
}

// Bab pertama sebuah level (sasaran default tombol "Baca Materi").
export function levelDefaultAnchor(level: number): string {
  const first = CHAPTERS.find(c => c.level === level)
  return first ? first.anchor : 'bab-1'
}

// Level tertinggi yang boleh dibaca. Unlock saat MENCAPAI level:
// pakai computeLevel(completed) (anti-inflasi), digabung dengan
// profile.level kalau ada, ambil yang tertinggi. Selalu >= 1.
export function unlockedLevel(completed: string[], profileLevel?: number | null): number {
  const fromCompleted = computeLevel(completed || []).level
  return Math.max(1, profileLevel ?? 1, fromCompleted)
}

export function isChapterUnlocked(chapterLevel: number, unlocked: number): boolean {
  return chapterLevel <= unlocked
}
