import { MetadataRoute } from 'next'
import { localBlogs, localBundles, localProducts } from '@/data/localCatalog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vikingtin.ae'

  const products = localProducts
  const blogs = localBlogs
  const bundles = localBundles

  return [
    // STATIC PAGES
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bundles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/specialOffers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // DYNAMIC PRODUCTS
    ...products.map((p) => ({
      url: `${baseUrl}/products/${p.slug || p.id}`,
      lastModified: new Date(p.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),

    // DYNAMIC BLOGS
    ...blogs.map((b) => ({
      url: `${baseUrl}/blogs/${b.slug || b.id}`,
      lastModified: new Date(b.updatedAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),

    // DYNAMIC BUNDLES
    ...bundles.map((b) => ({
      url: `${baseUrl}/bundles/${b.slug || b.id}`,
      lastModified: new Date(b.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    
  ]
}