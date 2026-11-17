import { api } from '@/store/api';
import type { BlogPostsResponse, BlogPost, BlogSortOption } from '@/types/blogs';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

function resolveImageUrl(src: string | null | undefined): string | null {
  if (!src?.trim() || src.trim().toUpperCase() === 'NULL') return null;
  const s = src.trim();
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  return `${API_BASE}/${s}`;
}

function normalizeBlogPost(post: BlogPost): BlogPost {
  return {
    ...post,
    featuredImage: resolveImageUrl(post.featuredImage),
  };
}

type GetBlogPostsParams = {
  page?: number;
  limit?: number;
  category_id?: string;
  sort?: BlogSortOption;
};

export const blogsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBlogPosts: builder.query<BlogPostsResponse, GetBlogPostsParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        const safeParams = params ?? {};

        if (safeParams.page) {
          searchParams.set('page', String(safeParams.page));
        }

        if (safeParams.limit) {
          searchParams.set('limit', String(safeParams.limit));
        }

        if (safeParams.category_id) {
          searchParams.set('category_id', safeParams.category_id);
        }

        if (safeParams.sort) {
          searchParams.set(
            'sort',
            safeParams.sort === 'oldest' ? 'oldest' : 'newest'
          );
        }

        const queryString = searchParams.toString();

        return `/blog/posts${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: BlogPostsResponse): BlogPostsResponse => ({
        ...response,
        data: (response.data ?? []).map(normalizeBlogPost),
      }),
    }),

    getBlogPostBySlug: builder.query<BlogPost, string>({
      query: (slug) => `/blog/posts/slug/${slug}`,
      transformResponse: (response: BlogPost): BlogPost => normalizeBlogPost(response),
    }),
  }),
});

export const {
  useGetBlogPostsQuery,
  useGetBlogPostBySlugQuery,
} = blogsApi;
