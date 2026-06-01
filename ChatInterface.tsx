// app/expired/page.tsx
// Halaman yang muncul saat akses pengguna sudah berakhir

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
         style={{ background: 'linear-gradient(135deg, #0F4C5C 0%, #1a6878 100%)' }}>

      <div className="w-full max-w-sm">
        <div className="text-5xl mb-6">⏳</div>

        <h1 className="font-serif text-3xl text-white mb-3">
          Akses kamu sudah berakhir
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(212,233,237,0.8)', lineHeight: 1.7 }}>
          Masa akses 30 hari kamu sudah habis. Perpanjang sekarang untuk kembali ngobrol
          dengan Pak Andung dan melanjutkan perjalanan belajar investasimu. 🚀
        </p>

        <a
          href="https://mulaiinvest.id"
          className="block w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90"
          style={{ background: '#E89B3C', color: '#1A2832', letterSpacing: '0.02em' }}
        >
          Perpanjang Akses Sekarang →
        </a>

        <div className="mt-6 p-4 rounded-xl text-left"
             style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#E89B3C' }}>
            Sudah perpanjang tapi belum bisa masuk?
          </p>
          <p className="text-xs" style={{ color: 'rgba(212,233,237,0.7)' }}>
            Tunggu 5 menit lalu coba refresh halaman ini.
            Masih bermasalah? Hubungi{' '}
            <a href="mailto:Admin@mulaiinvest.id" className="underline" style={{ color: '#E89B3C' }}>
              Admin@mulaiinvest.id
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
