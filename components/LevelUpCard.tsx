'use client'
// components/LevelUpCard.tsx
// Kartu inline yang muncul saat naik level. Tenang & bermartabat
// (tanpa confetti norak) — menghormati prinsip "Wounded Ramdhan".

interface Props {
  levelLabel: string
  focus: string
}

const NAVY = '#090f5b'
const GREEN = '#6ee043'

export default function LevelUpCard({ levelLabel, focus }: Props) {
  return (
    <div
      className="message-enter rounded-2xl px-4 py-3 my-1"
      style={{
        background: 'linear-gradient(135deg, rgba(9,15,91,0.04), rgba(110,224,67,0.10))',
        border: `1px solid ${GREEN}`,
      }}
      role="status"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🎓</span>
        <p className="text-sm font-semibold" style={{ color: NAVY }}>
          Selamat, kamu naik ke level <span style={{ color: '#2f6f12' }}>{levelLabel}</span>!
        </p>
      </div>
      <p className="text-xs mt-1.5" style={{ color: 'rgba(9,15,91,0.7)' }}>
        Fokus berikutnya: {focus}. Tetap pelan-pelan dan teliti ya — kualitas analisa lebih penting daripada kecepatan.
      </p>
    </div>
  )
}
