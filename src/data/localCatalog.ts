import type { ProductApiRow } from '@/features/products/productApiMaps';
import { mapProductFromApi } from '@/features/products/productApiMaps';
import type { FlavorApiRow } from '@/features/flavours/flavorApiMaps';
import type { BlogPost } from '@/types/blogs';
import type { Brand } from '@/types/brands';
import type { SitePage } from '@/types/sitePages';
import type { StrengthLevel } from '@/types/strength-lvl';
import type { Testimonial } from '@/types/testimonials';

type Clip = {
  brandSlug: 'nqs' | 'vox';
  brandName: string;
  file: string;
  flavor: string;
  flavorSlug: string;
  price: number;
  comparePrice: number | null;
  nicotineMg: number;
  strengthSlug: string;
  bestSelling: boolean;
};

const CLIPS: Clip[] = [
  { brandSlug: 'nqs', brandName: 'NQS', file: 'berrirs.mp4', flavor: 'Berries', flavorSlug: 'berries', price: 42, comparePrice: 49, nicotineMg: 6, strengthSlug: 'light', bestSelling: true },
  { brandSlug: 'nqs', brandName: 'NQS', file: 'freshmint.mp4', flavor: 'Fresh Mint', flavorSlug: 'fresh-mint', price: 39, comparePrice: null, nicotineMg: 8, strengthSlug: 'medium', bestSelling: true },
  { brandSlug: 'nqs', brandName: 'NQS', file: 'fusionvibes.mp4', flavor: 'Fusion Vibes', flavorSlug: 'fusion-vibes', price: 48, comparePrice: 55, nicotineMg: 12, strengthSlug: 'strong', bestSelling: false },
  { brandSlug: 'nqs', brandName: 'NQS', file: 'mango.mp4', flavor: 'Mango', flavorSlug: 'mango', price: 44, comparePrice: null, nicotineMg: 9, strengthSlug: 'medium', bestSelling: true },
  { brandSlug: 'nqs', brandName: 'NQS', file: 'sweetmint.mp4', flavor: 'Sweet Mint', flavorSlug: 'sweet-mint', price: 41, comparePrice: 46, nicotineMg: 6, strengthSlug: 'light', bestSelling: false },
  { brandSlug: 'vox', brandName: 'VOX', file: 'icymint.mp4', flavor: 'Icy Mint', flavorSlug: 'icy-mint', price: 46, comparePrice: 52, nicotineMg: 11, strengthSlug: 'strong', bestSelling: true },
  { brandSlug: 'vox', brandName: 'VOX', file: 'spearmint.mp4', flavor: 'Spearmint', flavorSlug: 'spearmint', price: 43, comparePrice: null, nicotineMg: 8, strengthSlug: 'medium', bestSelling: false },
  { brandSlug: 'vox', brandName: 'VOX', file: 'sweetmint.mp4', flavor: 'Sweet Mint', flavorSlug: 'sweet-mint', price: 40, comparePrice: 45, nicotineMg: 6, strengthSlug: 'light', bestSelling: true },
  { brandSlug: 'vox', brandName: 'VOX', file: 'watermelon.mp4', flavor: 'Watermelon', flavorSlug: 'watermelon', price: 47, comparePrice: null, nicotineMg: 16, strengthSlug: 'extra-strong', bestSelling: true },
];

const NOW = '2026-01-15T00:00:00.000Z';

export type LocalProduct = ProductApiRow & {
  flavor_slug: string;
  brand_slug: string;
  strength_slug: string;
};

function videoUrl(brandSlug: string, file: string) {
  return `/videos/${brandSlug}/${file}`;
}

export const localProducts: LocalProduct[] = CLIPS.map((clip, index) => {
  const id = String(index + 1);
  const slug = `${clip.brandSlug}-${clip.flavorSlug}`;
  const url = videoUrl(clip.brandSlug, clip.file);
  return {
    id,
    brand_id: clip.brandSlug,
    brand_slug: clip.brandSlug,
    brand_name: clip.brandName,
    flavor_id: clip.flavorSlug,
    flavor_slug: clip.flavorSlug,
    flavor_name: clip.flavor,
    strength_id: clip.strengthSlug,
    strength_slug: clip.strengthSlug,
    strength_name:
      clip.strengthSlug === 'extra-strong'
        ? 'Extra Strong'
        : clip.strengthSlug[0].toUpperCase() + clip.strengthSlug.slice(1),
    name: `${clip.brandName} ${clip.flavor}`,
    slug,
    nicotine_mg: clip.nicotineMg,
    price: clip.price,
    compare_price: clip.comparePrice,
    stock: 80,
    description: `<p>${clip.brandName} ${clip.flavor} nicotine pouches. Local preview using the pouch video from your folder.</p>`,
    pouch_count: 20,
    weight_grams: 16,
    manufacturer: clip.brandName,
    meta_title: `${clip.brandName} ${clip.flavor}`,
    meta_description: `${clip.brandName} ${clip.flavor} nicotine pouches.`,
    hook: `${clip.flavor} pouches`,
    is_active: true,
    is_best_selling: clip.bestSelling,
    created_at: NOW,
    updated_at: NOW,
    cover_gif_url: url,
    cover_image_url: null,
    media: [
      {
        id: `${id}-video`,
        media_type: 'video',
        url,
        sort_order: 0,
        created_at: NOW,
      },
    ],
  };
});

export const localBrands: Brand[] = [
  {
    id: 'nqs',
    name: 'NQS',
    slug: 'nqs',
    logoUrl: null,
    description: 'NQS nicotine pouches.',
    story: 'Local preview brand built from the NQS pouch videos.',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'vox',
    name: 'VOX',
    slug: 'vox',
    logoUrl: null,
    description: 'VOX nicotine pouches.',
    story: 'Local preview brand built from the VOX pouch videos.',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const flavorSeen = new Set<string>();
export const localFlavors: FlavorApiRow[] = localProducts.flatMap((product) => {
  const slug = product.flavor_slug;
  if (flavorSeen.has(slug)) return [];
  flavorSeen.add(slug);
  return [
    {
      id: slug,
      name: product.flavor_name ?? slug,
      slug,
      category: product.brand_name,
      image: null,
      is_active: true,
      created_at: NOW,
      updated_at: NOW,
    },
  ];
});

export const localStrengths: StrengthLevel[] = [
  { id: 'light', name: 'Light', slug: 'light', nicotineRange: '1–6 mg', nicotineMg: 6, sortOrder: 1, createdAt: NOW, updatedAt: NOW },
  { id: 'medium', name: 'Medium', slug: 'medium', nicotineRange: '7–10 mg', nicotineMg: 8, sortOrder: 2, createdAt: NOW, updatedAt: NOW },
  { id: 'strong', name: 'Strong', slug: 'strong', nicotineRange: '11–14 mg', nicotineMg: 12, sortOrder: 3, createdAt: NOW, updatedAt: NOW },
  { id: 'extra-strong', name: 'Extra Strong', slug: 'extra-strong', nicotineRange: '15+ mg', nicotineMg: 16, sortOrder: 4, createdAt: NOW, updatedAt: NOW },
];

export const localBlogs: BlogPost[] = [
  {
    id: 'blog-1',
    categoryId: 'news',
    category: { id: 'news', name: 'News', slug: 'news', description: null, createdAt: NOW, updatedAt: NOW },
    title: 'How to choose a pouch strength',
    slug: 'how-to-choose-a-pouch-strength',
    featuredImage: '/images/hero/hero.jpg',
    content: '<p>Start light, then move up only if you want a stronger hit. This is local preview copy.</p>',
    author: 'Viking Tin',
    publishedAt: NOW,
    isPublished: true,
    metaTitle: 'How to choose a pouch strength',
    metaDescription: 'A short local guide to pouch strength.',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'blog-2',
    categoryId: 'news',
    category: { id: 'news', name: 'News', slug: 'news', description: null, createdAt: NOW, updatedAt: NOW },
    title: 'NQS and VOX flavor notes',
    slug: 'nqs-and-vox-flavor-notes',
    featuredImage: '/images/hero/hero.jpg',
    content: '<p>Mint, mango, berries, and watermelon clips are loaded from the local video folder.</p>',
    author: 'Viking Tin',
    publishedAt: NOW,
    isPublished: true,
    metaTitle: 'NQS and VOX flavor notes',
    metaDescription: 'Flavor notes for the local pouch videos.',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const localPages: SitePage[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: '<p>This is local preview text. No data is sent to the API.</p>',
    metaTitle: 'Privacy Policy',
    metaDescription: 'Local privacy policy preview.',
    imageUrl1: '/images/hero/hero.jpg',
    imageUrl2: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'terms',
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    content: '<p>Local terms preview for the storefront.</p>',
    metaTitle: 'Terms and Conditions',
    metaDescription: 'Local terms preview.',
    imageUrl1: '/images/hero/hero.jpg',
    imageUrl2: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'shipping',
    title: 'Shipping Policy',
    slug: 'shipping-policy',
    content: '<p>Local shipping policy preview.</p>',
    metaTitle: 'Shipping Policy',
    metaDescription: 'Local shipping policy preview.',
    imageUrl1: null,
    imageUrl2: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const localTestimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Alex',
    role: 'Customer',
    imageUrl: null,
    quote: 'The mint pouches are clean and the video preview makes the flavor easy to pick.',
    rating: 5,
    sortOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 't2',
    name: 'Sam',
    role: 'Customer',
    imageUrl: null,
    quote: 'Watermelon and mango are the ones I keep coming back to.',
    rating: 4,
    sortOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const localMarquee = [
  { id: 'm1', text: 'Local preview — pouch videos, no API', is_active: true, created_at: NOW, updated_at: NOW },
  { id: 'm2', text: 'Free local delivery preview across the UAE', is_active: true, created_at: NOW, updated_at: NOW },
];

export const localHeroBanners = [
  {
    id: 1,
    headline: 'NQS & VOX\nPOUCHES',
    subheadline: 'Local videos from your pouch folder',
    image_url: '/images/hero/hero.jpg',
    position: 1,
    start_date: null,
    end_date: null,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  },
];

export const localBundles = [
  {
    id: 'bundle-1',
    name: 'Mint Mix',
    slug: 'mint-mix',
    description: 'A local mix of mint pouches.',
    image_url: '/images/placeholders/product.png',
    price: 110,
    origin_total: 128,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
    products: localProducts.slice(0, 2).map((product) => ({
      id: `line-${product.id}`,
      quantity: 1,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
      },
    })),
    gallery_images: [],
  },
];

export const localSpecialOffers = [
  {
    ...localBundles[0],
    id: 'offer-1',
    name: 'Weekend Pouch Deal',
    slug: 'weekend-pouch-deal',
    price: '99',
    imageUrl: '/images/placeholders/product.png',
    isActive: true,
    originTotal: '128',
    startDate: NOW,
    endDate: null,
    start_date: NOW,
    end_date: null,
    createdAt: NOW,
    updatedAt: NOW,
    galleryImages: [],
  },
];

export const localFaqs = [
  {
    id: 1,
    question: 'Are these connected to the live API?',
    answer: 'No. This preview uses local pouch videos and fake product data.',
    categoryId: 'general',
    category: {
      id: 'general',
      name: 'General',
      slug: 'general',
      description: 'General questions',
      createdAt: NOW,
      updatedAt: NOW,
    },
    displayOrder: 1,
    isPublished: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function getLocalProductBySlug(slug: string) {
  return localProducts.find((product) => product.slug === slug) ?? null;
}

export function getMappedProductBySlug(slug: string) {
  const row = getLocalProductBySlug(slug);
  return row ? mapProductFromApi(row) : null;
}

export function filterLocalProducts(params: {
  page?: number;
  limit?: number;
  is_active?: boolean | string;
  isBestSeling?: boolean | number | string;
  flavor_slug?: string;
  brand_slug?: string;
  strength_slug?: string;
  price_sort?: string;
}) {
  let rows = localProducts.slice();
  const active = params.is_active;
  if (active === true || active === 'true') {
    rows = rows.filter((row) => row.is_active !== false);
  }
  const best = params.isBestSeling;
  if (best === 1 || best === '1' || best === true || best === 'true') {
    rows = rows.filter((row) => row.is_best_selling);
  }
  if (params.flavor_slug) {
    rows = rows.filter((row) => row.flavor_slug === params.flavor_slug);
  }
  if (params.brand_slug) {
    rows = rows.filter((row) => row.brand_slug === params.brand_slug);
  }
  if (params.strength_slug) {
    rows = rows.filter((row) => row.strength_slug === params.strength_slug);
  }
  if (params.price_sort === 'asc') {
    rows.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (params.price_sort === 'desc') {
    rows.sort((a, b) => Number(b.price) - Number(a.price));
  }
  return rows;
}
