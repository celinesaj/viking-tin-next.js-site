import { api } from '@/store/api';
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  LoginPayload,
  ClientLoginResponse,
  VerifySignupPayload,
  VerifySignupResponse,
  MeResponse,
  ChangePasswordRequestResponse,
  ChangePasswordRequestPayload,
  ChangePasswordVerifyResponse,
  ChangePasswordVerifyPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  VerifyForgotPasswordPayload,
  VerifyForgotPasswordResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
} from '@/types/user';

type MessageResponse = {
  success: boolean;
  message: string;
};

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createAccount: builder.mutation<CreateAccountResponse, CreateAccountRequest>({
      query: (body) => ({
        url: '/api/auth/register',
        method: 'POST',
        body,
      }),
    }),

    verifySignup: builder.mutation<VerifySignupResponse, VerifySignupPayload>({
      query: (body) => ({
        url: '/api/auth/verify-signup',
        method: 'POST',
        body,
      }),
    }),

    login: builder.mutation<ClientLoginResponse, LoginPayload>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
    }),

    completePhoneRequest: builder.mutation<MessageResponse, { phone: string }>({
  query: (body) => ({
    url: '/api/auth/complete-phone/request',
    method: 'POST',
    body,
  }),
}),

completePhoneVerify: builder.mutation<
  MessageResponse,
  { phone: string; otp: string }
>({
  query: (body) => ({
    url: '/api/auth/complete-phone/verify',
    method: 'POST',
    body,
  }),
  invalidatesTags: ['User'],
}),

    refreshAuth: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: '/api/auth/refresh',
        method: 'POST',
      }),
    }),

    logout: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: '/api/auth/me',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<
      UpdateProfileResponse,
      UpdateProfilePayload
    >({
      query: ({ first_name, last_name, email }) => {
        const formData = new FormData();

        formData.append('first_name', first_name);
        formData.append('last_name', last_name);
        formData.append('email', email);

        return {
          url: '/api/auth/me',
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: ['User'],
    }),

    changePasswordRequest: builder.mutation<
      ChangePasswordRequestResponse,
      ChangePasswordRequestPayload
    >({
      query: (body) => ({
        url: '/api/auth/change-password/request',
        method: 'POST',
        body,
      }),
    }),

    changePasswordVerify: builder.mutation<
      ChangePasswordVerifyResponse,
      ChangePasswordVerifyPayload
    >({
      query: (body) => ({
        url: '/api/auth/change-password/verify',
        method: 'POST',
        body,
      }),
    }),

    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordPayload>({
      query: (body) => ({
        url: '/api/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    verifyForgotPassword: builder.mutation<
      VerifyForgotPasswordResponse,
      VerifyForgotPasswordPayload
    >({
      query: (body) => ({
        url: '/api/auth/verify-forgot-password',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateAccountMutation,
  useVerifySignupMutation,
  useLoginMutation,
  useRefreshAuthMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordRequestMutation,
  useChangePasswordVerifyMutation,
  useForgotPasswordMutation,
  useVerifyForgotPasswordMutation,


  useCompletePhoneRequestMutation,
  useCompletePhoneVerifyMutation,

} = authApi;