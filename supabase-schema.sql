-- ═══════════════════════════════════════════════════════════
-- PAK ANDUNG v2 — PROGRESS & GAMIFIKASI (Fase 1)
-- (Sama dengan supabase-migration-v2-phase1.sql; ada di sini agar
--  skema lengkap tetap terdokumentasi di satu file.)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;            -- 1..4
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level_label TEXT DEFAULT 'Pemula';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score_bisnis INT DEFAULT 0;     -- 0..100
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score_finansial INT DEFAULT 0;  -- 0..100
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score_valuasi INT DEFAULT 0;    -- 0..100
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS score_risiko INT DEFAULT 0;     -- 0..100
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_module TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_checkpoints JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID,
  delta JSONB NOT NULL,            -- {bisnis,finansial,valuasi,risiko,xp}
  checkpoint_passed TEXT,          -- null jika tidak ada
  level_after INT,
  rationale TEXT,                  -- alasan satu baris dari model
  used_web_search BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'progress_events'
      AND policyname = 'Users view own progress'
  ) THEN
    CREATE POLICY "Users view own progress" ON public.progress_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'progress_events'
      AND policyname = 'Service role full progress'
  ) THEN
    CREATE POLICY "Service role full progress" ON public.progress_events
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
