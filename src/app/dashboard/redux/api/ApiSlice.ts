import { api } from '@/store/api';

// Reuse the global RTK Query api instance for dashboard-only slices.
export const apiSlice = api;
