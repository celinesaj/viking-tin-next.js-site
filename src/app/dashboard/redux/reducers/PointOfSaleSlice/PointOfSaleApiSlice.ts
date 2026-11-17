import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';

export type DashboardPointOfSale = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  lat: string;
  lng: string;
  phone: string;
  email: string;
  mapEmbeddedUrl: string;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  zoneId: string;
  shortDescription: string;
  fullAddress: string;
  phoneSecondary: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type DashboardPointOfSaleListResponse = {
  data: DashboardPointOfSale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type GetDashboardPointsOfSaleParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

type PointOfSaleWriteFields = {
  title?: string;
  slug?: string;
  lat?: string;
  lng?: string;
  phone?: string;
  email?: string;
  map_embedded_url?: string;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
  zone_id?: number;
  short_description?: string;
  full_address?: string;
  phone_secondary?: string;
  image?: File;
};

export type CreateDashboardPointOfSalePayload = Required<
  Omit<PointOfSaleWriteFields, 'image' | 'zone_id' | 'is_active'>
> & {
  image: File;
  zone_id: number;
  is_active: boolean;
};
export type UpdateDashboardPointOfSalePayload = { id: string } & PointOfSaleWriteFields;

function appendPointOfSaleWriteFields(fd: FormData, body: PointOfSaleWriteFields) {
  if (body.title !== undefined) fd.append('title', body.title);
  if (body.slug !== undefined) fd.append('slug', body.slug);
  if (body.lat !== undefined) fd.append('lat', body.lat);
  if (body.lng !== undefined) fd.append('lng', body.lng);
  if (body.phone !== undefined) fd.append('phone', body.phone);
  if (body.email !== undefined) fd.append('email', body.email);
  if (body.map_embedded_url !== undefined) fd.append('map_embedded_url', body.map_embedded_url);
  if (body.is_active !== undefined) fd.append('is_active', body.is_active ? 'true' : 'false');
  if (body.meta_title !== undefined) fd.append('meta_title', body.meta_title);
  if (body.meta_description !== undefined) fd.append('meta_description', body.meta_description);
  if (body.zone_id !== undefined) fd.append('zone_id', String(body.zone_id));
  if (body.short_description !== undefined) fd.append('short_description', body.short_description);
  if (body.full_address !== undefined) fd.append('full_address', body.full_address);
  if (body.phone_secondary !== undefined) fd.append('phone_secondary', body.phone_secondary);
  if (body.image) fd.append('image', body.image);
}

export const pointOfSaleApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardPointsOfSale: builder.query<
      DashboardPointOfSaleListResponse,
      GetDashboardPointsOfSaleParams
    >({
      query: ({ page = 1, limit = 20, is_active } = {}) => ({
        url: '/point-of-sale',
        method: 'GET',
        params: {
          page: String(page),
          limit: String(limit),
          ...(typeof is_active === 'boolean' ? { is_active: String(is_active) } : {}),
        },
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'PointOfSale' as const, id: item.id })),
              { type: 'PointOfSale' as const, id: 'LIST' },
            ]
          : [{ type: 'PointOfSale' as const, id: 'LIST' }],
    }),
    createDashboardPointOfSale: builder.mutation<
      DashboardPointOfSale,
      CreateDashboardPointOfSalePayload
    >({
      query: (body) => {
        const fd = new FormData();
        appendPointOfSaleWriteFields(fd, body);
        return {
          url: '/point-of-sale',
          method: 'POST',
          body: fd,
        };
      },
      invalidatesTags: [{ type: 'PointOfSale' as const, id: 'LIST' }],
    }),
    updateDashboardPointOfSale: builder.mutation<
      DashboardPointOfSale,
      UpdateDashboardPointOfSalePayload
    >({
      query: ({ id, ...body }) => {
        const fd = new FormData();
        appendPointOfSaleWriteFields(fd, body);
        return {
          url: `/point-of-sale/${id}`,
          method: 'PATCH',
          body: fd,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PointOfSale' as const, id },
        { type: 'PointOfSale' as const, id: 'LIST' },
      ],
    }),
    deleteDashboardPointOfSale: builder.mutation<void, string>({
      query: (id) => ({
        url: `/point-of-sale/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'PointOfSale' as const, id },
        { type: 'PointOfSale' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardPointsOfSaleQuery,
  useCreateDashboardPointOfSaleMutation,
  useUpdateDashboardPointOfSaleMutation,
  useDeleteDashboardPointOfSaleMutation,
} = pointOfSaleApiSlice;
