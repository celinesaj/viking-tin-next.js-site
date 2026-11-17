// src/utils/formatPrice.ts

import { CURRENCY } from '@/constants/currency';

export const formatPrice = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY.code,
  }).format(value);
};