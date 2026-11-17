import {
  mapBundleFromApi,
  type BundleApiRow,
} from '@/features/bundles/bundleApiMaps';
import type { SpecialOffer, SpecialOffersResponse } from '@/types/specialOffers';

export type SpecialOfferApiRow = BundleApiRow & {
  startDate?: string | null;
  endDate?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function mapSpecialOfferFromApi(row: SpecialOfferApiRow): SpecialOffer {
  const base = mapBundleFromApi(row);
  return {
    ...base,
    startDate: row.startDate ?? row.start_date ?? null,
    endDate: row.endDate ?? row.end_date ?? null,
  };
}

export function mapSpecialOffersResponse(raw: unknown): SpecialOffersResponse {
  const r = raw as {
    data?: SpecialOfferApiRow[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages?: number;
      totalPages?: number;
    };
  };
  const pagination = r.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };
  return {
    data: (r.data ?? []).map(mapSpecialOfferFromApi),
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      total: pagination.total ?? 0,
      totalPages: pagination.totalPages ?? pagination.total_pages ?? 1,
    },
  };
}
