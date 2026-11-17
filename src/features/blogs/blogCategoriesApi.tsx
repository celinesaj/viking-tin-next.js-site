import { api } from '@/store/api';
import type { BlogCategory } from '@/types/blogs';

export const blogCategoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBlogCategories: builder.query<BlogCategory[], void>({
      query: () => '/blog/categories',
    }),
  }),
});

export const { useGetBlogCategoriesQuery } = blogCategoriesApi;