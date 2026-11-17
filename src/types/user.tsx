export type LoginPayload = {
  phone: string;
  password: string;
};

export type AuthUser = {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string | null;
  phone_verified_at: string | null;
  code_expires_at: string | null;
  age_verified_at: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url?: string | null;
};

export type LoginApiResponse = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

export type CreateAccountPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  countryCode: string;
  address: string;
  city: string;
  deliveryZoneId: string;
  street: string;
};

export type CreateAccountRequest = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  deliveryZoneId: string;
  street: string;
};

export type CreateAccountResponse = {
  success: boolean;
  message: string;
};

export type VerifySignupPayload = {
  email: string;
  otp: string;
};

export type VerifySignupResponse = {
  success: boolean;
  message: string;
};

export type RefreshPayload = {
  refreshToken: string;
};

export type RefreshApiResponse = {
  access_token: string;
  refresh_token?: string;
};

export type ClientLoginResponse = {
  success: boolean;
  message: string;
  user: AuthUser;
};

export type MeResponse = {
  success: boolean;
  user: AuthUser;
};

export type UpdateProfilePayload = {
  first_name: string;
  last_name: string;
  email: string;
};

export type UpdateProfileResponse = {
  success: boolean;
  message: string;
  user: AuthUser;
};

export type ChangePasswordRequestPayload = {
  old_password: string;
  password: string;
  confirm_password: string;
};

export type ChangePasswordRequestResponse = {
  message: string;
  email: string;
  phone: string;
  phone_verification_otp?: string;
};

export type ChangePasswordVerifyPayload = {
  otp: string;
};

export type ChangePasswordVerifyResponse = {
  success?: boolean;
  message: string;
};

export type ForgotPasswordPayload = {
  phone: string;
};

export type ForgotPasswordResponse = {
  message: string;
  email: string;
  phone: string;
  phone_verification_otp?: string;
};

export type VerifyForgotPasswordPayload = {
  phone: string;
  otp: string;
  password: string;
};

export type VerifyForgotPasswordResponse = {
  success?: boolean;
  message?: string;
  user: AuthUser;
};