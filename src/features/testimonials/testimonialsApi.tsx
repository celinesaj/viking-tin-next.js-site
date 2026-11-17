import { api } from '@/store/api';
import type { Testimonial, TestimonialsResponse } from '@/types/testimonials';

type GetTestimonialsParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

export const testimonialsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTestimonials: builder.query<
      TestimonialsResponse,
      GetTestimonialsParams | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        const safeParams = params ?? {};

        if (safeParams.page) {
          searchParams.set('page', String(safeParams.page));
        }

        if (safeParams.limit) {
          searchParams.set('limit', String(safeParams.limit));
        }

        if (safeParams.is_active !== undefined) {
          searchParams.set('is_active', String(safeParams.is_active));
        }

        const queryString = searchParams.toString();

        return `/testimonials${queryString ? `?${queryString}` : ''}`;
      },
    }),

    getTestimonialById: builder.query<Testimonial, string>({
      query: (id) => `/testimonials/${id}`,
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetTestimonialByIdQuery,
} = testimonialsApi;