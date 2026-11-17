import { api } from '@/store/api';
import type { MarqueeItem } from '@/types/marquee';
import { mapMarqueeListResponse } from '@/features/marquee/marqueeMaps';

const marqueeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMarquee: builder.query<MarqueeItem[], void>({
      query: () => '/marque',
      transformResponse: (response: unknown) =>
        mapMarqueeListResponse(response).filter((item) => item.isActive),
      providesTags: [{ type: 'Marquee', id: 'PUBLIC' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMarqueeQuery } = marqueeApi;