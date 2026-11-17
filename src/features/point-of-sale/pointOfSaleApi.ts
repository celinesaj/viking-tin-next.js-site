// src/features/point-of-sale/pointOfSaleApi.ts
import { api } from '@/store/api';
import type {
  PointOfSaleListResponse,
  PointOfSaleListResponseApi,
  PointOfSaleLocation,
} from '@/types/pointsOfSale';

type GetPointOfSaleParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

function extractCity(fullAddress?: string | null): string {
  if (!fullAddress) return '';
  const parts = fullAddress.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return parts[0] ?? '';
}

function mapPointOfSale(item: PointOfSaleListResponseApi['data'][number]): PointOfSaleLocation {
  return {
    id: item.id,
    name: item.title,
    slug: item.slug,
    imageUrl: item.imageUrl || '/images/placeholder.png',
    shortDescription: item.shortDescription || '',
    fullAddress: item.fullAddress || '',
    city: extractCity(item.fullAddress),
    phone: item.phone || undefined,
    phoneSecondary: item.phoneSecondary || undefined,
    latitude: Number(item.lat) || 0,
    longitude: Number(item.lng) || 0,
    isActive: item.isActive,
  };
}

export const pointOfSaleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPointOfSaleLocations: builder.query<
      PointOfSaleListResponse,
      GetPointOfSaleParams | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.page) {
          searchParams.append('page', String(params.page));
        }

        if (params?.limit) {
          searchParams.append('limit', String(params.limit));
        }

        if (typeof params?.is_active === 'boolean') {
          searchParams.append('is_active', String(params.is_active));
        }

        const queryString = searchParams.toString();

        return `/point-of-sale${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: PointOfSaleListResponseApi): PointOfSaleListResponse => {
        return {
          data: response.data.map(mapPointOfSale),
          pagination: response.pagination,
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetPointOfSaleLocationsQuery } = pointOfSaleApi;