-- ═══════════════════════════════════════════════════════════
-- SKEMA DATABASE PAK ANDUNG
-- Jalankan ini di: Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════

-- ── TABEL 1: PROFIL PENGGUNA ─────────────────────────────────
-- Menyimpan data tambahan per pengguna (di luar data auth bawaan Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  email             TEXT,
  product_name      TEXT,                          -- nama produk yang dibeli (mis. "Trial", "Bulanan")
  access_expires_at TIMESTAMPTZ NOT NULL,          -- kapan akses berakhir
  message_count     INTEGER DEFAULT 0 NOT NULL,    -- total pesan yang sudah dikirim
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABEL 2: RIWAYAT CHAT ────────────────────────────────────
-- Menyimpan semua percakapan per pengguna
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')), -- 'user' atau 'assistant'
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEX untuk mempercepat query ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
  ON public.chat_messages(user_id, created_at DESC);

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
-- Ini memastikan setiap pengguna HANYA bisa lihat data miliknya sendiri
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: pengguna hanya bisa baca/ubah profile sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: pengguna hanya bisa baca/tulis chat sendiri
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── AKSES SERVICE ROLE untuk webhook ─────────────────────────
-- Service role (dipakai di webhook) bisa akses semua data
CREATE POLICY "Service role full access profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access messages"
  ON public.chat_messages FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════
-- SELESAI. Klik "Run" dan pastikan semua baris sukses (hijau).
-- ═══════════════════════════════════════════════════════════
