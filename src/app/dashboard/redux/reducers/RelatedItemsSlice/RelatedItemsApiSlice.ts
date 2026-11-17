import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type {
  CreateRelatedItemBody,
  RelatedItemLink,
  RelatedItemSourceSummary,
  RelatedResourceType,
} from '@/types/relatedItems';

type GetRelatedItemsArgs = {
  source_id: string;
  source_type: RelatedResourceType;
};

function relatedItemLinkTags(sourceType: RelatedResourceType, sourceId: string) {
  return [
    { type: 'RelatedItem' as const, id: `LINKS:${sourceType}:${sourceId}` },
    { type: 'RelatedItem' as const, id: 'SOURCES' },
  ];
}

export const relatedItemsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRelatedItemSources: builder.query<RelatedItemSourceSummary[], void>({
      query: () => ({
        url: '/related-items/sources',
        method: 'GET',
      }),
      providesTags: [{ type: 'RelatedItem', id: 'SOURCES' }],
    }),
    getRelatedItemsForSource: builder.query<RelatedItemLink[], GetRelatedItemsArgs>({
      query: ({ source_id, source_type }) => ({
        url: '/related-items',
        method: 'GET',
        params: {
          source_id,
          source_type,
        },
      }),
      providesTags: (_result, _err, { source_type, source_id }) => [
        { type: 'RelatedItem', id: `LINKS:${source_type}:${source_id}` },
      ],
    }),
    createRelatedItem: builder.mutation<RelatedItemLink, CreateRelatedItemBody>({
      query: (body) => ({
        url: '/related-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, body) =>
        relatedItemLinkTags(body.source_type, String(body.source_id)),
    }),
    updateRelatedItemSort: builder.mutation<
      RelatedItemLink,
      { id: string; sort_order: number; sourceType: RelatedResourceType; sourceId: string }
    >({
      query: ({ id, sort_order }) => ({
        url: `/related-items/${id}`,
        method: 'PATCH',
        body: { sort_order },
      }),
      invalidatesTags: (_result, _err, { sourceType, sourceId }) =>
        relatedItemLinkTags(sourceType, sourceId),
    }),
    deleteRelatedItem: builder.mutation<
      { message?: string },
      { id: string; sourceType: RelatedResourceType; sourceId: string }
    >({
      query: ({ id }) => ({
        url: `/related-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { sourceType, sourceId }) =>
        relatedItemLinkTags(sourceType, sourceId),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetRelatedItemSourcesQuery,
  useGetRelatedItemsForSourceQuery,
  useCreateRelatedItemMutation,
  useUpdateRelatedItemSortMutation,
  useDeleteRelatedItemMutation,
} = relatedItemsApiSlice;
