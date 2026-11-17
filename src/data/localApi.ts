import type { FetchArgs } from '@reduxjs/toolkit/query';
import { mapProductFromApi } from '@/features/products/productApiMaps';
import {
  filterLocalProducts,
  getLocalProductBySlug,
  localBlogs,
  localBrands,
  localBundles,
  localFaqs,
  localFlavors,
  localHeroBanners,
  localMarquee,
  localPages,
  localProducts,
  localSpecialOffers,
  localStrengths,
  localTestimonials,
} from '@/data/localCatalog';

type LocalResult =
  | { data: unknown }
  | { error: { status: number; data: unknown } };

function asNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function pageOf<T>(items: T[], page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const totalPages = Math.max(1, Math.ceil(items.length / limit));
  return {
    data: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages,
      total_pages: totalPages,
    },
  };
}

function readParams(arg: string | FetchArgs) {
  const url = typeof arg === 'string' ? arg : arg.url;
  const [path, query = ''] = url.split('?');
  const search = new URLSearchParams(query);
  const extra =
    typeof arg === 'string' || !arg.params
      ? {}
      : (arg.params as Record<string, unknown>);
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  return { path, search, method: (typeof arg === 'string' ? 'GET' : arg.method ?? 'GET').toUpperCase() };
}

function emptyPage(search: URLSearchParams, limit = 20) {
  return pageOf([], asNumber(search.get('page'), 1), asNumber(search.get('limit'), limit));
}

export function resolveLocalApi(arg: string | FetchArgs): LocalResult {
  const { path, search, method } = readParams(arg);

  if (method !== 'GET' && method !== 'HEAD') {
    if (path === '/auth/admin/login' || path === '/auth/admin/refresh') {
      return {
        data: {
          admin: {
            id: 'local-admin',
            first_name: 'Local',
            last_name: 'Admin',
            email: 'admin@vikingtin.local',
            role: 'admin',
          },
          access_token: 'local-admin-access',
          refresh_token: 'local-admin-refresh',
        },
      };
    }
    if (path === '/api/auth/login') {
      return {
        data: {
          success: true,
          user: {
            id: 'local-user',
            first_name: 'Local',
            last_name: 'Preview',
            email: 'preview@vikingtin.local',
          },
          message: 'Signed in with local preview data.',
        },
      };
    }
    if (path === '/api/auth/logout' || path === '/api/auth/refresh') {
      return { data: { success: true, message: 'Local preview only.' } };
    }
    if (path === '/api/checkout') {
      return {
        data: {
          orderId: 'local-order-1',
          message: 'Order stored locally. No payment API was called.',
        },
      };
    }
    return { data: { message: 'Saved locally. The remote API is not used.' } };
  }

  if (path === '/api/auth/me') {
    return { error: { status: 401, data: { message: 'Not signed in.' } } };
  }

  if (path === '/api/freebies/catalog') {
    return { data: { eligible: false, max_free_items: 0, products: [] } };
  }

  if (path === '/api/freebies/max-items') {
    return { data: { max_free_items: 0, is_active: false } };
  }

  if (path === '/api/coupons/available') {
    return { data: [] };
  }

  if (path.startsWith('/api/coupons/validate')) {
    return { data: { valid: false, message: 'Coupons are offline in this preview.' } };
  }

  if (path.startsWith('/api/account/orders')) {
    return emptyPage(search);
  }

  if (path === '/brands' || path.startsWith('/brands?')) {
    return { data: localBrands };
  }

  const brandSlug = path.match(/^\/brands\/slug\/([^/]+)$/);
  if (brandSlug) {
    return { data: localBrands.find((brand) => brand.slug === brandSlug[1]) ?? localBrands[0] };
  }

  if (path === '/products') {
    const rows = filterLocalProducts({
      page: asNumber(search.get('page'), 1),
      limit: asNumber(search.get('limit'), 20),
      is_active: search.get('is_active') ?? undefined,
      isBestSeling: search.get('isBestSeling') ?? undefined,
      flavor_slug: search.get('flavor_slug') ?? undefined,
      brand_slug: search.get('brand_slug') ?? undefined,
      strength_slug: search.get('strength_slug') ?? undefined,
      price_sort: search.get('price_sort') ?? undefined,
    });
    return {
      data: pageOf(rows, asNumber(search.get('page'), 1), asNumber(search.get('limit'), 20)),
    };
  }

  const productSlug = path.match(/^\/products\/slug\/([^/]+)$/);
  if (productSlug) {
    const row = getLocalProductBySlug(decodeURIComponent(productSlug[1]));
    return row
      ? { data: row }
      : { error: { status: 404, data: { message: 'Product not found' } } };
  }

  const whyChoose = path.match(/^\/products\/([^/]+)\/why-choose$/);
  if (whyChoose) {
    const product = localProducts.find((row) => String(row.id) === whyChoose[1]);
    return {
      data: [
        {
          id: `${whyChoose[1]}-why-1`,
          product_id: whyChoose[1],
          reason: product ? `${product.name} uses a local pouch video.` : 'Local preview product.',
          sort_order: 1,
          is_active: true,
          created_at: '2026-01-15T00:00:00.000Z',
        },
      ],
    };
  }

  if (path === '/flavors') {
    return {
      data: pageOf(localFlavors, asNumber(search.get('page'), 1), asNumber(search.get('limit'), 20)),
    };
  }

  const flavorSlug = path.match(/^\/flavors\/slug\/([^/]+)$/);
  if (flavorSlug) {
    return {
      data:
        localFlavors.find((flavor) => flavor.slug === flavorSlug[1]) ?? localFlavors[0],
    };
  }

  if (path === '/strength-levels') {
    return {
      data: pageOf(localStrengths, asNumber(search.get('page'), 1), asNumber(search.get('limit'), 20)),
    };
  }

  if (path === '/hero-banners') {
    return { data: pageOf(localHeroBanners, 1, 50) };
  }

  if (path === '/marque') {
    return { data: localMarquee };
  }

  if (path === '/bundles') {
    return {
      data: pageOf(localBundles, asNumber(search.get('page'), 1), asNumber(search.get('limit'), 10)),
    };
  }

  const bundleSlug = path.match(/^\/bundles\/slug\/([^/]+)$/);
  if (bundleSlug) {
    return {
      data: localBundles.find((bundle) => bundle.slug === bundleSlug[1]) ?? localBundles[0],
    };
  }

  if (path === '/special-offers') {
    return {
      data: pageOf(
        localSpecialOffers,
        asNumber(search.get('page'), 1),
        asNumber(search.get('limit'), 10),
      ),
    };
  }

  const offerSlug = path.match(/^\/special-offers\/slug\/([^/]+)$/);
  if (offerSlug) {
    return {
      data:
        localSpecialOffers.find((offer) => offer.slug === offerSlug[1]) ??
        localSpecialOffers[0],
    };
  }

  if (path === '/blog/posts') {
    return {
      data: pageOf(localBlogs, asNumber(search.get('page'), 1), asNumber(search.get('limit'), 20)),
    };
  }

  const blogSlug = path.match(/^\/blog\/posts\/slug\/([^/]+)$/);
  if (blogSlug) {
    return {
      data: localBlogs.find((post) => post.slug === blogSlug[1]) ?? localBlogs[0],
    };
  }

  if (path === '/blog/categories') {
    return {
      data: pageOf(
        [{ id: 'news', name: 'News', slug: 'news', description: null }],
        1,
        20,
      ),
    };
  }

  if (path === '/testimonials') {
    return {
      data: pageOf(
        localTestimonials,
        asNumber(search.get('page'), 1),
        asNumber(search.get('limit'), 20),
      ),
    };
  }

  if (path === '/pages') {
    return { data: pageOf(localPages, 1, 20) };
  }

  const pageSlug = path.match(/^\/pages\/slug\/([^/]+)$/);
  if (pageSlug) {
    return {
      data: localPages.find((page) => page.slug === pageSlug[1]) ?? null,
    };
  }

  if (path === '/faq' || path.startsWith('/faq/')) {
    return {
      data: pageOf(localFaqs, asNumber(search.get('page'), 1), asNumber(search.get('limit'), 20)),
    };
  }

  if (path === '/related-items') {
    const sourceId = search.get('source_id');
    const related = localProducts
      .filter((product) => String(product.id) !== sourceId)
      .slice(0, 4)
      .map((product, index) => ({
        id: `rel-${product.id}`,
        sourceType: search.get('source_type') ?? 'product',
        sourceId: sourceId ?? '',
        relatedType: 'product',
        relatedId: String(product.id),
        sortOrder: index,
        createdAt: null,
        related: mapProductFromApi(product),
      }));
    return { data: related };
  }

  if (path.startsWith('/product-reviews')) {
    return {
      data: {
        itemName: 'Local pouch',
        itemType: search.get('itemType') ?? 'product',
        itemId: search.get('itemId') ?? '',
        reviews: [
          {
            id: 'review-1',
            productId: search.get('itemId'),
            userId: null,
            rating: 5,
            title: 'Clean flavor',
            comment: 'Local preview review. Nothing was sent to the API.',
            isApproved: true,
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: null,
            itemType: search.get('itemType') ?? 'product',
            itemId: search.get('itemId'),
            userName: 'Local customer',
          },
        ],
      },
    };
  }

  if (path === '/search' || path === '/dashboard/search') {
    const q = (search.get('q') ?? '').toLowerCase();
    const products = localProducts
      .filter((product) => !q || product.name.toLowerCase().includes(q))
      .slice(0, asNumber(search.get('limit'), 20))
      .map((product) => ({
        id: String(product.id),
        name: product.name,
        slug: product.slug ?? '',
        price: String(product.price ?? 0),
        image_url: product.cover_gif_url ?? null,
      }));
    return { data: { products, bundles: [], special_offers: [] } };
  }

  if (path === '/contact-info') {
    return {
      data: pageOf(
        [
          {
            id: 'phone',
            type: 'phone',
            title: 'Phone',
            value: '+971 50 000 0000',
            sortOrder: 1,
            createdAt: '2026-01-15T00:00:00.000Z',
            updatedAt: '2026-01-15T00:00:00.000Z',
          },
        ],
        1,
        20,
      ),
    };
  }

  if (path === '/contact-social-links') {
    return { data: emptyPage(search) };
  }

  if (path === '/point-of-sale') {
    return {
      data: pageOf(
        [
          {
            id: 'pos-1',
            title: 'Viking Tin Dubai',
            slug: 'dubai',
            imageUrl: '/images/placeholders/product.png',
            shortDescription: 'Local preview store.',
            fullAddress: 'Dubai Mall, Dubai, UAE',
            phone: '+971 50 000 0000',
            phoneSecondary: null,
            lat: '25.1972',
            lng: '55.2744',
            isActive: true,
          },
        ],
        1,
        20,
      ),
    };
  }

  if (path === '/admin/dashboard') {
    const metric = { current: 0, previous: 0, change_percent: 0 };
    return {
      data: {
        period: {
          granularity: 'month',
          current: { start: '2026-01-01', end: '2026-01-31' },
          previous: { start: '2025-12-01', end: '2025-12-31' },
        },
        summary: {
          revenue: metric,
          orders: metric,
          customers: metric,
          top_product: null,
          top_bundle: null,
          top_special_offer: null,
        },
        sales_trend: [],
      },
    };
  }

  if (path.includes('/sales')) {
    return {
      data: {
        completed_statuses: [],
        period: { from: null, to: null, start: '', end: '' },
        products: [],
        bundles: [],
        special_offers: [],
      },
    };
  }

  return { data: emptyPage(search) };
}
