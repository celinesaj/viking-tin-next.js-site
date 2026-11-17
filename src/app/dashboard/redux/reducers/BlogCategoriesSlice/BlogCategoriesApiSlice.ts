import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { BlogCategory } from '@/types/blog';

export type CreateDashboardBlogCategoryBody = {
  name: string;
  slug?: string;
  description?: string;
};

export type UpdateDashboardBlogCategoryRequest = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
};

export const blogCategoriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardBlogCategories: builder.query<BlogCategory[], void>({
      query: () => ({ url: '/blog/categories', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'BlogCategory' as const, id: c.id })),
              { type: 'BlogCategory' as const, id: 'LIST' },
            ]
          : [{ type: 'BlogCategory' as const, id: 'LIST' }],
    }),
    createDashboardBlogCategory: builder.mutation<BlogCategory, CreateDashboardBlogCategoryBody>({
      query: (body) => ({
        url: '/blog/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BlogCategory', id: 'LIST' }],
    }),
    updateDashboardBlogCategory: builder.mutation<BlogCategory, UpdateDashboardBlogCategoryRequest>({
      query: ({ id, name, slug, description }) => {
        const body: Record<string, string> = { name };
        if (slug !== undefined && slug !== '') body.slug = slug;
        if (description !== undefined && description !== '') body.description = description;
        return {
          url: `/blog/categories/${id}`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'BlogCategory', id },
        { type: 'BlogCategory', id: 'LIST' },
      ],
    }),
    deleteDashboardBlogCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/blog/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'BlogCategory', id },
        { type: 'BlogCategory', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardBlogCategoriesQuery,
  useCreateDashboardBlogCategoryMutation,
  useUpdateDashboardBlogCategoryMutation,
  useDeleteDashboardBlogCategoryMutation,
} = blogCategoriesApiSlice;
