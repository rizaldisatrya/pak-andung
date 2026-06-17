'use client'
// components/CitationChips.tsx
// Chip kecil "Kata buku 📖" di bawah balasan. Diklik → buka sumbernya.
// Sumber berasal dari citations[] pada JSON sidecar (Fase 1).

import { useState } from 'react'

export interface Citation {
  label: string
  source: string
}

interface Props {
  citations: Citation[]
}

function Chip({ c }: { c: Citation }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="text-left rounded-lg px-2 py-1 text-[11px] transition-all"
      style={{
        background: 'rgba(9,15,91,0.06)',
        border: '1px solid rgba(9,15,91,0.15)',
        color: '#090f5b',
        maxWidth: '100%',
      }}
      aria-expanded={open}
      title={c.source}
    >
      <span className="font-semibold">📖 {c.label}</span>
      {open && (
        <span className="block mt-0.5 font-normal" style={{ color: 'rgba(9,15,91,0.7)' }}>
          {c.source}
        </span>
      )}
    </button>
  )
}

export default function CitationChips({ citations }: Props) {
  if (!citations || citations.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {citations.map((c, i) => (
        <Chip key={`${c.label}-${i}`} c={c} />
      ))}
      <a
        href="/materi"
        className="rounded-lg px-2 py-1 text-[11px] font-semibold transition-all"
        style={{ background: '#0F4C5C', color: '#FDF8F0', textDecoration: 'none' }}
        title="Baca materi lengkap di buku"
      >
        📖 Buka di buku →
      </a>
    </div>
  )
}
