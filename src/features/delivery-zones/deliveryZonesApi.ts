import { api } from '@/store/api';
import type { DeliveryZone, DeliveryZoneApiRow } from '@/types/delivery-zones';

export type CreateDeliveryZoneRequest = {
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
};

export type UpdateDeliveryZoneRequest = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  is_active?: boolean;
};

function mapDeliveryZone(row: DeliveryZoneApiRow): DeliveryZone {
  return {
    id: String(row.id),
    name: row.name ?? '',
    description: row.description ?? '',
    price: String(row.price ?? ''),
    isActive: Boolean(row.isActive ?? row.is_active ?? false),
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

export const deliveryZonesApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getDeliveryZones: builder.query<DeliveryZone[], void>({
      query: () => ({
        url: '/delivery-zones',
        method: 'GET',
      }),
      transformResponse: (response: DeliveryZoneApiRow[]) =>
        (response ?? []).map(mapDeliveryZone),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((row) => ({ type: 'DeliveryZone' as const, id: row.id })),
              { type: 'DeliveryZone' as const, id: 'LIST' },
            ]
          : [{ type: 'DeliveryZone' as const, id: 'LIST' }],
    }),

    getDeliveryZoneById: builder.query<DeliveryZone, string>({
      query: (id) => ({
        url: `/delivery-zones/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: DeliveryZoneApiRow) => mapDeliveryZone(response),
      providesTags: (_result, _error, id) => [{ type: 'DeliveryZone', id }],
    }),

    createDeliveryZone: builder.mutation<DeliveryZone, CreateDeliveryZoneRequest>({
      query: (body) => ({
        url: '/delivery-zones',
        method: 'POST',
        body,
      }),
      transformResponse: (response: DeliveryZoneApiRow) => mapDeliveryZone(response),
      invalidatesTags: [{ type: 'DeliveryZone', id: 'LIST' }],
    }),

    updateDeliveryZone: builder.mutation<DeliveryZone, UpdateDeliveryZoneRequest>({
      query: ({ id, ...body }) => ({
        url: `/delivery-zones/${id}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: DeliveryZoneApiRow) => mapDeliveryZone(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DeliveryZone', id },
        { type: 'DeliveryZone', id: 'LIST' },
      ],
    }),

    deleteDeliveryZone: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/delivery-zones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DeliveryZone', id },
        { type: 'DeliveryZone', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDeliveryZonesQuery,
  useGetDeliveryZoneByIdQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
} = deliveryZonesApi;



