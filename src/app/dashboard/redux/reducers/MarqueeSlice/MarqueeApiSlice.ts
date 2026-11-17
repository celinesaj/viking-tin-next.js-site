import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import { mapMarqueeListResponse } from '@/features/marquee/marqueeMaps';
import type { MarqueeItem } from '@/types/marquee';

export type GetDashboardMarquesArgs = {
  /** GET /marque?active=… — omit for all rows */
  active?: 'true' | 'false';
};

export type CreateDashboardMarqueBody = {
  text: string;
  is_active: boolean;
};

export type UpdateDashboardMarqueBody = {
  id: string;
  text?: string;
  is_active?: boolean;
};

export const marqueeAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMarques: builder.query<MarqueeItem[], GetDashboardMarquesArgs>({
      query: ({ active }) => ({
        url: '/marque',
        method: 'GET',
        ...(active !== undefined ? { params: { active } } : {}),
      }),
      transformResponse: (response: unknown) => mapMarqueeListResponse(response),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((m) => ({ type: 'Marquee' as const, id: m.id })),
              { type: 'Marquee' as const, id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Marquee' as const, id: 'ADMIN_LIST' }],
    }),
    createDashboardMarque: builder.mutation<unknown, CreateDashboardMarqueBody>({
      query: (body) => ({
        url: '/marque',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Marquee' }],
    }),
    updateDashboardMarque: builder.mutation<unknown, UpdateDashboardMarqueBody>({
      query: ({ id, ...patch }) => {
        const body: Record<string, unknown> = {};
        if (patch.text !== undefined) body.text = patch.text;
        if (patch.is_active !== undefined) body.is_active = patch.is_active;
        return {
          url: `/marque/${id}`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Marquee', id }, { type: 'Marquee' }],
    }),
    deleteDashboardMarque: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/marque/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Marquee', id }, { type: 'Marquee' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardMarquesQuery,
  useCreateDashboardMarqueMutation,
  useUpdateDashboardMarqueMutation,
  useDeleteDashboardMarqueMutation,
} = marqueeAdminApiSlice;
