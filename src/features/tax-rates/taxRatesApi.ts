import { api } from '@/store/api';
import type { TaxRate, TaxRatesResponse } from '@/types/tax-rates';

export type GetTaxRatesAdminParams = {
  page?: number;
  limit?: number;
  zone_id?: string;
};

export type CreateTaxRateRequest = {
  zone_id?: number;
  name: string;
  rate: number;
  is_active: boolean;
};

export type UpdateTaxRateRequest = { id: string } & CreateTaxRateRequest;

function parseZoneNameFromNested(
  row: Record<string, unknown>,
): string | undefined {
  const zoneNested = row.zone ?? row.delivery_zone ?? row.deliveryZone;
  if (!zoneNested || typeof zoneNested !== 'object') return undefined;
  const name = (zoneNested as { name?: unknown }).name;
  return typeof name === 'string' && name.trim() ? name.trim() : undefined;
}

export function mapTaxRateFromApi(raw: unknown): TaxRate {
  const row =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const id = row.id != null ? String(row.id) : '';
  const zoneRaw = row.zone_id ?? row.zoneId;
  const rateRaw = row.rate;
  const rate =
    typeof rateRaw === 'number'
      ? rateRaw
      : typeof rateRaw === 'string'
        ? Number(rateRaw)
        : Number.NaN;

  const message = row.message;

  return {
    id,
    zoneId: zoneRaw != null ? String(zoneRaw) : '',
    zoneName: parseZoneNameFromNested(row),
    name: typeof row.name === 'string' ? row.name : String(row.name ?? ''),
    rate: Number.isFinite(rate) ? rate : 0,
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    createdAt:
      row.createdAt != null
        ? String(row.createdAt)
        : row.created_at != null
          ? String(row.created_at)
          : null,
    updatedAt:
      row.updatedAt != null
        ? String(row.updatedAt)
        : row.updated_at != null
          ? String(row.updated_at)
          : null,
    apiMessage: typeof message === 'string' ? message : undefined,
  };
}

function normalizeTaxRatesListResponse(raw: unknown): TaxRatesResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }

  const o = raw as Record<string, unknown>;
  const dataArr = Array.isArray(o.data) ? o.data : [];
  const pag = o.pagination;

  if (pag && typeof pag === 'object') {
    const p = pag as Record<string, unknown>;
    const totalPages = Math.max(1, Number(p.totalPages) || 1);

    return {
      data: dataArr.map(mapTaxRateFromApi),
      pagination: {
        page: Number(p.page) || 1,
        limit: Number(p.limit) || 10,
        total: Number(p.total) || 0,
        totalPages,
      },
    };
  }

  return {
    data: dataArr.map(mapTaxRateFromApi),
    pagination: {
      page: 1,
      limit: dataArr.length || 10,
      total: dataArr.length,
      totalPages: 1,
    },
  };
}

export function taxRateSuccessToastText(
  result: TaxRate,
  fallback: string
): string {
  const m = result.apiMessage?.trim();
  return m && m.length > 0 ? m : fallback;
}

export function buildTaxRateUpdateBodyFromRow(
  row: TaxRate,
  overrides: Partial<{ is_active: boolean }> = {}
): CreateTaxRateRequest {
  const zid = Number(row.zoneId);
  const hasZone =
    row.zoneId.trim() !== '' && Number.isFinite(zid) && !Number.isNaN(zid);

  return {
    ...(hasZone ? { zone_id: zid } : {}),
    name: row.name ?? '',
    rate: row.rate,
    is_active: overrides.is_active ?? row.isActive,
  };
}

export const taxRatesApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // =========================
    // STOREFRONT / CHECKOUT
    // =========================
    getTaxRates: builder.query<TaxRate[], void>({
      query: () => ({
        url: '/tax-rates',
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => {
        if (!Array.isArray(raw)) return [];
        return raw.map(mapTaxRateFromApi);
      },
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((row) => ({ type: 'TaxRate' as const, id: row.id })),
              { type: 'TaxRate' as const, id: 'LIST' },
            ]
          : [{ type: 'TaxRate' as const, id: 'LIST' }],
    }),

    getActiveTaxRate: builder.query<TaxRate | null, void>({
      query: () => ({
        url: '/tax-rates',
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => {
        if (!Array.isArray(raw)) return null;

        const rates = raw.map(mapTaxRateFromApi);
        return rates.find((item) => item.isActive) ?? rates[0] ?? null;
      },
      providesTags: [{ type: 'TaxRate', id: 'ACTIVE' }],
    }),

    // =========================
    // ADMIN
    // =========================
    getTaxRatesAdmin: builder.query<TaxRatesResponse, GetTaxRatesAdminParams | void>({
      query: (params) => {
        const p = params ?? {};

        return {
          url: '/tax-rates/admin',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 10,
            ...(p.zone_id !== undefined && p.zone_id !== ''
              ? { zone_id: p.zone_id }
              : {}),
          },
        };
      },
      transformResponse: (raw: unknown) => normalizeTaxRatesListResponse(raw),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({
                type: 'TaxRate' as const,
                id: row.id,
              })),
              { type: 'TaxRate' as const, id: 'LIST' },
            ]
          : [{ type: 'TaxRate' as const, id: 'LIST' }],
    }),

    getTaxRateById: builder.query<TaxRate, string>({
      query: (id) => ({
        url: `/tax-rates/${id}`,
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => mapTaxRateFromApi(raw),
      providesTags: (_result, _error, id) => [{ type: 'TaxRate', id }],
    }),

    createTaxRate: builder.mutation<TaxRate, CreateTaxRateRequest>({
      query: (body) => ({
        url: '/tax-rates',
        method: 'POST',
        body,
      }),
      transformResponse: (raw: unknown) => mapTaxRateFromApi(raw),
      invalidatesTags: [
        { type: 'TaxRate', id: 'LIST' },
        { type: 'TaxRate', id: 'ACTIVE' },
      ],
    }),

    updateTaxRate: builder.mutation<TaxRate, UpdateTaxRateRequest>({
      query: ({ id, ...body }) => ({
        url: `/tax-rates/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: unknown) => mapTaxRateFromApi(raw),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'TaxRate', id },
        { type: 'TaxRate', id: 'LIST' },
        { type: 'TaxRate', id: 'ACTIVE' },
      ],
    }),

    deleteTaxRate: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/tax-rates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'TaxRate', id },
        { type: 'TaxRate', id: 'LIST' },
        { type: 'TaxRate', id: 'ACTIVE' },
      ],
    }),
  }),
});

export const {
  useGetTaxRatesQuery,
  useGetActiveTaxRateQuery,

  useGetTaxRatesAdminQuery,
  useLazyGetTaxRatesAdminQuery,
  useGetTaxRateByIdQuery,
  useCreateTaxRateMutation,
  useUpdateTaxRateMutation,
  useDeleteTaxRateMutation,
} = taxRatesApi;