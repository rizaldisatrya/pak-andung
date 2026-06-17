'use client'
// components/MateriReader.tsx
// Reader materi: baris navigasi bab (chip) + iframe yang memuat /api/materi.
// iframe mengisolasi CSS buku; ganti bab => src berubah => auto-scroll ke anchor.
// Bab terkunci: chip non-aktif (🔒). Baca-saja (tanpa unduh/print).

import { useState } from 'react'
import { CHAPTERS, LEVEL_LABEL, isChapterUnlocked } from '@/lib/materi-map'

const TEAL = '#0F4C5C'
const CREAM = '#FDF8F0'

export default function MateriReader({
  unlocked,
  initialTo,
}: {
  unlocked: number
  initialTo: string
}) {
  const [to, setTo] = useState(initialTo || '')
  const src = `/api/materi${to ? `?to=${encodeURIComponent(to)}` : ''}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Baris navigasi bab */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '8px 12px',
          background: CREAM,
          borderBottom: '1px solid #E2D9C8',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {CHAPTERS.map((c) => {
          const open = isChapterUnlocked(c.level, unlocked)
          const active = to === c.anchor
          return (
            <button
              key={c.anchor}
              onClick={() => open && setTo(c.anchor)}
              disabled={!open}
              title={open ? c.title : `Terkunci · Capai Level ${c.level} (${LEVEL_LABEL[c.level]})`}
              style={{
                flex: '0 0 auto',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 11px',
                borderRadius: 16,
                cursor: open ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                border: `1px solid ${active ? TEAL : 'rgba(15,76,92,0.25)'}`,
                background: active ? TEAL : open ? '#fff' : 'transparent',
                color: active ? CREAM : open ? TEAL : 'rgba(15,76,92,0.4)',
                opacity: open ? 1 : 0.7,
                transition: 'all .15s',
              }}
            >
              Bab {c.chapter}
              {!open && ' 🔒'}
            </button>
          )
        })}
      </div>

      {/* Isi buku (terisolasi di iframe) */}
      <iframe
        key={src}
        src={src}
        title="Materi Pak Andung"
        style={{ flex: 1, width: '100%', border: 'none', minHeight: 0, background: '#e8e4dc' }}
      />
    </div>
  )
}
