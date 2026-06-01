// ═══════════════════════════════════════════════════════════════
// lib/rapor-rubrik.ts
// RUBRIK PENILAIAN 4 DIMENSI — RAPOR SAYA
//
// ✏️  CARA SUNTING:
//   - Edit bagian RUBRIK_DIMENSI untuk mengubah kriteria penilaian
//   - Edit bagian THRESHOLDS untuk mengubah batas Kuat/Sedang/Lemah
//   - Edit bagian SYSTEM_PROMPT untuk mengubah "cara berpikir" AI penilai
//
// Setelah sunting, bandingkan output AI dengan penilaian manual kamu
// menggunakan fungsi hitungSelisihManual() di bagian bawah.
// ═══════════════════════════════════════════════════════════════

// ── 1. THRESHOLD LABEL ───────────────────────────────────────
// Ubah angka ini untuk memperketat atau melonggarkan standar penilaian.
export const THRESHOLDS = {
  KUAT:   75,  // skor >= 75 → "Kuat"
  SEDANG: 50,  // skor >= 50 → "Sedang"
               // skor <  50 → "Lemah"
}

// ── 2. RUBRIK PER DIMENSI ─────────────────────────────────────
// Setiap dimensi punya:
//   - deskripsi: penjelasan ke AI tentang apa yang dinilai
//   - indikator_kuat: bukti konkret bahwa pemahaman "Kuat"
//   - indikator_sedang: bukti pemahaman "Sedang"
//   - indikator_lemah: tanda-tanda pemahaman "Lemah"
//   - pertanyaan_lanjutan_template: template pertanyaan yang bisa disesuaikan

export const RUBRIK_DIMENSI = [
  {
    id: 'bisnis',
    nama: 'Pemahaman Bisnis',
    emoji: '🏢',
    deskripsi: `
      Nilai seberapa dalam pengguna memahami MODEL BISNIS perusahaan yang dibahas.
      Bukan sekadar tahu nama perusahaan — tapi mengerti:
      (a) dari mana perusahaan menghasilkan uang (segmen, produk, geografi),
      (b) siapa pelanggan utama dan mengapa mereka membeli,
      (c) keunggulan kompetitif nyata (bukan hanya "perusahaan besar"),
      (d) risiko bisnis struktural yang bisa menggerus keunggulan itu.
    `,
    indikator_kuat: [
      'Menyebut segmen revenue spesifik dengan angka persentase atau tren',
      'Membandingkan model bisnis dengan kompetitor secara konkret',
      'Mengidentifikasi moat (switching cost, network effect, brand, dll)',
      'Mempertanyakan ketahanan bisnis saat siklus turun',
    ],
    indikator_sedang: [
      'Mengerti bisnis intinya tapi kurang detail angka',
      'Tahu kompetitor tapi tidak analisa keunggulan relatif',
      'Ada pemahaman produk tapi belum ke model monetisasinya',
    ],
    indikator_lemah: [
      'Hanya menyebut nama produk tanpa model pendapatan',
      'Tidak tahu siapa pelanggan utama',
      'Analisa bisnis generik tanpa data spesifik perusahaan',
      'Bingung antara produk dan bisnis',
    ],
    pertanyaan_lanjutan_template: [
      'Segmen mana yang tumbuh paling cepat dan berapa kontribusinya ke revenue?',
      'Apa yang akan terjadi pada bisnis ini jika kompetitor terbesar potong harga 20%?',
      'Di mana letak switching cost untuk pelanggan mereka?',
    ],
  },

  {
    id: 'finansial',
    nama: 'Kesehatan Finansial',
    emoji: '📊',
    deskripsi: `
      Nilai seberapa tepat dan kontekstual pengguna membaca angka keuangan.
      KRITIS: angka keuangan tidak punya makna tanpa konteks.
      ROE 15% di bank berbeda dengan ROE 15% di retail.
      NPL 2% di bank buku IV berbeda dengan NPL 2% di bank BPR.
      Nilai:
      (a) apakah membaca metrik yang relevan untuk jenis bisnisnya,
      (b) apakah menggunakan konteks historis (5 tahun) atau peer comparison,
      (c) apakah memahami kualitas laba (bukan hanya angka laba),
      (d) apakah mengenali tanda-tanda creative accounting atau window dressing.
    `,
    indikator_kuat: [
      'Membandingkan metrik dengan rata-rata historis 3–5 tahun',
      'Memilih metrik yang relevan per sektor (NPL/NIM untuk bank, same-store sales untuk retail)',
      'Mempertanyakan kualitas laba (EBITDA vs. FCF, akrual tinggi, dll)',
      'Menganalisa neraca bukan hanya laba rugi',
    ],
    indikator_sedang: [
      'Membaca angka dengan benar tapi kurang konteks historis',
      'Menggunakan metrik umum (PER, PBV) tanpa menyesuaikan sektor',
      'Tahu ada masalah keuangan tapi tidak bisa jelaskan mekanismenya',
    ],
    indikator_lemah: [
      'Hanya lihat laba bersih tanpa konteks',
      'Tidak tahu metrik apa yang relevan untuk sektornya',
      'Menyimpulkan "sehat" hanya karena laba naik',
      'Tidak membedakan laba operasional vs. laba one-off',
    ],
    pertanyaan_lanjutan_template: [
      'Bagaimana tren FCF (Free Cash Flow) 3 tahun terakhir dibanding net income-nya?',
      'Berapa coverage ratio utang mereka dan bagaimana dibanding rata-rata sektornya?',
      'Apa komponen terbesar dalam pertumbuhan laba — organik atau satu kali?',
    ],
  },

  {
    id: 'valuasi',
    nama: 'Valuasi',
    emoji: '💰',
    deskripsi: `
      Nilai apakah pengguna memahami "murah" atau "mahal" SECARA RELATIF, bukan absolut.
      Harga saham turun ≠ murah. PER 10x ≠ murah tanpa konteks.
      Nilai:
      (a) apakah membandingkan ke historis perusahaan (mean reversion),
      (b) apakah membandingkan ke peer domestik dan/atau regional,
      (c) apakah menggunakan metode yang tepat untuk sektornya (DCF untuk growth, EV/EBITDA untuk siklikal),
      (d) apakah mempertimbangkan margin of safety.
      PENTING: Anggap mencukupi jika user melakukan SALAH SATU perbandingan di atas dengan angka konkret.
    `,
    indikator_kuat: [
      'Membandingkan valuasi saat ini ke rata-rata historis 5 tahun dengan angka',
      'Peer comparison dengan 2+ perusahaan sejenis + alasan mengapa layak di-premium/discount',
      'Menggunakan metode valuasi yang sesuai sektornya',
      'Menyebut angka intrinsic value atau margin of safety yang jelas',
    ],
    indikator_sedang: [
      'Ada perbandingan historis atau peer tapi tidak dengan angka konkret',
      'Menggunakan PER/PBV tapi tanpa konteks apakah di atas/bawah norma',
      'Sadar valuasi penting tapi metodologinya tidak jelas',
    ],
    indikator_lemah: [
      'Mengatakan "murah" hanya karena harga saham turun dari ATH',
      'Tidak membandingkan ke apapun — absolut tanpa referensi',
      'Menggunakan metode yang salah untuk sektornya',
      'Tidak menyebut margin of safety sama sekali',
    ],
    pertanyaan_lanjutan_template: [
      'PER sekarang dibanding rata-rata 5 tahun terakhir berapa? Apakah diskon atau premium justified?',
      'Kalau kamu pakai DCF dengan growth konservatif, intrinsic value-nya di kisaran berapa?',
      'Peer-nya dengan valuasi serupa — mana yang kamu pilih dan kenapa bukan yang lain?',
    ],
  },

  {
    id: 'risiko',
    nama: 'Risiko',
    emoji: '⚠️',
    deskripsi: `
      Nilai apakah pengguna secara eksplisit mengidentifikasi risiko yang bisa MEMBUAT THESIS-NYA SALAH.
      Bukan risiko generik ("saham bisa turun") — tapi risiko spesifik yang mengancam asumsi thesis.
      Nilai:
      (a) apakah menyebut risiko bisnis spesifik (bukan hanya makro),
      (b) apakah menyebut kondisi yang akan mengubah pandangannya (kill switch),
      (c) apakah risiko-risikonya berhubungan langsung dengan asumsi utama thesis,
      (d) apakah ada estimasi probabilitas atau dampak (walaupun kasar).
      INGAT: Investor pemula sering tidak menyebut risiko sama sekali — itu lemah, bukan netral.
    `,
    indikator_kuat: [
      'Menyebut 2+ risiko spesifik yang langsung mengancam asumsi thesis',
      'Ada "kill switch" — kondisi yang akan membuat dia keluar dari posisi',
      'Membedakan risiko jangka pendek vs. risiko struktural jangka panjang',
      'Mempertimbangkan risiko regulatory atau geopolitik yang relevan untuk sektor',
    ],
    indikator_sedang: [
      'Menyebut risiko tapi terlalu generik (mis. "ekonomi melambat")',
      'Sadar ada risiko tapi tidak menghubungkan ke asumsi thesis',
      'Menyebut 1 risiko spesifik tanpa kill switch',
    ],
    indikator_lemah: [
      'Tidak menyebut risiko sama sekali',
      'Risiko hanya "harga bisa turun" tanpa penjelasan kenapa',
      'Optimistis berlebihan tanpa counterargument',
      'Tidak ada skenario di mana thesis bisa salah',
    ],
    pertanyaan_lanjutan_template: [
      'Apa satu kondisi yang akan membuatmu exit dari posisi ini — secara konkret?',
      'Risiko regulasi apa yang bisa mengganggu model bisnis mereka dalam 2 tahun ke depan?',
      'Kalau asumsi terpentingmu tentang pertumbuhan revenue ternyata salah, downside-nya berapa?',
    ],
  },
]

// ── 3. SYSTEM PROMPT UNTUK AI PENILAI ─────────────────────────
// Ini adalah "otak" penilai. Sunting dengan hati-hati.
// Jangan ubah format JSON output — kode bergantung pada strukturnya.

export function buildRaporPrompt(percakapan: string): string {
  const rubrikTeks = RUBRIK_DIMENSI.map(d => `
DIMENSI: ${d.nama}
DESKRIPSI: ${d.deskripsi}
INDIKATOR KUAT: ${d.indikator_kuat.join('; ')}
INDIKATOR SEDANG: ${d.indikator_sedang.join('; ')}
INDIKATOR LEMAH: ${d.indikator_lemah.join('; ')}
  `).join('\n---\n')

  return `
Kamu adalah penilai objektif kualitas analisa investasi saham.
Tugasmu: baca percakapan seorang pengguna dengan Pak Andung, lalu nilai perkembangan cara berpikirnya dalam 4 dimensi.

PENTING:
- Nilai CARA BERPIKIR, bukan keputusan investasinya (beli/jual adalah hak pengguna)
- Nada penilaian: membimbing, bukan menghakimi. Fokus pada "apa yang sudah bagus" dan "apa yang bisa berkembang"
- Jika percakapan tidak membahas salah satu dimensi sama sekali, beri skor 0 dan jelaskan bahwa dimensi ini belum dieksplor
- Basis penilaian: percakapan nyata pengguna, bukan asumsi
- Berikan pertanyaan lanjutan yang SPESIFIK untuk saham/sektor yang dibahas pengguna, bukan generik

${rubrikTeks}

THRESHOLD LABEL:
- Skor >= ${THRESHOLDS.KUAT}: "Kuat"
- Skor >= ${THRESHOLDS.SEDANG}: "Sedang"  
- Skor < ${THRESHOLDS.SEDANG}: "Lemah"

FORMAT OUTPUT: kembalikan HANYA JSON valid berikut, tanpa teks lain, tanpa markdown:
{
  "ringkasan_umum": "2-3 kalimat tentang gambaran besar perkembangan pengguna — positif dan konstruktif",
  "dimensi": [
    {
      "id": "bisnis",
      "nama": "Pemahaman Bisnis",
      "skor": <angka 0-100>,
      "label": "<Kuat|Sedang|Lemah>",
      "apa_yang_bagus": "<kalimat spesifik dari percakapan yang menunjukkan pemahaman bagus — kutip jika ada>",
      "area_berkembang": "<satu area konkret yang bisa diperdalam — spesifik, bukan generik>",
      "pertanyaan_lanjutan": "<1 pertanyaan konkret untuk memperdalam, relevan dengan saham/sektor yang dibahas>"
    },
    {
      "id": "finansial",
      "nama": "Kesehatan Finansial",
      "skor": <angka 0-100>,
      "label": "<Kuat|Sedang|Lemah>",
      "apa_yang_bagus": "...",
      "area_berkembang": "...",
      "pertanyaan_lanjutan": "..."
    },
    {
      "id": "valuasi",
      "nama": "Valuasi",
      "skor": <angka 0-100>,
      "label": "<Kuat|Sedang|Lemah>",
      "apa_yang_bagus": "...",
      "area_berkembang": "...",
      "pertanyaan_lanjutan": "..."
    },
    {
      "id": "risiko",
      "nama": "Risiko",
      "skor": <angka 0-100>,
      "label": "<Kuat|Sedang|Lemah>",
      "apa_yang_bagus": "...",
      "area_berkembang": "...",
      "pertanyaan_lanjutan": "..."
    }
  ]
}

PERCAKAPAN YANG DINILAI:
${percakapan}
`
}

// ── 4. ALAT BANTU PERBANDINGAN MANUAL VS AI ───────────────────
// Gunakan ini untuk memvalidasi AI sebelum trust penuh ke hasilnya.
// Cara pakai: isi penilaian manual kamu, lalu bandingkan.

export interface PenilaianDimensi {
  id: string
  skor: number
  label: string
}

export interface HasilPerbandingan {
  dimensiId: string
  skorManual: number
  skorAI: number
  selisih: number
  statusSelisih: 'aman' | 'perlu_cek' | 'berbeda_jauh'
  catatan: string
}

export function hitungSelisihManual(
  penilaianManual: PenilaianDimensi[],
  penilaianAI: PenilaianDimensi[]
): { hasil: HasilPerbandingan[]; rataSelisih: number; layakProduction: boolean } {
  const hasil: HasilPerbandingan[] = penilaianManual.map(manual => {
    const ai = penilaianAI.find(a => a.id === manual.id)
    if (!ai) return {
      dimensiId: manual.id,
      skorManual: manual.skor,
      skorAI: 0,
      selisih: manual.skor,
      statusSelisih: 'berbeda_jauh',
      catatan: 'AI tidak menilai dimensi ini'
    }

    const selisih = Math.abs(manual.skor - ai.skor)
    const statusSelisih = selisih <= 10 ? 'aman'
      : selisih <= 20 ? 'perlu_cek'
      : 'berbeda_jauh'

    return {
      dimensiId: manual.id,
      skorManual: manual.skor,
      skorAI: ai.skor,
      selisih,
      statusSelisih,
      catatan: statusSelisih === 'aman'
        ? '✅ Selisih dalam toleransi'
        : statusSelisih === 'perlu_cek'
        ? '⚠️ Perlu dicek — selisih 11–20 poin'
        : '❌ Berbeda jauh — review rubrik untuk dimensi ini',
    }
  })

  const rataSelisih = hasil.reduce((sum, h) => sum + h.selisih, 0) / hasil.length

  // Layak production jika rata-rata selisih ≤ 20 poin (sesuai panduan)
  const layakProduction = rataSelisih <= 20

  return { hasil, rataSelisih, layakProduction }
}
