import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { BlogPostsListResponse } from '@/types/blog';

export type GetDashboardBlogPostsParams = {
  page?: number;
  limit?: number;
  category_id?: string;
  /** When true, list published posts only (if the API supports the query param). */
  is_published?: boolean;
};

export type BlogPostWriteFields = {
  categoryId: string;
  title: string;
  slug?: string;
  featured_image?: File;
  featuredImage?: string;
  featuredImageAlt?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
};

export type CreateDashboardBlogPostPayload = BlogPostWriteFields;

export type UpdateDashboardBlogPostPayload = { id: string } & BlogPostWriteFields;

function appendBlogPostFormFields(fd: FormData, body: BlogPostWriteFields) {
  fd.append('categoryId', body.categoryId);
  fd.append('title', body.title);
  if (body.slug !== undefined && body.slug.trim() !== '') fd.append('slug', body.slug.trim());
  if (body.featured_image) {
    fd.append('featured_image', body.featured_image);
  } else if (body.featuredImage !== undefined && body.featuredImage.trim() !== '') {
    fd.append('featuredImage', body.featuredImage.trim());
  }
  if (body.featuredImageAlt !== undefined && body.featuredImageAlt.trim() !== '') {
    fd.append('featuredImageAlt', body.featuredImageAlt.trim());
  }
  if (body.content !== undefined && body.content !== '') fd.append('content', body.content);
  if (body.author !== undefined && body.author !== '') fd.append('author', body.author);
  if (body.publishedAt !== undefined && body.publishedAt.trim() !== '') {
    fd.append('publishedAt', body.publishedAt.trim());
  }
  fd.append('isPublished', body.isPublished ? 'true' : 'false');
  if (body.metaTitle !== undefined && body.metaTitle.trim() !== '') {
    fd.append('meta_title', body.metaTitle.trim());
  }
  if (body.metaDescription !== undefined && body.metaDescription.trim() !== '') {
    fd.append('meta_description', body.metaDescription.trim());
  }
}

function buildCreateBlogPostFormData(body: CreateDashboardBlogPostPayload): FormData {
  const fd = new FormData();
  appendBlogPostFormFields(fd, body);
  return fd;
}

function buildUpdateBlogPostFormData(body: Omit<UpdateDashboardBlogPostPayload, 'id'>): FormData {
  const fd = new FormData();
  appendBlogPostFormFields(fd, body);
  return fd;
}

export const blogPostsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardBlogPosts: builder.query<BlogPostsListResponse, GetDashboardBlogPostsParams>({
      query: ({ page = 1, limit = 20, category_id, is_published }) => ({
        url: '/blog/posts',
        method: 'GET',
        params: {
          page: String(page),
          limit: String(limit),
          ...(category_id ? { category_id } : {}),
          ...(typeof is_published === 'boolean'
            ? { is_published: String(is_published) }
            : {}),
        },
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((p) => ({ type: 'BlogPost' as const, id: p.id })),
              { type: 'BlogPost' as const, id: 'LIST' },
            ]
          : [{ type: 'BlogPost' as const, id: 'LIST' }],
    }),
    createDashboardBlogPost: builder.mutation<void, CreateDashboardBlogPostPayload>({
      query: (body) => ({
        url: '/blog/posts',
        method: 'POST',
        body: buildCreateBlogPostFormData(body),
      }),
      invalidatesTags: [{ type: 'BlogPost', id: 'LIST' }],
    }),
    updateDashboardBlogPost: builder.mutation<void, UpdateDashboardBlogPostPayload>({
      query: ({ id, ...body }) => ({
        url: `/blog/posts/${id}`,
        method: 'PATCH',
        body: buildUpdateBlogPostFormData(body),
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'BlogPost', id },
        { type: 'BlogPost', id: 'LIST' },
      ],
    }),
    deleteDashboardBlogPost: builder.mutation<void, string>({
      query: (id) => ({
        url: `/blog/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'BlogPost', id },
        { type: 'BlogPost', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardBlogPostsQuery,
  useCreateDashboardBlogPostMutation,
  useUpdateDashboardBlogPostMutation,
  useDeleteDashboardBlogPostMutation,
} = blogPostsApiSlice;
