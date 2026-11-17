import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/login',
          '/create-account',
          '/forgot-password/',
          '/complete-phone',
          '/verify-signup',
          '/point-of-sale',
          '/cart', // IMPORTANT: remove from indexing
        ],
      },
    ],
    sitemap: 'https://vikingtin.ae/sitemap.xml',
  }
}