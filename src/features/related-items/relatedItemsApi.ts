import { api } from '@/store/api';
import type {
    GetRelatedItemsParams,
    RelatedItem,
} from '@/types/related-items';

export const relatedItemsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getRelatedItems: builder.query<RelatedItem[], GetRelatedItemsParams>({
            query: ({ source_id, source_type }) => ({
                url: '/related-items',
                params: {
                    source_id,
                    source_type,
                },
            }),
            keepUnusedDataFor: 600,
        }),
    }),
    overrideExisting: true,
});

export const { useGetRelatedItemsQuery } = relatedItemsApi;