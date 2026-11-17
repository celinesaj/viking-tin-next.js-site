import { api } from '@/store/api';
import type { FaqResponse } from '@/types/faq';

type GetFaqParams = {
  page?: number;
  limit?: number;
  is_published?: boolean;
};

export const faqApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFaq: builder.query<FaqResponse, GetFaqParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        searchParams.set('page', String(params?.page ?? 1));
        searchParams.set('limit', String(params?.limit ?? 20));
        searchParams.set('is_published', String(params?.is_published ?? true));

        return `/faq?${searchParams.toString()}`;
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetFaqQuery } = faqApi;