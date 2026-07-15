import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8080'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/auth`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/terminos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
