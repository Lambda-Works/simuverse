import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8080'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth', '/terminos'],
        disallow: ['/admin', '/profesor', '/estudiante', '/ministerio', '/simulation'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
