import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { HeroBanner } from '@/types/hero';
import {
  mapHeroBannersListResponse,
  type HeroBannersPaginatedApiResponse,
} from '@/features/hero/heroBannerApiMaps';

/** Matches POST /hero-banners multipart (OpenAPI): image is required */
export type CreateDashboardHeroBannerPayload = {
  headline: string;
  subheadline: string;
  image: File;
  position: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

/** Matches PATCH /hero-banners/{id} multipart — only include fields you send */
export type UpdateDashboardHeroBannerPayload = {
  id: string;
  headline?: string;
  subheadline?: string;
  position?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
  image?: File;
};

function appendIfDefined(fd: FormData, key: string, value: string | undefined) {
  if (value !== undefined) fd.append(key, value);
}

function buildCreateFormData(body: CreateDashboardHeroBannerPayload): FormData {
  const fd = new FormData();
  fd.append('headline', body.headline);
  fd.append('subheadline', body.subheadline);
  fd.append('image', body.image);
  fd.append('position', String(body.position));
  if (body.start_date) fd.append('start_date', body.start_date);
  if (body.end_date) fd.append('end_date', body.end_date);
  fd.append('is_active', body.is_active ? 'true' : 'false');
  return fd;
}

function buildPatchFormData(patch: Omit<UpdateDashboardHeroBannerPayload, 'id'>): FormData {
  const fd = new FormData();
  appendIfDefined(fd, 'headline', patch.headline);
  appendIfDefined(fd, 'subheadline', patch.subheadline);
  if (patch.position !== undefined) fd.append('position', String(patch.position));
  if (patch.start_date !== undefined) {
    fd.append('start_date', patch.start_date ?? '');
  }
  if (patch.end_date !== undefined) {
    fd.append('end_date', patch.end_date ?? '');
  }
  if (patch.is_active !== undefined) {
    fd.append('is_active', patch.is_active ? 'true' : 'false');
  }
  if (patch.image) fd.append('image', patch.image);
  return fd;
}

export const heroBannersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardHeroBanners: builder.query<HeroBanner[], void>({
      query: () => ({
        url: '/hero-banners',
        params: {
          page: 1,
          limit: 200,
        },
      }),
      transformResponse: (response: HeroBannersPaginatedApiResponse) =>
        mapHeroBannersListResponse(response),
      providesTags: (result) =>
        result
          ? [
              ...result.map((banner) => ({ type: 'HeroBanner' as const, id: banner.id })),
              { type: 'HeroBanner' as const, id: 'LIST' },
            ]
          : [{ type: 'HeroBanner' as const, id: 'LIST' }],
    }),
    createDashboardHeroBanner: builder.mutation<void, CreateDashboardHeroBannerPayload>({
      query: (body) => ({
        url: '/hero-banners',
        method: 'POST',
        body: buildCreateFormData(body),
      }),
      invalidatesTags: [{ type: 'HeroBanner', id: 'LIST' }],
    }),
    updateDashboardHeroBanner: builder.mutation<void, UpdateDashboardHeroBannerPayload>({
      query: ({ id, ...patch }) => ({
        url: `/hero-banners/${id}`,
        method: 'PATCH',
        body: buildPatchFormData(patch),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HeroBanner', id },
        { type: 'HeroBanner', id: 'LIST' },
      ],
    }),
    softDeleteDashboardHeroBanner: builder.mutation<void, string>({
      query: (id) => ({
        url: `/hero-banners/${id}/soft-delete`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HeroBanner', id },
        { type: 'HeroBanner', id: 'LIST' },
      ],
    }),
    deleteDashboardHeroBanner: builder.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/hero-banners/${id}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true } as const),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HeroBanner', id },
        { type: 'HeroBanner', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardHeroBannersQuery,
  useCreateDashboardHeroBannerMutation,
  useUpdateDashboardHeroBannerMutation,
  useSoftDeleteDashboardHeroBannerMutation,
  useDeleteDashboardHeroBannerMutation,
} = heroBannersApiSlice;
