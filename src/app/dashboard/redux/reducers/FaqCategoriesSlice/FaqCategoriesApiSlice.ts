import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { FaqCategory } from '@/types/faq';

export type CreateDashboardFaqCategoryBody = {
  name: string;
  slug?: string;
  description?: string;
};

export type UpdateDashboardFaqCategoryRequest = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
};

export const faqCategoriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardFaqCategories: builder.query<FaqCategory[], void>({
      query: () => ({ url: '/faq/categories', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'FaqCategory' as const, id: c.id })),
              { type: 'FaqCategory' as const, id: 'LIST' },
            ]
          : [{ type: 'FaqCategory' as const, id: 'LIST' }],
    }),
    createDashboardFaqCategory: builder.mutation<FaqCategory, CreateDashboardFaqCategoryBody>({
      query: (body) => ({
        url: '/faq/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'FaqCategory', id: 'LIST' }],
    }),
    updateDashboardFaqCategory: builder.mutation<FaqCategory, UpdateDashboardFaqCategoryRequest>({
      query: ({ id, name, slug, description }) => {
        const body: Record<string, string> = { name };
        if (slug !== undefined && slug !== '') body.slug = slug;
        if (description !== undefined && description !== '') body.description = description;
        return {
          url: `/faq/categories/${id}`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'FaqCategory', id },
        { type: 'FaqCategory', id: 'LIST' },
      ],
    }),
    deleteDashboardFaqCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/faq/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'FaqCategory', id },
        { type: 'FaqCategory', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardFaqCategoriesQuery,
  useCreateDashboardFaqCategoryMutation,
  useUpdateDashboardFaqCategoryMutation,
  useDeleteDashboardFaqCategoryMutation,
} = faqCategoriesApiSlice;
