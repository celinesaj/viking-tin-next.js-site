import { Metadata } from 'next'
import { getLocalProductBySlug } from '@/data/localCatalog'

// Utility function to generate SEO-friendly metadata for product pages
export async function generateProductMetadata(slug: string): Promise<Metadata> {
  const product = getLocalProductBySlug(slug);

  const productName = product?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = product?.description || `Discover ${productName} - Premium nicotine pouch from Viking Tin. High-quality, discreet, and flavorful nicotine alternative.`;
  const imageUrl = product?.cover_gif_url || `/images/products/${slug}.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName,
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "Viking Tin"
    },
    "category": product?.flavor_name || "Nicotine Pouches",
    "image": imageUrl,
    "offers": {
      "@type": "Offer",
      "price": product?.price || "0",
      "priceCurrency": "USD",
      "availability": (product?.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "condition": "https://schema.org/NewCondition",
    },
    "aggregateRating": undefined,
  };

  return {
    title: `${productName} - Premium Nicotine Pouch | Viking Tin`,
    description,
    keywords: [`${productName}`, 'nicotine pouch', 'premium nicotine', 'discreet nicotine', 'viking tin', product?.flavor_name, product?.strength_name].filter((value): value is string => Boolean(value)),
    openGraph: {
      title: `${productName} - Viking Tin`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${productName} - Premium Nicotine Pouch`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${productName} - Viking Tin`,
      description,
      images: [imageUrl],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  };
}

// Utility function to generate metadata for blog posts
export async function generateBlogMetadata(slug: string): Promise<Metadata> {
  const blogTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const description = `Read our latest article: ${blogTitle}. Stay informed about nicotine pouches, health, and lifestyle tips from Viking Tin.`

  return {
    title: `${blogTitle} - Viking Tin Blog`,
    description,
    keywords: [`${blogTitle}`, 'nicotine blog', 'health tips', 'lifestyle', 'nicotine education'],
    openGraph: {
      title: `${blogTitle} - Viking Tin Blog`,
      description,
    
      type: 'article',
    },
  
  }
}

// Utility function to generate metadata for special offers
export async function generateOfferMetadata(slug: string): Promise<Metadata> {
  const offerName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const description = `Limited time offer: ${offerName}. Save on premium nicotine pouches at Viking Tin. Don't miss out on this special deal!`

  return {
    title: `${offerName} - Special Offer`,
    description,
    keywords: [`${offerName}`, 'special offer', 'discount', 'nicotine pouch deal', 'limited time'],
    openGraph: {
      title: `${offerName} - Viking Tin Special Offer`,
      description,
      
    },
  }
}

// Utility function to generate metadata for bundles
export async function generateBundleMetadata(slug: string): Promise<Metadata> {
  const bundleName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const description = `Explore our ${bundleName} bundle. Save on premium nicotine pouches with our curated value packs at Viking Tin.`

  return {
    title: `${bundleName} - Premium Bundle`,
    description,
    keywords: [`${bundleName}`, 'nicotine bundle', 'value pack', 'bulk nicotine', 'premium collection'],
    openGraph: {
      title: `${bundleName} - Viking Tin Bundle`,
      description,
 
    },
  }
}