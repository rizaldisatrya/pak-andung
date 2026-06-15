'use client'
// components/ProgressRail.tsx
// Strip progress yang selalu terlihat di atas chat:
//   - Pill level (mis. "Menengah · 2/4") + fokus
//   - 4 bar tipis: Bisnis / Finansial / Valuasi / Risiko (0..100), beranimasi saat delta
//   - Counter XP
// Mobile (~380px): rapi & bisa diciutkan jadi satu strip yang bisa diketuk.

import { useState } from 'react'

export interface RailScores {
  bisnis: number
  finansial: number
  valuasi: number
  risiko: number
}

interface Props {
  level: number
  levelLabel: string
  focus: string
  xp: number
  scores: RailScores
  maxLevel?: number
}

const NAVY = '#090f5b'
const GREEN = '#6ee043'
const CREAM = '#FDF8F0'

const BARS: { key: keyof RailScores; label: string; short: string }[] = [
  { key: 'bisnis', label: 'Bisnis', short: 'B' },
  { key: 'finansial', label: 'Finansial', short: 'F' },
  { key: 'valuasi', label: 'Valuasi', short: 'V' },
  { key: 'risiko', label: 'Risiko', short: 'R' },
]

function Bar({ label, short, value }: { label: string; short: string; value: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] font-semibold w-14 shrink-0 hidden sm:inline"
        style={{ color: 'rgba(9,15,91,0.7)' }}
      >
        {label}
      </span>
      <span
        className="text-[10px] font-bold w-3 shrink-0 sm:hidden text-center"
        style={{ color: 'rgba(9,15,91,0.7)' }}
        title={label}
      >
        {short}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(9,15,91,0.10)' }}
        role="progressbar"
        aria-label={label}
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${v}%`, background: GREEN }}
        />
      </div>
      <span className="text-[10px] tabular-nums w-6 text-right shrink-0" style={{ color: 'rgba(9,15,91,0.55)' }}>
        {v}
      </span>
    </div>
  )
}

export default function ProgressRail({
  level, levelLabel, focus, xp, scores, maxLevel = 4,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ background: CREAM, borderBottom: '1px solid #E2D9C8' }}>
      {/* ── Baris ringkas (selalu terlihat, bisa diketuk) ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left"
        aria-expanded={open}
      >
        {/* Level pill */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shrink-0"
          style={{ background: NAVY }}
        >
          🎓 {levelLabel} · {level}/{maxLevel}
        </span>

        {/* Fokus (potong di layar kecil) */}
        <span className="text-[11px] truncate flex-1 min-w-0" style={{ color: 'rgba(9,15,91,0.65)' }}>
          fokus: {focus}
        </span>

        {/* XP */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0"
          style={{ background: 'rgba(110,224,67,0.18)', color: '#2f6f12' }}
        >
          ⚡ {xp} XP
        </span>

        {/* Chevron */}
        <span
          className="text-[10px] shrink-0 transition-transform duration-200"
          style={{ color: 'rgba(9,15,91,0.5)', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          ▼
        </span>
      </button>

      {/* ── Matrix 4 bar ──
          Di layar >= sm selalu tampil; di mobile tampil saat di-expand. */}
      <div className={`px-4 pb-2.5 space-y-1.5 ${open ? 'block' : 'hidden sm:block'}`}>
        {BARS.map(b => (
          <Bar key={b.key} label={b.label} short={b.short} value={scores[b.key]} />
        ))}
      </div>
    </div>
  )
}
