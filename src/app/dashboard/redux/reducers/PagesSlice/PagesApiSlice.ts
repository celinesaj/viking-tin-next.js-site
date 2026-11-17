import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';

export type DashboardPage = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  imageUrl1: string | null;
  imageUrl2: string | null;
  /** SEO — may come from API as `metaTitle` or `meta_title` */
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DashboardPagesListResponse = {
  data: DashboardPage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GetDashboardPagesParams = {
  page?: number;
  limit?: number;
};

export type DashboardPageWriteFields = {
  title: string;
  slug?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  image_url_1?: string;
  image_url_2?: string;
  image_1?: File;
  image_2?: File;
};

export type CreateDashboardPagePayload = DashboardPageWriteFields;
export type UpdateDashboardPagePayload = { id: string } & DashboardPageWriteFields;

/** API may return `meta_title` / `meta_description` (snake) or camelCase. */
type DashboardPageApiRow = DashboardPage & {
  meta_title?: string | null;
  meta_description?: string | null;
};

function normalizeDashboardPageRow(row: DashboardPageApiRow): DashboardPage {
  return {
    ...row,
    metaTitle: row.metaTitle ?? row.meta_title ?? null,
    metaDescription: row.metaDescription ?? row.meta_description ?? null,
  };
}

function appendPageWriteFields(fd: FormData, body: DashboardPageWriteFields) {
  fd.append('title', body.title);
  if (body.slug !== undefined && body.slug.trim() !== '') fd.append('slug', body.slug.trim());
  if (body.content !== undefined && body.content !== '') fd.append('content', body.content);

  if (body.meta_title !== undefined && body.meta_title.trim() !== '') {
    fd.append('meta_title', body.meta_title.trim());
  }
  if (body.meta_description !== undefined && body.meta_description.trim() !== '') {
    fd.append('meta_description', body.meta_description.trim());
  }

  if (body.image_1) {
    fd.append('image_1', body.image_1);
  } else if (body.image_url_1 !== undefined) {
    fd.append('image_url_1', body.image_url_1);
  }

  if (body.image_2) {
    fd.append('image_2', body.image_2);
  } else if (body.image_url_2 !== undefined) {
    fd.append('image_url_2', body.image_url_2);
  }
}

function buildCreatePageFormData(body: CreateDashboardPagePayload) {
  const fd = new FormData();
  appendPageWriteFields(fd, body);
  return fd;
}

function buildUpdatePageFormData(body: DashboardPageWriteFields) {
  const fd = new FormData();
  appendPageWriteFields(fd, body);
  return fd;
}

export const pagesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardPages: builder.query<DashboardPagesListResponse, GetDashboardPagesParams>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/pages',
        method: 'GET',
        params: {
          page: String(page),
          limit: String(limit),
        },
      }),
      transformResponse: (raw: DashboardPagesListResponse) => ({
        ...raw,
        data: raw.data.map((row) => normalizeDashboardPageRow(row as DashboardPageApiRow)),
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Page' as const, id: item.id })),
              { type: 'Page' as const, id: 'LIST' },
            ]
          : [{ type: 'Page' as const, id: 'LIST' }],
    }),
    getDashboardPageById: builder.query<DashboardPage, string>({
      query: (id) => ({
        url: `/pages/id/${id}`,
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => normalizeDashboardPageRow(raw as DashboardPageApiRow),
      providesTags: (_result, _error, id) => [{ type: 'Page' as const, id }],
    }),
    createDashboardPage: builder.mutation<DashboardPage, CreateDashboardPagePayload>({
      query: (body) => ({
        url: '/pages',
        method: 'POST',
        body: buildCreatePageFormData(body),
      }),
      invalidatesTags: [{ type: 'Page' as const, id: 'LIST' }],
    }),
    updateDashboardPage: builder.mutation<DashboardPage, UpdateDashboardPagePayload>({
      query: ({ id, ...body }) => ({
        url: `/pages/${id}`,
        method: 'PATCH',
        body: buildUpdatePageFormData(body),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Page' as const, id },
        { type: 'Page' as const, id: 'LIST' },
      ],
    }),
    deleteDashboardPage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/pages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Page' as const, id },
        { type: 'Page' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardPagesQuery,
  useGetDashboardPageByIdQuery,
  useCreateDashboardPageMutation,
  useUpdateDashboardPageMutation,
  useDeleteDashboardPageMutation,
} = pagesApiSlice;
