// app/api/cohorts/route.ts
// ═══════════════════════════════════════════════════════════════
// PUBLIC API — Daftar Sesi Cohort Aktif
// Dipanggil oleh landing page mulaiinvest.id
// GET /api/cohorts → return list sesi
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = createAdminClient()

    const { data: sessions, error } = await admin
      .from('cohort_sessions')
      .select('id, tanggal, waktu_mulai, speaker_nama, speaker_jabatan, topik, harga, total_slot, slot_tersisa, lynk_url, aktif')
      .eq('aktif', true)
      .order('tanggal', { ascending: true })

    if (error) throw error

    return NextResponse.json(
      { sessions: sessions || [] },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=60',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching cohort sessions:', error)
    return NextResponse.json(
      { sessions: [], error: 'Gagal memuat sesi' },
      { status: 500 }
    )
  }
}
