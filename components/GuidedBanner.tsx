'use client'
// components/GuidedBanner.tsx
// Banner Belajar Terpandu: tampilkan modul + checkpoint aktif sekarang,
// dengan tombol "Lanjut belajar ->" untuk mengarahkan Pak Andung ke
// checkpoint itu. Mode bebas & terpandu berbagi matrix/XP yang sama.

import type { ActiveCheckpoint } from '@/lib/curriculum'

interface Props {
  active: ActiveCheckpoint | null
  loading: boolean
  onContinue: () => void
}

const NAVY = '#090f5b'
const GREEN = '#6ee043'

export default function GuidedBanner({ active, loading, onContinue }: Props) {
  // Semua checkpoint selesai
  if (!active) {
    return (
      <div
        className="px-4 py-2 text-[11px] flex items-center gap-2"
        style={{ background: 'rgba(110,224,67,0.10)', borderBottom: '1px solid #E2D9C8', color: '#2f6f12' }}
      >
        🎉 Semua checkpoint selesai — kamu sudah jadi investor mandiri! Lanjut diskusi bebas ya.
      </div>
    )
  }

  return (
    <div
      className="px-4 py-2 flex items-center gap-2"
      style={{ background: '#FFFFFF', borderBottom: '1px solid #E2D9C8' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(9,15,91,0.5)' }}>
          Belajar Terpandu · {active.module}
        </p>
        <p className="text-[12px] font-medium truncate" style={{ color: NAVY }}>
          🎯 {active.title}
        </p>
      </div>
      <button
        onClick={onContinue}
        disabled={loading}
        className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-40"
        style={{ background: NAVY, color: '#FFFFFF' }}
      >
        Lanjut belajar →
      </button>
    </div>
  )
}
