import type { HeroBanner } from '@/types/hero';

type HeroBannerApiRow = Record<string, unknown>;

/**
 * GET /hero-banners may return a paginated envelope `{ data: [...] }` or a plain array.
 */
export type HeroBannersPaginatedApiResponse =
  | {
      data: HeroBannerApiRow[];
      meta?: Record<string, unknown>;
    }
  | HeroBannerApiRow[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'string') return v;
  }
  return '';
}

function readNullableString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = row[key];
    if (v === null) return null;
    if (typeof v === 'string') return v;
  }
  return null;
}

function readNumber(row: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

function readBoolean(row: Record<string, unknown>, keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === 'boolean') return v;
    if (v === 'true') return true;
    if (v === 'false') return false;
  }
  return fallback;
}

function readId(row: Record<string, unknown>): number | null {
  const v = row.id;
  if (v === undefined || v === null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function mapHeroBannerRow(row: HeroBannerApiRow): HeroBanner | null {
  if (!isRecord(row)) return null;
  const id = readId(row);
  if (id === null) return null;

  return {
    id,
    headline: readString(row, ['headline']),
    subheadline: readString(row, ['subheadline']),
    image_url: readString(row, ['image_url', 'imageUrl']),
    position: readNumber(row, ['position'], 0),
    start_date: readNullableString(row, ['start_date', 'startDate']),
    end_date: readNullableString(row, ['end_date', 'endDate']),
    is_active: readBoolean(row, ['is_active', 'isActive'], true),
    created_at: readString(row, ['created_at', 'createdAt']),
    updated_at: readString(row, ['updated_at', 'updatedAt']),
  };
}

function unwrapList(response: HeroBannersPaginatedApiResponse): HeroBannerApiRow[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord) as HeroBannerApiRow[];
  }
  if (isRecord(response) && Array.isArray(response.data)) {
    return response.data.filter(isRecord) as HeroBannerApiRow[];
  }
  return [];
}

export function mapHeroBannersListResponse(
  response: HeroBannersPaginatedApiResponse,
): HeroBanner[] {
  return unwrapList(response)
    .map(mapHeroBannerRow)
    .filter((b): b is HeroBanner => b !== null);
}
