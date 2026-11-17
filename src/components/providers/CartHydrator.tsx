'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hook';
import { hydrateCart } from '@/features/cart/cartSlice';
import type { CartItem } from '@/types/cart';

export default function CartHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      const cart = localStorage.getItem('cart');
      const parsed: CartItem[] = cart ? JSON.parse(cart) : [];
      dispatch(hydrateCart(parsed));
    } catch (error) {
      console.error('Failed to load cart', error);
      dispatch(hydrateCart([]));
    }
  }, [dispatch]);

  return null;
}