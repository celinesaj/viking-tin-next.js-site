import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import { normalizeStrengthLevelRow } from '@/lib/normalizeStrengthLevel';
import type { StrengthLevel, StrengthLevelsResponse } from '@/types/strength-lvl';

type GetDashboardStrengthLevelsArgs = {
  page?: number;
  limit?: number;
};

type CreateDashboardStrengthLevelRequest = {
  name: string;
  slug?: string;
  nicotineRange?: string;
  nicotineMg?: number;
  sortOrder: number;
};

type UpdateDashboardStrengthLevelRequest = {
  id: string;
  name?: string;
  slug?: string;
  nicotineRange?: string;
  nicotineMg?: number;
  sortOrder?: number;
};

type StrengthLevelWriteFields = Pick<
  CreateDashboardStrengthLevelRequest,
  'name' | 'slug' | 'nicotineRange' | 'nicotineMg' | 'sortOrder'
>;

/** Backend DTOs use snake_case (e.g. ValidationPipe + class-validator). */
function toStrengthLevelWriteBody(input: Partial<StrengthLevelWriteFields>): Record<string, string | number> {
  const body: Record<string, string | number> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.slug !== undefined) body.slug = input.slug;
  if (input.nicotineRange !== undefined) body.nicotine_range = input.nicotineRange;
  if (input.nicotineMg !== undefined) body.nicotine_mg = Number(input.nicotineMg);
  if (input.sortOrder !== undefined) {
    body.sort_order = Number(input.sortOrder);
  }
  return body;
}

export const strengthLevelsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStrengthLevels: builder.query<StrengthLevelsResponse, GetDashboardStrengthLevelsArgs>({
      query: ({ page = 1, limit = 20 }) => ({
        url: '/strength-levels',
        method: 'GET',
        params: { page, limit },
      }),
      transformResponse: (response: StrengthLevelsResponse): StrengthLevelsResponse => ({
        ...response,
        data: response.data.map((row) => normalizeStrengthLevelRow(row)),
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({ type: 'StrengthLevel' as const, id: row.id })),
              { type: 'StrengthLevel' as const, id: 'LIST' },
            ]
          : [{ type: 'StrengthLevel' as const, id: 'LIST' }],
    }),
    createDashboardStrengthLevel: builder.mutation<StrengthLevel, CreateDashboardStrengthLevelRequest>({
      query: (body) => ({
        url: '/strength-levels',
        method: 'POST',
        body: toStrengthLevelWriteBody(body),
      }),
      transformResponse: (row: StrengthLevel & { nicotine_mg?: number | string | null }) =>
        normalizeStrengthLevelRow(row),
      invalidatesTags: [{ type: 'StrengthLevel', id: 'LIST' }],
    }),
    updateDashboardStrengthLevel: builder.mutation<StrengthLevel, UpdateDashboardStrengthLevelRequest>({
      query: ({ id, ...patch }) => ({
        url: `/strength-levels/${id}`,
        method: 'PATCH',
        body: toStrengthLevelWriteBody(patch),
      }),
      transformResponse: (row: StrengthLevel & { nicotine_mg?: number | string | null }) =>
        normalizeStrengthLevelRow(row),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'StrengthLevel', id },
        { type: 'StrengthLevel', id: 'LIST' },
      ],
    }),
    deleteDashboardStrengthLevel: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/strength-levels/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'StrengthLevel', id },
        { type: 'StrengthLevel', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardStrengthLevelsQuery,
  useLazyGetDashboardStrengthLevelsQuery,
  useCreateDashboardStrengthLevelMutation,
  useUpdateDashboardStrengthLevelMutation,
  useDeleteDashboardStrengthLevelMutation,
} = strengthLevelsApiSlice;
