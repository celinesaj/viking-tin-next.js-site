import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AdminUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};

type AdminAuthState = {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
};

type AdminAuthPayload = {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
};

const initialState: AdminAuthState = {
  admin: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    hydrateAuth(
      state,
      action: PayloadAction<{
        admin: AdminUser | null;
        accessToken: string | null;
        refreshToken: string | null;
      }>,
    ) {
      state.admin = action.payload.admin;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isHydrated = true;
    },
    setCredentials(state, action: PayloadAction<AdminAuthPayload>) {
      state.admin = action.payload.admin;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateTokens(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string;
      }>,
    ) {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    logout(state) {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isHydrated = true;
    },
  },
});

export const { hydrateAuth, setCredentials, updateTokens, logout } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
