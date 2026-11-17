import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { ContactInfoApiRow, ContactInfoResponse } from '@/types/contact';

type GetDashboardContactInfoArgs = {
  page?: number;
  limit?: number;
  /** Exact match filter (optional) */
  type?: string;
};

type CreateDashboardContactInfoRequest = {
  type: string;
  title: string;
  value: string;
  sortOrder: number;
};

type UpdateDashboardContactInfoRequest = {
  id: string;
  type: string;
  title: string;
  value: string;
  sortOrder: number;
};

function contactInfoWriteBody(
  input: Pick<CreateDashboardContactInfoRequest, 'type' | 'title' | 'value' | 'sortOrder'>,
) {
  return {
    type: input.type.trim(),
    title: input.title.trim(),
    value: input.value.trim(),
    sort_order: input.sortOrder,
  };
}

export const contactInfoApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardContactInfo: builder.query<ContactInfoResponse, GetDashboardContactInfoArgs>({
      query: ({ page = 1, limit = 20, type }) => ({
        url: '/contact-info',
        method: 'GET',
        params: {
          page: String(page),
          limit: String(limit),
          ...(type?.trim() ? { type: type.trim() } : {}),
        },
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({ type: 'ContactInfo' as const, id: row.id })),
              { type: 'ContactInfo' as const, id: 'LIST' },
            ]
          : [{ type: 'ContactInfo' as const, id: 'LIST' }],
    }),
    createDashboardContactInfo: builder.mutation<
      ContactInfoApiRow,
      CreateDashboardContactInfoRequest
    >({
      query: (body) => ({
        url: '/contact-info',
        method: 'POST',
        body: contactInfoWriteBody(body),
      }),
      invalidatesTags: [{ type: 'ContactInfo', id: 'LIST' }],
    }),
    updateDashboardContactInfo: builder.mutation<
      ContactInfoApiRow,
      UpdateDashboardContactInfoRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/contact-info/${id}`,
        method: 'PATCH',
        body: contactInfoWriteBody(body),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ContactInfo', id },
        { type: 'ContactInfo', id: 'LIST' },
      ],
    }),
    deleteDashboardContactInfo: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/contact-info/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ContactInfo', id },
        { type: 'ContactInfo', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardContactInfoQuery,
  useCreateDashboardContactInfoMutation,
  useUpdateDashboardContactInfoMutation,
  useDeleteDashboardContactInfoMutation,
} = contactInfoApiSlice;
