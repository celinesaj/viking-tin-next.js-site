import { API_BASE_URL } from '@/constants/api';
import type {
  Bundle,
  BundleGalleryImage,
  BundleLineProduct,
  BundleProductLine,
  BundlesResponse,
} from '@/types/bundles';

export type BundleApiNestedProduct = {
  id?: string;
  name?: string;
  slug?: string;
  price?: string | number;
};

export type BundleApiProductLine = {
  id?: string;
  product?: BundleApiNestedProduct;
  quantity?: number;
};

export type BundleApiGalleryRow = {
  id?: string;
  url?: string | null;
  sortOrder?: number;
  sort_order?: number;
  createdAt?: string | null;
  created_at?: string | null;
};

export type BundleApiRow = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  price?: string | number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  products?: BundleApiProductLine[] | null;
  galleryImages?: BundleApiGalleryRow[] | null;
  gallery_images?: BundleApiGalleryRow[] | null;
  originTotal?: string | number;
  origin_total?: string | number;
  message?: string;
};

export type BundlesApiResponse = {
  data: BundleApiRow[];
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

function resolvePublicFileUrl(src: string | null | undefined): string {
  const s = normalizeImageSource(src);
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/${s}`;
}

function toPriceString(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return '0';
  return String(v);
}

function mapNestedProduct(p: BundleApiNestedProduct | undefined): BundleLineProduct {
  const priceRaw = p?.price;
  return {
    id: p?.id != null ? String(p.id) : '',
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    ...(priceRaw !== undefined ? { price: toPriceString(priceRaw) } : {}),
  };
}

function mapBundleProductLine(row: BundleApiProductLine): BundleProductLine {
  return {
    id: row.id != null ? String(row.id) : '',
    product: mapNestedProduct(row.product),
    quantity: row.quantity ?? 0,
  };
}

function mapGalleryFromApi(row: BundleApiGalleryRow): BundleGalleryImage {
  return {
    id: row.id != null ? String(row.id) : '',
    url: resolvePublicFileUrl(row.url ?? ''),
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
    createdAt: row.createdAt ?? row.created_at ?? null,
  };
}

function apiMessageFromRow(row: BundleApiRow): string | undefined {
  const msg = row.message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return undefined;
}

export function mapBundleFromApi(row: BundleApiRow): Bundle {
  const gallery = row.galleryImages ?? row.gallery_images ?? [];
  const origin = row.originTotal ?? row.origin_total ?? 0;
  const apiMessage = apiMessageFromRow(row);

  return {
    id: String(row.id),
    name: row.name ?? '',
    slug: row.slug ?? '',
    description: row.description ?? '',
    imageUrl: resolvePublicFileUrl(row.imageUrl ?? row.image_url),
    price: toPriceString(row.price ?? 0),
    originTotal: toPriceString(origin),
    isActive: row.isActive ?? row.is_active ?? false,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    products: (row.products ?? []).map(mapBundleProductLine),
    galleryImages: gallery.map(mapGalleryFromApi),
    ...(apiMessage ? { apiMessage } : {}),
  };
}

export function mapBundlesResponse(raw: unknown): BundlesResponse {
  const r = raw as BundlesApiResponse;
  const pagination = r.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };
  return {
    data: (r.data ?? []).map(mapBundleFromApi),
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      total: pagination.total ?? 0,
      totalPages: pagination.totalPages ?? pagination.total_pages ?? 1,
    },
  };
}
