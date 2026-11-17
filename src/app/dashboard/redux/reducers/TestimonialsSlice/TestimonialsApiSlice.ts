import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';
import type { TestimonialsListResponse } from '@/types/testimonial';

export type GetDashboardTestimonialsParams = {
  page?: number;
  limit?: number;
  /** Omit to list all; backend accepts string "true" / "false" */
  is_active?: 'true' | 'false';
};

export type TestimonialWriteFields = {
  name: string;
  role: string;
  quote: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
  image?: File;
  image_url?: string;
};

export type CreateDashboardTestimonialPayload = TestimonialWriteFields;

export type UpdateDashboardTestimonialPayload = { id: string } & Partial<TestimonialWriteFields>;

function appendTestimonialFormFields(fd: FormData, body: TestimonialWriteFields) {
  fd.append('name', body.name);
  fd.append('role', body.role);
  fd.append('quote', body.quote);
  fd.append('rating', String(body.rating));
  fd.append('sort_order', String(body.sort_order));
  fd.append('is_active', body.is_active ? 'true' : 'false');
  if (body.image) {
    fd.append('image', body.image);
  } else if (body.image_url !== undefined && body.image_url.trim() !== '') {
    fd.append('image_url', body.image_url.trim());
  }
}

function appendIfDefined(fd: FormData, key: string, value: string | undefined) {
  if (value !== undefined) fd.append(key, value);
}

function buildCreateTestimonialFormData(body: CreateDashboardTestimonialPayload): FormData {
  const fd = new FormData();
  appendTestimonialFormFields(fd, body);
  return fd;
}

function buildPatchTestimonialFormData(
  patch: Omit<UpdateDashboardTestimonialPayload, 'id'>,
): FormData {
  const fd = new FormData();
  appendIfDefined(fd, 'name', patch.name);
  appendIfDefined(fd, 'role', patch.role);
  appendIfDefined(fd, 'quote', patch.quote);
  if (patch.rating !== undefined) fd.append('rating', String(patch.rating));
  if (patch.sort_order !== undefined) fd.append('sort_order', String(patch.sort_order));
  if (patch.is_active !== undefined) {
    fd.append('is_active', patch.is_active ? 'true' : 'false');
  }
  if (patch.image) {
    fd.append('image', patch.image);
  } else if (patch.image_url !== undefined) {
    const trimmed = patch.image_url.trim();
    if (trimmed !== '') fd.append('image_url', trimmed);
  }
  return fd;
}

export const testimonialsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardTestimonials: builder.query<
      TestimonialsListResponse,
      GetDashboardTestimonialsParams
    >({
      query: ({ page = 1, limit = 20, is_active }) => ({
        url: '/testimonials',
        method: 'GET',
        params: {
          page: String(page),
          limit: String(limit),
          ...(is_active !== undefined ? { is_active } : {}),
        },
      }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((t) => ({ type: 'Testimonial' as const, id: t.id })),
              { type: 'Testimonial' as const, id: 'LIST' },
            ]
          : [{ type: 'Testimonial' as const, id: 'LIST' }],
    }),
    createDashboardTestimonial: builder.mutation<void, CreateDashboardTestimonialPayload>({
      query: (body) => ({
        url: '/testimonials',
        method: 'POST',
        body: buildCreateTestimonialFormData(body),
      }),
      invalidatesTags: [{ type: 'Testimonial', id: 'LIST' }],
    }),
    updateDashboardTestimonial: builder.mutation<void, UpdateDashboardTestimonialPayload>({
      query: ({ id, ...patch }) => ({
        url: `/testimonials/${id}`,
        method: 'PATCH',
        body: buildPatchTestimonialFormData(patch),
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Testimonial', id },
        { type: 'Testimonial', id: 'LIST' },
      ],
    }),
    softDeleteDashboardTestimonial: builder.mutation<void, string>({
      query: (id) => ({
        url: `/testimonials/${id}/soft-delete`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Testimonial', id },
        { type: 'Testimonial', id: 'LIST' },
      ],
    }),
    deleteDashboardTestimonial: builder.mutation<void, string>({
      query: (id) => ({
        url: `/testimonials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Testimonial', id },
        { type: 'Testimonial', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardTestimonialsQuery,
  useCreateDashboardTestimonialMutation,
  useUpdateDashboardTestimonialMutation,
  useSoftDeleteDashboardTestimonialMutation,
  useDeleteDashboardTestimonialMutation,
} = testimonialsApiSlice;
