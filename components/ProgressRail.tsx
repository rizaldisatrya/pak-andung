'use client'
// components/ProgressRail.tsx
// Strip progress yang selalu terlihat di atas chat:
//   - Pill level (mis. "Menengah · 2/4") + fokus
//   - 4 bar tipis: Bisnis / Finansial / Valuasi / Risiko (0..100), beranimasi saat delta
//   - Counter XP + kilatan "+N XP" saat XP naik (poles XP)
//   - Ketuk untuk buka "Peta Belajar": 4 level + checkpoint (selesai/sekarang/terkunci)
// Mobile (~380px): rapi & bisa diciutkan jadi satu strip yang bisa diketuk.

import { useEffect, useRef, useState } from 'react'
import { CURRICULUM, nextCheckpoint } from '@/lib/curriculum'
import { unlockedLevel, levelDefaultAnchor } from '@/lib/materi-map'

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
  completed: string[]
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
      <span className="text-[10px] font-semibold w-14 shrink-0 hidden sm:inline" style={{ color: 'rgba(9,15,91,0.7)' }}>
        {label}
      </span>
      <span className="text-[10px] font-bold w-3 shrink-0 sm:hidden text-center" style={{ color: 'rgba(9,15,91,0.7)' }} title={label}>
        {short}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(9,15,91,0.10)' }}
        role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}
      >
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${v}%`, background: GREEN }} />
      </div>
      <span className="text-[10px] tabular-nums w-6 text-right shrink-0" style={{ color: 'rgba(9,15,91,0.55)' }}>{v}</span>
    </div>
  )
}

// Peta Belajar: daftar 4 level + status checkpoint
function PetaBelajar({ completed }: { completed: string[] }) {
  const done = new Set(completed)
  const active = nextCheckpoint(completed)
  const lvl = unlockedLevel(completed)
  const materiHref = `/materi?to=${levelDefaultAnchor(lvl)}`
  return (
    <div className="mt-2 pt-2 space-y-2" style={{ borderTop: '1px dashed #E2D9C8' }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(9,15,91,0.5)' }}>
          Peta Belajar
        </p>
        <a
          href={materiHref}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0"
          style={{ background: '#0F4C5C', color: '#FDF8F0', textDecoration: 'none' }}
        >
          📖 Baca Materi
        </a>
      </div>
      {CURRICULUM.map(m => {
        const doneCount = m.checkpoints.filter(c => done.has(c.id)).length
        return (
          <div key={m.level}>
            <p className="text-[11px] font-semibold" style={{ color: NAVY }}>
              L{m.level} {m.label}
              <span className="font-normal" style={{ color: 'rgba(9,15,91,0.5)' }}> · {doneCount}/{m.checkpoints.length} · {m.module}</span>
            </p>
            <ul className="mt-0.5 space-y-0.5">
              {m.checkpoints.map(c => {
                const isDone = done.has(c.id)
                const isNow = active?.id === c.id
                const icon = isDone ? '✅' : isNow ? '🟢' : '🔒'
                const color = isDone ? '#2f6f12' : isNow ? NAVY : 'rgba(9,15,91,0.4)'
                return (
                  <li key={c.id} className="text-[11px] flex items-start gap-1.5" style={{ color }}>
                    <span className="shrink-0">{icon}</span>
                    <span className={isNow ? 'font-semibold' : ''}>{c.title}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default function ProgressRail({
  level, levelLabel, focus, xp, scores, completed, maxLevel = 4,
}: Props) {
  const [open, setOpen] = useState(false)

  // Poles XP: tampilkan kilatan "+N XP" saat XP bertambah
  const prevXp = useRef(xp)
  const [xpDelta, setXpDelta] = useState(0)
  useEffect(() => {
    const diff = xp - prevXp.current
    prevXp.current = xp
    if (diff > 0) {
      setXpDelta(diff)
      const t = setTimeout(() => setXpDelta(0), 1600)
      return () => clearTimeout(t)
    }
  }, [xp])

  return (
    <div style={{ background: CREAM, borderBottom: '1px solid #E2D9C8' }}>
      {/* ── Baris ringkas (selalu terlihat, bisa diketuk) ── */}
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-4 py-2 text-left" aria-expanded={open}>
        {/* Level pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shrink-0" style={{ background: NAVY }}>
          🎓 {levelLabel} · {level}/{maxLevel}
        </span>

        {/* Fokus */}
        <span className="text-[11px] truncate flex-1 min-w-0" style={{ color: 'rgba(9,15,91,0.65)' }}>
          fokus: {focus}
        </span>

        {/* XP + kilatan delta */}
        <span className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0" style={{ background: 'rgba(110,224,67,0.18)', color: '#2f6f12' }}>
          ⚡ {xp} XP
          {xpDelta > 0 && (
            <span className="absolute -top-3 right-0 text-[10px] font-bold xp-pop" style={{ color: '#2f6f12' }}>
              +{xpDelta}
            </span>
          )}
        </span>

        {/* Chevron */}
        <span className="text-[10px] shrink-0 transition-transform duration-200" style={{ color: 'rgba(9,15,91,0.5)', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {/* ── Matrix 4 bar (selalu di >= sm; di mobile saat di-expand) ── */}
      <div className={`px-4 pb-2.5 space-y-1.5 ${open ? 'block' : 'hidden sm:block'}`}>
        {BARS.map(b => (<Bar key={b.key} label={b.label} short={b.short} value={scores[b.key]} />))}

        {/* Peta Belajar hanya saat di-expand */}
        {open && <PetaBelajar completed={completed} />}
      </div>

      <style jsx>{`
        @keyframes xpPop {
          0% { opacity: 0; transform: translateY(4px); }
          30% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        .xp-pop { animation: xpPop 1.6s ease-out forwards; }
      `}</style>
    </div>
  )
}
