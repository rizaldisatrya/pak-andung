# Incident Note — Login Freeze / OOM / Server Crash (Juni 2026)

Catatan ini dibuat sebagai dokumentasi internal: apa yang rusak di production,
kenapa, dan bagaimana cara memperbaikinya — supaya kalau muncul gejala serupa
lagi, debugging-nya cepat.

## Ringkasan

Setelah menambahkan fitur "Baca Materi", `app.mulaiinvest.id` mengalami
serangkaian error berantai: server crash → OOM (out of memory) → halaman
putih kosong → macet selamanya di "Memuat…". Semua berakar dari **dua**
masalah, bukan banyak masalah terpisah:

1. **Cookie write di Server Component** memicu Supabase retry refresh token
   tanpa henti → OOM di hampir semua halaman.
2. **Dua library Supabase browser berjalan bersamaan** (`@supabase/ssr` di
   sebagian besar app, `@supabase/auth-helpers-nextjs` yang lama di
   `app/page.tsx`) → rebutan lock auth (`navigator.locks`) → `getSession()`
   macet selamanya, bahkan dengan timeout.

## Kronologi & Akar Masalah

| # | Gejala | Akar masalah | Perbaikan |
|---|---|---|---|
| 1 | "Materi belum tersedia" | File buku diunggah tanpa ekstensi `.html` | Rename file di GitHub jadi `content/mulai_invest_full_v7.html` |
| 2 | "Application error: a server-side exception" di domain custom | (gejala dari masalah #3, bukan masalah baru) | — |
| 3 | Log Vercel: `Cookies can only be modified in a Server Action or Route Handler` | `app/page.tsx` adalah Server Component yang memanggil `createServerSupabaseClient()`; Server Component **tidak boleh** menulis cookie, tapi Supabase mencoba `cookies().set()` saat refresh token | Ubah `app/page.tsx` jadi Client Component |
| 4 | "Runtime Error: instance was killed because it ran out of available memory" di hampir semua halaman | `set`/`remove` callback cookie di `lib/supabase/server.ts` melempar error tanpa ditangkap → Supabase retry refresh token **tanpa henti** → memori habis. Ini bukan cuma bug di `/`, tapi bug sistemik yang kena di **semua** Server Component yang pakai `createServerSupabaseClient()` (`/chat`, `/rapor`, `/expired`, dll) | Bungkus `set`/`remove` dengan `try/catch` di `lib/supabase/server.ts` (pola resmi Supabase untuk Next.js App Router — cookie tetap valid untuk request yang sedang berjalan, error saat re-set di Server Component cukup diabaikan) |
| 5 | Halaman putih kosong (blank page) | `app/page.tsx` belum punya error boundary; kalau `getUser()`/auth client gagal diam-diam, komponen return `null` | Tambah try/catch + UI error fallback + UI loading |
| 6 | Pesan error "Auth session missing" tampil ke user alih-alih redirect mulus | `getUser()` melempar error ini setiap kali user **belum login** — ini kondisi normal, bukan error sungguhan | Ganti `getUser()` → `getSession()` (tidak melempar error saat belum ada sesi) |
| 7 | Halaman macet selamanya di teks "Memuat…", tidak pernah redirect — bahkan setelah ditambah `Promise.race` + timeout 8–10 detik | **Akar masalah sebenarnya**: `app/page.tsx` memakai `@supabase/auth-helpers-nextjs` (`createClientComponentClient`), sedangkan `/login` & `ChatInterface.tsx` memakai `@supabase/ssr` (`createBrowserClient`, lewat `lib/supabase/client.ts`). Dua instance GoTrueClient yang berbeda library berjalan bersamaan di tab browser yang sama → rebutan `navigator.locks` saat refresh sesi → `getSession()` macet selamanya. `Promise.race` tidak menyelamatkan ini karena lock yang ditunggu di bawah tidak benar-benar dibatalkan walau race-nya "kalah" | Ganti `app/page.tsx` untuk pakai `createClient` dari `@/lib/supabase/client` (sama dengan seluruh app lain) — **inilah perbaikan yang akhirnya menyelesaikan freeze-nya** |

## Perbaikan Lanjutan (Audit Proaktif)

Setelah freeze di `/` selesai, dilakukan audit ke seluruh codebase untuk
mencari pola bug yang sama (dua library Supabase browser tercampur) sebelum
sempat muncul di production:

- **`app/rapor/page.tsx`** — masih pakai `createClientComponentClient` dari
  `@supabase/auth-helpers-nextjs`. Diganti ke `createClient` dari
  `@/lib/supabase/client`.
- **`app/admin/cohort/page.tsx`** — sama, diganti juga.
- **`package.json`** — dependency `@supabase/auth-helpers-nextjs` dihapus
  total (sudah tidak dipakai di mana pun) supaya tidak ada yang sengaja atau
  tidak sengaja memakainya lagi di kemudian hari.
- **`app/api/rapor/generate/route.ts`** — ditemukan bug terpisah (bukan
  freeze, tapi false-negative error): jika rapor sudah berhasil dinilai &
  disimpan ke database, tapi pengiriman email pengingat via Resend gagal,
  user menerima respons error 500 walau rapor mereka sebenarnya sudah aman
  tersimpan. Pengiriman email sekarang dibungkus try/catch sendiri — gagal
  kirim email tidak lagi membuat seluruh request dianggap gagal.

## Hal yang Diperiksa Tapi TIDAK Diubah (catatan, bukan bug)

- `/api/chat` dan `/api/rapor/generate` memanggil Anthropic tanpa
  `export const maxDuration`. Di paket Vercel Hobby, fungsi serverless
  dibatasi ~10 detik — kalau balasan Claude lambat, request bisa timeout.
  Tidak diubah otomatis karena nilai `maxDuration` yang valid bergantung
  paket Vercel yang dipakai (kalau di-set lebih tinggi dari yang diizinkan
  paket, deployment bisa gagal). **Rekomendasi**: cek paket Vercel yang aktif,
  lalu tambahkan `export const maxDuration = <sesuai paket>` di kedua route
  itu kalau timeout pernah terjadi.
- `/api/lynk-webhook` hanya memeriksa **keberadaan** header
  `x-lynk-signature`, belum memverifikasi isinya secara kriptografis (ada
  komentar `// TODO: Implement signature verification`). Ini bukan bug yang
  menyebabkan freeze, tapi celah keamanan: siapapun yang tahu nama header ini
  bisa memicu endpoint webhook (pembuatan akun / pendaftaran cohort) tanpa
  benar-benar berasal dari Lynk. Tidak diubah karena perlu skema signing resmi
  dari dokumentasi Lynk (secret key, algoritma hash) yang belum tersedia di
  sesi ini.
- Resend di `/api/lynk-webhook` & error handling lain di route API sudah
  dibungkus try/catch di level terluar — sempat dicurigai "unhandled
  rejection crash" tapi setelah diperiksa langsung ke kode, ternyata sudah
  aman (selalu balas JSON 500 yang rapi, tidak crash proses).

## Pelajaran untuk Ke Depan

1. **Jangan campur dua library Supabase browser** (`@supabase/ssr` vs
   `@supabase/auth-helpers-nextjs`) dalam satu app — pakai satu saja
   (`lib/supabase/client.ts` untuk browser, `lib/supabase/server.ts` untuk
   server) secara konsisten di semua file baru.
2. **Server Component tidak boleh menulis cookie** — kalau butuh
   `createServerSupabaseClient()` di Server Component, pastikan callback
   `set`/`remove` dibungkus try/catch (sudah jadi default di
   `lib/supabase/server.ts` sekarang).
3. **`getUser()` vs `getSession()`**: `getUser()` melempar error kalau belum
   ada sesi (state normal untuk user yang belum login) — untuk cek "apakah
   user login" di sisi client, `getSession()` lebih aman karena tidak
   melempar error untuk kondisi itu.
