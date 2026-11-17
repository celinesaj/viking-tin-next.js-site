import { API_BASE_URL } from '@/constants/api';
import type { Product, ProductMedia, ProductsResponse } from '@/types/products';

/** Row as returned by GET/POST /products (Nest often uses snake_case) */
export type ProductApiMediaRow = {
  id?: string;
  mediaType?: 'image' | 'video';
  media_type?: 'image' | 'video';
  url?: string | null;
  sortOrder?: number;
  sort_order?: number;
  createdAt?: string | null;
  created_at?: string | null;
};

export type ProductApiRow = {
  id?: string | number;
  brandId?: string;
  brand_id?: string | number;
  flavorId?: string;
  flavor_id?: string | number;
  strengthId?: string;
  strength_id?: string | number;
  name: string;
  slug?: string;
  nicotineMg?: string | number;
  nicotine_mg?: string | number;
  price?: string | number;
  comparePrice?: string | number | null;
  compare_price?: string | number | null;

  offer_price?: string | number | null;
  offer_percentage?: string | number | null;
  offer_discount_amount?: string | number | null;

  stock?: number;
  description?: string | null;
  pouchCount?: number;
  pouch_count?: number;
  weightGrams?: number;
  weight_grams?: number;
  manufacturer?: string | null;
  meta_title?: string | null;
  metaTitle?: string | null;
  meta_description?: string | null;
  metaDescription?: string | null;
  hook?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  isBestSelling?: boolean;
  is_best_selling?: boolean;
  best_selling?: boolean;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  media?: ProductApiMediaRow[] | null;
  brandName?: string | null;
  brand_name?: string | null;
  flavorName?: string | null;
  flavor_name?: string | null;
  strengthName?: string | null;
  strength_name?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  coverImage?: string | null;
  /** Some GET /products responses expose resolved URLs as camelCase */
  coverImageUrl?: string | null;
  cover_gif?: string | null;
  cover_gif_url?: string | null;
  coverGif?: string | null;
  coverGifUrl?: string | null;

};

export type ProductsApiResponse = {
  data: ProductApiRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages?: number;
    totalPages?: number;
  };
};

function normalizeImageSource(src: string | null | undefined): string | null {
  if (src == null) return null;
  const s = String(src).trim();
  if (s === '' || s.toUpperCase() === 'NULL') return null;
  return s;
}

function resolvePublicFileUrl(src: string | null | undefined): string | null {
  const s = normalizeImageSource(src);
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/${s}`;
}

function strId(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

function toPriceString(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return '0';
  return String(v);
}

export function mapProductMediaFromApi(row: ProductApiMediaRow): ProductMedia {
  const type = row.mediaType ?? row.media_type ?? 'image';
  const rawUrl = row.url ?? '';
  return {
    id: row.id ?? '',
    mediaType: type === 'video' ? 'video' : 'image',
    url: resolvePublicFileUrl(rawUrl) ?? '',
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

export function mapProductFromApi(row: ProductApiRow): Product {
  const brandId = strId(row.brandId ?? row.brand_id);
  const flavorId = strId(row.flavorId ?? row.flavor_id);
  const strengthId = strId(row.strengthId ?? row.strength_id);
  const nicotineRaw = row.nicotineMg ?? row.nicotine_mg ?? 0;
  const compareRaw = row.comparePrice ?? row.compare_price;

  return {
    id: strId(row.id),
    brandId,
    flavorId,
    strengthId,
    brandName: row.brandName ?? row.brand_name ?? null,
    flavorName: row.flavorName ?? row.flavor_name ?? null,
    strengthName: row.strengthName ?? row.strength_name ?? null,
    name: row.name ?? '',
    slug: row.slug ?? '',
    nicotineMg: toPriceString(nicotineRaw),

    price: toPriceString(row.price ?? 0),
    comparePrice:
      compareRaw === undefined || compareRaw === null
        ? null
        : toPriceString(compareRaw),

    // ✅ ADD THESE THREE LINES (THIS IS THE FIX)
    offer_price:
      row.offer_price === undefined || row.offer_price === null
        ? null
        : toPriceString(row.offer_price),

    offer_percentage:
      row.offer_percentage === undefined ||
      row.offer_percentage === null ||
      String(row.offer_percentage).trim() === ''
        ? null
        : Number(row.offer_percentage),

    offer_discount_amount:
      row.offer_discount_amount === undefined ||
      row.offer_discount_amount === null
        ? null
        : toPriceString(row.offer_discount_amount),

    stock: row.stock ?? 0,
    description: row.description ?? '',
    pouchCount: row.pouchCount ?? row.pouch_count ?? 0,
    weightGrams: row.weightGrams ?? row.weight_grams ?? 0,
    manufacturer: row.manufacturer ?? '',
    metaTitle: row.metaTitle ?? row.meta_title ?? null,
    metaDescription: row.metaDescription ?? row.meta_description ?? null,
    hook: row.hook ?? null,
    isActive: row.isActive ?? row.is_active ?? false,
    isBestSelling:
      row.isBestSelling ?? row.is_best_selling ?? row.best_selling ?? false,

    
    coverImageUrl:
      resolvePublicFileUrl(
        row.coverImageUrl ??
          row.cover_image_url ??
          row.coverImage ??
          row.cover_image ??
          null,
      ) ?? null,
    coverGifUrl:
      resolvePublicFileUrl(
        row.coverGifUrl ??
          row.cover_gif_url ??
          row.coverGif ??
          row.cover_gif ??
          null,
      ) ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    media: (row.media ?? []).map(mapProductMediaFromApi),
  };
}

export function mapProductsResponse(raw: unknown): ProductsResponse {
  const r = raw as ProductsApiResponse;
  const pagination = r.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };
  return {
    data: (r.data ?? []).map(mapProductFromApi),
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      total: pagination.total ?? 0,
      totalPages: pagination.totalPages ?? pagination.total_pages ?? 1,
    },
  };
}
