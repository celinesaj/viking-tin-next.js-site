import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';

type DashboardBrandStatus = 'active' | 'inactive';

type DashboardBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  story: string | null;
  status?: DashboardBrandStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

type UpdateDashboardBrandRequest = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  story?: string;
  logo?: File;
  status?: DashboardBrandStatus;
};

type CreateDashboardBrandRequest = {
  name: string;
  slug?: string;
  description?: string;
  story?: string;
  logo?: File;
  status?: DashboardBrandStatus;
};

export const brandsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardBrands: builder.query<DashboardBrand[], void>({
      query: () => ({
        url: '/brands',
        method: 'GET',
      }),
      transformResponse: (response: unknown): DashboardBrand[] => {
        const list = Array.isArray(response) ? response : [];
        return list.map((row) => {
          const brand = row as DashboardBrand;
          return { ...brand, id: String(brand.id) };
        });
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((brand) => ({ type: 'Brand' as const, id: brand.id })),
              { type: 'Brand' as const, id: 'LIST' },
            ]
          : [{ type: 'Brand' as const, id: 'LIST' }],
    }),
    createDashboardBrand: builder.mutation<DashboardBrand, CreateDashboardBrandRequest>({
      query: ({ name, slug, description, story, logo, status }) => {
        const formData = new FormData();
        formData.append('name', name);
        if (slug !== undefined && slug !== '') formData.append('slug', slug);
        if (description !== undefined && description !== '') {
          formData.append('description', description);
        }
        if (story !== undefined && story !== '') formData.append('story', story);
        if (logo) formData.append('logo', logo);
        if (status !== undefined) formData.append('status', status);

        return {
          url: '/brands',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Brand' as const, id: 'LIST' }],
    }),
    deleteDashboardBrand: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Brand' as const, id },
        { type: 'Brand' as const, id: 'LIST' },
      ],
    }),
    updateDashboardBrand: builder.mutation<DashboardBrand, UpdateDashboardBrandRequest>({
      query: ({ id, name, slug, description, story, logo, status }) => {
        const formData = new FormData();

        if (name !== undefined) formData.append('name', name);
        if (slug !== undefined) formData.append('slug', slug);
        if (description !== undefined) formData.append('description', description);
        if (story !== undefined) formData.append('story', story);
        if (logo) formData.append('logo', logo);
        if (status !== undefined) formData.append('status', status);

        return {
          url: `/brands/${id}`,
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Brand' as const, id },
        { type: 'Brand' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardBrandsQuery,
  useCreateDashboardBrandMutation,
  useDeleteDashboardBrandMutation,
  useUpdateDashboardBrandMutation,
} = brandsApiSlice;
