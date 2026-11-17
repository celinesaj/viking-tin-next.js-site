import { api } from '@/store/api';
import type { SitePage } from '@/types/sitePages';

type SitePagesApiResponse = {
  data: SitePage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const sitePagesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSitePages: builder.query<SitePage[], void>({
      query: () => '/pages',
      transformResponse: (response: SitePagesApiResponse) => response.data ?? [],
      
    }),

    getSitePageBySlug: builder.query<SitePage | null, string>({
      query: () => '/pages',
      transformResponse: (response: SitePagesApiResponse, _meta, slug) => {
        const pages = response.data ?? [];
        return pages.find((item) => item.slug === slug) ?? null;
      },
      
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSitePagesQuery,
  useGetSitePageBySlugQuery,
} = sitePagesApi;