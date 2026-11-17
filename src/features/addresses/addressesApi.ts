import { api } from '@/store/api';
import type {
    UserAddress,
    CreateAddressPayload,
    UpdateAddressPayload,
} from '@/types/addresses';

export const addressesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getMyAddresses: builder.query<UserAddress[], void>({
            query: () => ({
                url: '/api/account/addresses',
                method: 'GET',
            }),
            providesTags: ['Address'],
        }),

        createAddress: builder.mutation<
            any,
            {
                zone_id: string;
                title: string;
                address_line: string;
                street: string;
                more_info?: string;
                is_default?: boolean;
            }
        >({
            query: (body) => ({
                url: '/api/account/addresses',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Address'],
        }),

        updateAddress: builder.mutation<UserAddress, UpdateAddressPayload>({
            query: ({ id, ...body }) => ({
                url: `/api/account/addresses/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Address'],
        }),

        deleteAddress: builder.mutation<{ message?: string }, string>({
            query: (id) => ({
                url: `/api/account/addresses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Address'],
        }),

    }),
    overrideExisting: true,
});

export const {
    useGetMyAddressesQuery,
    useCreateAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
} = addressesApi;