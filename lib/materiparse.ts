// lib/materi-parse.ts
// ─────────────────────────────────────────────────────────────
// Parser materi (server-only). Membaca buku HTML sekali, lalu cache
// di memori. Memecah <body> jadi blok <section>, mengklasifikasi
// front | chapter (1..8) | back, menyuntik id anchor (bab-N, s-N-i),
// dan memetakan bab -> level (1-2=L1, 3-4=L2, 5-6=L3, 7-8=L4).
//
// File sumber: content/mulai_invest_full_v7.html (diunggah ke repo).
// Bila file tak ada -> getMateri() mengembalikan null (route menangani).
// ─────────────────────────────────────────────────────────────
import { promises as fs } from 'fs'
import path from 'path'

export interface MateriBlock {
  kind: 'front' | 'chapter' | 'back'
  level: number   // 0 untuk front/back; 1..4 untuk bab
  chapter: number // 0 atau 1..8
  anchor: string  // '' atau 'bab-N'
  title: string
  html: string
}
export interface Materi { head: string; blocks: MateriBlock[] }

const SRC = path.join(process.cwd(), 'content', 'mulai_invest_full_v7.html')

let cache: Materi | null = null
let tried = false

const stripTags = (s: string) =>
  s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

function parse(raw: string): Materi {
  const headMatch = raw.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const head = headMatch ? headMatch[1].trim() : ''

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const bodyInner = bodyMatch ? bodyMatch[1] : raw
  const sections = bodyInner.match(/<section\b[\s\S]*?<\/section>/gi) || []

  const blocks: MateriBlock[] = []
  let chapter = 0
  let phase: 'front' | 'chapter' | 'back' = 'front'

  for (let sec of sections) {
    const isOpener = /class="[^"]*chapter-opener[^"]*"/.test(sec)
    const isBackStart = /class="chapter-num"[^>]*>\s*(Lampiran|Penutup)/.test(sec)

    if (isBackStart && phase !== 'back') phase = 'back'

    let kind: 'front' | 'chapter' | 'back'
    let level: number
    let anchor = ''
    let title = ''

    if (isOpener) {
      phase = 'chapter'
      chapter += 1
      level = Math.ceil(chapter / 2)
      anchor = `bab-${chapter}`
      sec = sec.replace(/<section\b/, `<section id="${anchor}"`)
      const t = sec.match(/<h2[^>]*class="opener-title"[^>]*>([\s\S]*?)<\/h2>/i)
      title = t ? stripTags(t[1]) : `Bab ${chapter}`
      kind = 'chapter'
    } else if (phase === 'chapter') {
      kind = 'chapter'
      level = Math.ceil(chapter / 2)
    } else {
      kind = phase
      level = 0
      const t = sec.match(/<h2[^>]*class="chapter-title"[^>]*>([\s\S]*?)<\/h2>/i)
      title = t ? stripTags(t[1]) : ''
    }

    // anchor halus pada tiap section-head (untuk deep-link opsional)
    let i = 0
    sec = sec.replace(/<h3\b([^>]*class="[^"]*section-head[^"]*"[^>]*)>/gi, (_m, attrs) => {
      i += 1
      return `<h3${attrs} id="s-${chapter}-${i}">`
    })

    blocks.push({
      kind,
      level,
      chapter: kind === 'chapter' ? chapter : 0,
      anchor,
      title,
      html: sec,
    })
  }

  return { head, blocks }
}

// Ambil materi (cache). null jika file belum ada di repo.
export async function getMateri(): Promise<Materi | null> {
  if (cache) return cache
  if (tried) return cache
  tried = true
  try {
    const raw = await fs.readFile(SRC, 'utf8')
    cache = parse(raw)
    return cache
  } catch {
    return null
  }
}
