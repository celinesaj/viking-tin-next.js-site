import { api } from '@/store/api';
import type {
  CreateReviewPayload,
  CreateReviewResponse,
  GetReviewsParams,
  ReviewsApiResponse,
} from '@/types/reviews';

export const reviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReviewsByItem: builder.query<ReviewsApiResponse, GetReviewsParams>({
      query: ({ itemType, itemId }) =>
        `/product-reviews?itemType=${itemType}&itemId=${itemId}`,
      transformResponse: (response: ReviewsApiResponse | null) =>
        response ?? {
          itemName: '',
          itemType: 'product',
          itemId: '',
          reviews: [],
        },
      keepUnusedDataFor: 600,
      providesTags: (_result, _error, { itemType, itemId }) => [
        { type: 'Reviews', id: `${itemType}-${itemId}` },
      ],
    }),

    createReview: builder.mutation<CreateReviewResponse, CreateReviewPayload>({
      query: (body) => ({
        url: '/api/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { item_type, item_id }) => [
        { type: 'Reviews', id: `${item_type}-${item_id}` },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetReviewsByItemQuery,
  useCreateReviewMutation,
} = reviewsApi;