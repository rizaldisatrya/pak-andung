// app/api/chat/route.ts
// Menerima pesan dari pengguna → kirim ke Anthropic → simpan ke Supabase → balas

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPT, SOFT_CAP_MESSAGE } from '@/lib/system-prompt'
import { SOFT_CAP_MESSAGES } from '@/lib/config'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
      // Simpan pesan user, lalu balas dengan pesan soft cap
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

    // 4. Ambil 20 pesan terakhir sebagai konteks percakapan
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Balik urutan (terbaru di akhir)
    const pastMessages = (history || []).reverse()

    // 5. Kirim ke Anthropic
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        ...pastMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: message },
      ],
    })

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Maaf, terjadi kesalahan. Coba lagi ya.'

    // 6. Simpan kedua pesan ke Supabase
    const admin = createAdminClient()
    await admin.from('chat_messages').insert([
      { user_id: user.id, role: 'user',      content: message },
      { user_id: user.id, role: 'assistant', content: reply   },
    ])

    // 7. Update message_count
    const newCount = currentCount + 1
    await admin.from('profiles')
      .update({ message_count: newCount })
      .eq('id', user.id)

    return NextResponse.json({ reply, newMessageCount: newCount })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server. Coba lagi dalam beberapa detik.' },
      { status: 500 }
    )
  }
}
