import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { ContactSocialLinkApiRow, ContactSocialLinksResponse } from '@/types/contact';

type GetDashboardContactSocialLinksArgs = {
  page?: number;
  limit?: number;
  /** When set, sent as query string (e.g. "true" / "false") */
  isActive?: boolean;
  /** Exact match filter (optional) */
  platform?: string;
};

type CreateDashboardContactSocialLinkRequest = {
  platform: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
};

type UpdateDashboardContactSocialLinkRequest = {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
};

function contactSocialLinkWriteBody(
  input: Pick<
    CreateDashboardContactSocialLinkRequest,
    'platform' | 'url' | 'sortOrder' | 'isActive'
  >,
) {
  return {
    platform: input.platform.trim(),
    url: input.url.trim(),
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
}

export const contactSocialLinksApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardContactSocialLinks: builder.query<
      ContactSocialLinksResponse,
      GetDashboardContactSocialLinksArgs
    >({
      query: ({ page = 1, limit = 20, isActive, platform }) => ({
        url: '/contact-social-links',
        method: 'GET',
        params: {
          page: String(page),
          limit: String(limit),
          ...(isActive !== undefined ? { is_active: String(isActive) } : {}),
          ...(platform?.trim() ? { platform: platform.trim() } : {}),
        },
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({
                type: 'ContactSocialLink' as const,
                id: row.id,
              })),
              { type: 'ContactSocialLink' as const, id: 'LIST' },
            ]
          : [{ type: 'ContactSocialLink' as const, id: 'LIST' }],
    }),
    createDashboardContactSocialLink: builder.mutation<
      ContactSocialLinkApiRow,
      CreateDashboardContactSocialLinkRequest
    >({
      query: (body) => ({
        url: '/contact-social-links',
        method: 'POST',
        body: contactSocialLinkWriteBody(body),
      }),
      invalidatesTags: [{ type: 'ContactSocialLink', id: 'LIST' }],
    }),
    updateDashboardContactSocialLink: builder.mutation<
      ContactSocialLinkApiRow,
      UpdateDashboardContactSocialLinkRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/contact-social-links/${id}`,
        method: 'PATCH',
        body: contactSocialLinkWriteBody(body),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ContactSocialLink', id },
        { type: 'ContactSocialLink', id: 'LIST' },
      ],
    }),
    deleteDashboardContactSocialLink: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/contact-social-links/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ContactSocialLink', id },
        { type: 'ContactSocialLink', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardContactSocialLinksQuery,
  useCreateDashboardContactSocialLinkMutation,
  useUpdateDashboardContactSocialLinkMutation,
  useDeleteDashboardContactSocialLinkMutation,
} = contactSocialLinksApiSlice;
