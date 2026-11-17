import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '@/features/cart/cartSlice';
import adminAuthReducer from '@/features/admin-auth/adminAuthSlice';
import { api } from './api';
import '@/features/admin-auth/adminAuthApi';
import '@/features/dashboard-search/dashboardSearchApi';
import '@/features/products/productsApi';
import couponReducer from '@/features/coupons/couponSlice';
import freebieReducer from '@/features/freebie/freebieSlice';
import '@/features/freebie/freebiesAdminApi';
import '@/features/contact-form/contactFormApi';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    adminAuth: adminAuthReducer,
    coupon: couponReducer,
    freebie: freebieReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

if (typeof window !== 'undefined') {
  let prevCartJson = JSON.stringify(store.getState().cart.items);
  store.subscribe(() => {
    try {
      const json = JSON.stringify(store.getState().cart.items);
      if (json === prevCartJson) return;
      prevCartJson = json;
      localStorage.setItem('cart', json);
    } catch (error) {
      console.error('Failed to save cart', error);
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;