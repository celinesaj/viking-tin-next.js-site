import { API_BASE_URL } from '@/constants/api';
import type { Flavor, FlavorsResponse } from '@/types/flavour';

/** Row as returned by GET /flavors (Nest often uses snake_case) */
export type FlavorApiRow = {
  id: string | number;
  name: string;
  slug: string;
  category?: string | null;
  /** Backend GET /flavors (camelCase DTO) */
  imgUrl?: string | null;
  /** Some APIs expose the path as `image` */
  image?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
};

export type FlavorsApiResponse = {
  data: FlavorApiRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages?: number;
    totalPages?: number;
  };
};

/** API sometimes returns the literal string `"NULL"` instead of JSON null */
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

export function mapFlavorFromApi(row: FlavorApiRow): Flavor {
  const rawImage =
    row.imgUrl ?? row.imageUrl ?? row.image_url ?? row.image ?? null;
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    category: row.category ?? null,
    imgUrl: resolvePublicFileUrl(rawImage),
    isActive: row.isActive ?? row.is_active ?? false,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
  };
}

export function mapFlavorsResponse(raw: unknown): FlavorsResponse {
  const r = raw as FlavorsApiResponse;
  const pagination = r.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };
  return {
    data: (r.data ?? []).map(mapFlavorFromApi),
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      total: pagination.total ?? 0,
      totalPages: pagination.totalPages ?? pagination.total_pages ?? 1,
    },
  };
}
   //dummy