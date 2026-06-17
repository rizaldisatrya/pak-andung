/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pastikan file materi (HTML) ikut dibundel ke fungsi /api/materi di Vercel,
  // karena dibaca via fs saat runtime (bukan di-import).
  experimental: {
    outputFileTracingIncludes: {
      '/api/materi': ['./content/**'],
    },
  },
}

module.exports = nextConfig
