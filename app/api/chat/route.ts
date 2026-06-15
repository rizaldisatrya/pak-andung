// app/api/chat/route.ts
// Menerima pesan dari pengguna → Haiku safety tetap di prompt → kirim ke Anthropic →
// potong blok PROGRESS (sidecar) sebelum disimpan/ditampilkan → hitung & simpan progress →
// tulis progress_events → balas reply bersih + progress ke frontend.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { buildSystemPrompt, SOFT_CAP_MESSAGE } from '@/lib/system-prompt'
import { SOFT_CAP_MESSAGES } from '@/lib/config'
import { computeLevel, isValidCheckpoint, levelDef } from '@/lib/levels'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Util kecil ────────────────────────────────────────────────
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : 0)))

const PROGRESS_START = '<<<PAKANDUNG_PROGRESS>>>'
const PROGRESS_END = '<<<END>>>'

interface MatrixDelta { bisnis: number; finansial: number; valuasi: number; risiko: number }
interface Sidecar {
  level_label?: string
  level_changed?: boolean
  xp_awarded?: number
  matrix_delta?: Partial<MatrixDelta>
  checkpoint_passed?: string | null
  focus?: string
  used_web_search?: boolean
  citations?: { label: string; source: string }[]
}

// Pisahkan teks balasan bersih (untuk user) dari blok sidecar JSON.
function splitSidecar(raw: string): { reply: string; sidecar: Sidecar | null } {
  const start = raw.indexOf(PROGRESS_START)
  if (start === -1) return { reply: raw.trim(), sidecar: null }

  const reply = raw.slice(0, start).trim()
  const after = raw.slice(start + PROGRESS_START.length)
  const end = after.indexOf(PROGRESS_END)
  const jsonText = (end === -1 ? after : after.slice(0, end)).trim()

  try {
    const parsed = JSON.parse(jsonText) as Sidecar
    return { reply, sidecar: parsed }
  } catch {
    return { reply, sidecar: null }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Pastikan pengguna sudah login
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 })
    }

    // 2. Ambil data dari request
    const { message, messageCount } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 })
    }

    // 3. Cek apakah sudah melewati soft cap
    const currentCount: number = messageCount || 0
    if (currentCount >= SOFT_CAP_MESSAGES) {
      const admin = createAdminClient()
      await admin.from('chat_messages').insert([
        { user_id: user.id, role: 'user', content: message },
        { user_id: user.id, role: 'assistant', content: SOFT_CAP_MESSAGE },
      ])
      await admin.from('profiles')
        .update({ message_count: currentCount + 1 })
        .eq('id', user.id)

      return NextResponse.json({
        reply: SOFT_CAP_MESSAGE,
        newMessageCount: currentCount + 1,
      })
    }

    // 4. Ambil profil (untuk progress saat ini) + 20 pesan terakhir sebagai konteks
    const [{ data: profile }, { data: history }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // Progress saat ini (default aman kalau kolom belum ada / null)
    const completedBefore: string[] = Array.isArray(profile?.completed_checkpoints)
      ? (profile!.completed_checkpoints as string[])
      : []
    const scoresBefore = {
      bisnis: profile?.score_bisnis ?? 0,
      finansial: profile?.score_finansial ?? 0,
      valuasi: profile?.score_valuasi ?? 0,
      risiko: profile?.score_risiko ?? 0,
    }
    const levelBefore: number = profile?.level ?? 1
    const xpBefore: number = profile?.xp ?? 0

    // 5. Bangun system prompt v2 dengan progress murid
    const systemPrompt = buildSystemPrompt({
      level: levelBefore,
      xp: xpBefore,
      bisnis: scoresBefore.bisnis,
      finansial: scoresBefore.finansial,
      valuasi: scoresBefore.valuasi,
      risiko: scoresBefore.risiko,
      checkpoints: completedBefore,
    })

    // Balik urutan (terbaru di akhir)
    const pastMessages = (history || []).reverse()

    // 6. Kirim ke Anthropic (Sonnet 4.6).
    //    Tanpa extended thinking (default mati) supaya balasan cepat & murah —
    //    aturan konservatif scoring sudah hidup di system prompt.
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        ...pastMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: message },
      ],
    })

    const rawReply = response.content[0]?.type === 'text'
      ? response.content[0].text
      : 'Maaf, terjadi kesalahan. Coba lagi ya.'

    // 7. Potong sidecar — user tidak boleh melihat blok PROGRESS
    const { reply, sidecar } = splitSidecar(rawReply)
    const safeReply = reply || 'Maaf, terjadi kesalahan. Coba lagi ya.'

    // 8. Terapkan scoring (clamp & anti-inflasi di sisi server)
    const md = sidecar?.matrix_delta ?? {}
    const delta: MatrixDelta = {
      bisnis: clamp(md.bisnis ?? 0, 0, 8),
      finansial: clamp(md.finansial ?? 0, 0, 8),
      valuasi: clamp(md.valuasi ?? 0, 0, 8),
      risiko: clamp(md.risiko ?? 0, 0, 8),
    }
    const xpAwarded = clamp(sidecar?.xp_awarded ?? 0, 0, 40)

    const scoresAfter = {
      bisnis: clamp(scoresBefore.bisnis + delta.bisnis, 0, 100),
      finansial: clamp(scoresBefore.finansial + delta.finansial, 0, 100),
      valuasi: clamp(scoresBefore.valuasi + delta.valuasi, 0, 100),
      risiko: clamp(scoresBefore.risiko + delta.risiko, 0, 100),
    }

    // Checkpoint: hanya yang valid & belum pernah lulus
    let completedAfter = completedBefore
    let checkpointPassed: string | null = null
    const cp = sidecar?.checkpoint_passed ?? null
    if (isValidCheckpoint(cp) && !completedBefore.includes(cp!)) {
      checkpointPassed = cp!
      completedAfter = [...completedBefore, cp!]
    }

    // Level dihitung di SERVER dari checkpoint (bukan percaya model)
    const newLevelDef = computeLevel(completedAfter)
    const levelAfter = newLevelDef.level
    const levelChanged = levelAfter > levelBefore
    const xpAfter = xpBefore + xpAwarded
    const focus = (sidecar?.focus && sidecar.focus.trim()) || levelDef(levelAfter).focus

    // 9. Simpan pesan (reply BERSIH, tanpa sidecar) → ambil id assistant
    const admin = createAdminClient()
    const { data: inserted } = await admin
      .from('chat_messages')
      .insert([
        { user_id: user.id, role: 'user', content: message },
        { user_id: user.id, role: 'assistant', content: safeReply },
      ])
      .select('id, role')

    const assistantMsgId =
      inserted?.find(r => r.role === 'assistant')?.id ?? null

    // 10. Update profiles: progress + message_count
    const newCount = currentCount + 1
    await admin.from('profiles')
      .update({
        message_count: newCount,
        level: levelAfter,
        level_label: newLevelDef.label,
        xp: xpAfter,
        score_bisnis: scoresAfter.bisnis,
        score_finansial: scoresAfter.finansial,
        score_valuasi: scoresAfter.valuasi,
        score_risiko: scoresAfter.risiko,
        current_module: newLevelDef.module,
        completed_checkpoints: completedAfter,
      })
      .eq('id', user.id)

    // 11. Tulis progress_events (audit, tiap giliran)
    await admin.from('progress_events').insert({
      user_id: user.id,
      message_id: assistantMsgId,
      delta: { ...delta, xp: xpAwarded },
      checkpoint_passed: checkpointPassed,
      level_after: levelAfter,
      rationale: focus,
      used_web_search: false,
    })

    // 12. Balas reply bersih + progress untuk ProgressRail
    return NextResponse.json({
      reply: safeReply,
      newMessageCount: newCount,
      progress: {
        level: levelAfter,
        level_label: newLevelDef.label,
        focus,
        xp: xpAfter,
        level_changed: levelChanged,
        scores: scoresAfter,
        citations: sidecar?.citations ?? [],
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server. Coba lagi dalam beberapa detik.' },
      { status: 500 }
    )
  }
}
