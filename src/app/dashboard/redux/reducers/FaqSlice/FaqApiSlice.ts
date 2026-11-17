import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { FaqItem, FaqResponse } from '@/types/faq';

export type GetDashboardFaqParams = {
  page?: number;
  limit?: number;
  is_published?: boolean;
  category_id?: string;
};

export type CreateDashboardFaqBody = {
  question: string;
  answer: string;
  category_id: number;
  display_order?: number;
  is_published?: boolean;
};

export type UpdateDashboardFaqRequest = {
  id: string;
  question: string;
  answer: string;
  category_id: number;
  display_order?: number;
  is_published?: boolean;
};

export const faqApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardFaq: builder.query<FaqResponse, GetDashboardFaqParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(params?.page ?? 1));
        searchParams.set('limit', String(params?.limit ?? 20));
        if (typeof params?.is_published === 'boolean') {
          searchParams.set('is_published', String(params.is_published));
        }
        if (params?.category_id && params.category_id.trim() !== '') {
          searchParams.set('category_id', params.category_id);
        }
        return { url: `/faq?${searchParams.toString()}`, method: 'GET' };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((item) => ({ type: 'FaqEntry' as const, id: String(item.id) })),
              { type: 'FaqEntry' as const, id: 'LIST' },
            ]
          : [{ type: 'FaqEntry' as const, id: 'LIST' }],
    }),
    createDashboardFaq: builder.mutation<FaqItem, CreateDashboardFaqBody>({
      query: (body) => ({
        url: '/faq',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'FaqEntry', id: 'LIST' }],
    }),
    updateDashboardFaq: builder.mutation<FaqItem, UpdateDashboardFaqRequest>({
      query: ({ id, ...body }) => ({
        url: `/faq/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'FaqEntry', id },
        { type: 'FaqEntry', id: 'LIST' },
      ],
    }),
    deleteDashboardFaq: builder.mutation<void, string>({
      query: (id) => ({
        url: `/faq/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'FaqEntry', id },
        { type: 'FaqEntry', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardFaqQuery,
  useCreateDashboardFaqMutation,
  useUpdateDashboardFaqMutation,
  useDeleteDashboardFaqMutation,
} = faqApiSlice;
